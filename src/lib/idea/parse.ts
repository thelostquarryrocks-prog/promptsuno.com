// Idea -> tags: the deterministic first pass of the generator pipeline.
//
// Plain code, no model cost. It finds style names and aliases in a free-text
// idea (longest phrase wins), works out what the person said "no" to, sets the
// lyrical subject ("about ...") aside, and flags when a small model should take
// a second look. Server-only, because it reads the catalog.

import { getStyle } from "@/lib/catalog";
import type { StyleCategory } from "@/lib/catalog/types";
import { pairScore } from "@/lib/engine";
import { lexicon, type LexEntry } from "./lexicon";
import { stem, tokenize, type Token } from "./tokenize";
import type { IdeaMatch, IdeaParse } from "./types";

/** Words that start the song's subject. Text after them is theme, not style. */
const THEME_START = new Set(["about", "called", "titled", "named"]);
/** Words that end the subject and return to describing the sound. */
const THEME_END = new Set(["with", "using", "featuring", "feat", "ft", "over", "but", "sounding", "sounds"]);
/** Inside the subject, only these categories still count ("about heartbreak" sets a mood). */
const THEME_CATEGORIES = new Set<StyleCategory>(["mood", "energy", "era"]);

const NEGATORS = new Set([
  "no", "without", "not", "never", "minus", "except", "avoid", "exclude", "excluding", "skip", "zero",
  "don't", "dont", "nothing",
]);
/** A negation covers a list ("no drums or bass") and stops at these. */
const NEGATION_END = new Set([
  "but", "and", "with", "just", "only", "instead", "though", "then", "plus", "featuring", "using", "yet",
]);

/** Two-word openers for a reference; single "like" is handled separately. */
const REFERENCE_PAIRS = [
  ["style", "of"],
  ["inspired", "by"],
  ["reminiscent", "of"],
  ["influenced", "by"],
];
/** Lowercase words allowed inside a capitalized name run ("Rage Against the Machine"). */
const NAME_CONNECTORS = new Set(["the", "of", "and", "n", "'n'", "de", "la", "del", "von", "van"]);

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "nor", "but", "of", "in", "on", "at", "to", "for", "from", "by", "into",
  "onto", "as", "with", "over", "under", "up", "down", "out", "off", "is", "are", "was", "be", "been",
  "being", "it", "its", "it's", "this", "that", "these", "those", "i", "i'm", "i'd", "me", "my", "we",
  "our", "you", "your", "he", "she", "they", "them", "their", "his", "her", "who", "which", "what",
  "some", "any", "all", "very", "really", "more", "less", "most", "much", "bit", "little", "lot", "lots",
  "kinda", "kind", "sort", "sorta", "type", "maybe", "please", "can", "could", "would", "should",
  "will", "want", "wanna", "need", "make", "write", "create", "give", "get", "have", "has", "had",
  "like", "just", "also", "mostly", "plus", "using", "featuring", "feat", "ft", "then", "than", "so",
  "too", "quite", "pretty", "super", "same", "other", "one", "two", "song", "songs", "track", "tracks",
  "tune", "tunes", "music", "piece", "vibe", "vibes", "vibey", "feel", "feeling", "feels", "sound",
  "sounds", "sounding", "style", "styled", "something", "thing", "stuff", "mood", "genre", "inspired",
  "influenced", "reminiscent", "bpm", "where", "when", "while", "if", "into", "lots", "bunch", "full",
  "ish", "yet", "only", "instead", "though", "both", "either", "each",
  ...NEGATORS,
  ...THEME_START,
]);

const BPM = /\b(\d{2,3})\s*-?\s*bpm\b/i;
const MIN_BPM = 40;
const MAX_BPM = 240;
/** Prior for an ambiguous alias's own ordering, and for launch styles. Small: fit decides. */
const ORDER_PRIOR = 0.02;
const LAUNCH_PRIOR = 0.05;

interface RawMatch {
  first: number;
  last: number;
  entry: LexEntry;
}

/** Index ranges [from, to] of the subject clause(s). */
function themeRanges(tokens: Token[]): [number, number][] {
  const ranges: [number, number][] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!THEME_START.has(tokens[i].norm)) continue;
    let j = i + 1;
    while (j < tokens.length && !tokens[j].boundary && !THEME_END.has(tokens[j].norm)) {
      // "in the style of" also ends the subject
      if (tokens[j].norm === "in" && tokens[j + 2]?.norm === "style") break;
      j++;
    }
    if (j > i + 1) ranges.push([i + 1, j - 1]);
    i = j - 1;
  }
  return ranges;
}

/** Adjective-like categories where "darker" can safely mean "dark". */
const COMPARABLE = new Set<StyleCategory>(["mood", "energy", "texture", "rhythm"]);

/** "darker" -> Dark, "dreamier" -> Dreamy, "slowest" -> Slow Tempo. Single words only. */
function comparative(word: string, exact: Map<string, LexEntry>): LexEntry | undefined {
  if (word.length < 5) return undefined;
  const bases = [
    word.replace(/ier$/, "y"),
    word.replace(/iest$/, "y"),
    word.replace(/er$/, ""),
    word.replace(/est$/, ""),
    word.replace(/r$/, ""),
    word.replace(/st$/, ""),
    word.replace(/(.)\1er$/, "$1"), // "bigger" -> "big"
  ];
  for (const b of bases) {
    if (b === word) continue;
    const entry = exact.get(b);
    if (entry && entry.styles.every((s) => COMPARABLE.has(getStyle(s)!.category))) return entry;
  }
  return undefined;
}

function findMatches(tokens: Token[], inTheme: (i: number) => boolean): RawMatch[] {
  const { exact, stemmed, maxWords } = lexicon();
  const out: RawMatch[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].boundary) {
      i++;
      continue;
    }
    let hit: RawMatch | undefined;
    for (let n = maxWords; n >= 1 && !hit; n--) {
      const slice = tokens.slice(i, i + n);
      if (slice.length < n || slice.some((t) => t.boundary)) continue;
      const words = slice.map((t) => t.norm);
      let entry =
        exact.get(words.join(" ")) ??
        stemmed.get(words.map(stem).join(" ")) ??
        (n === 1 ? comparative(words[0], exact) : undefined);
      if (!entry) continue;
      if (slice.some((_, k) => inTheme(i + k))) {
        // Inside the subject only mood-like candidates count ("night" -> Nocturnal, not Atmospheric).
        const styles = entry.styles.filter((s) => THEME_CATEGORIES.has(getStyle(s)!.category));
        if (styles.length === 0) continue;
        entry = { ...entry, styles };
      }
      hit = { first: i, last: i + n - 1, entry };
    }
    if (hit) {
      out.push(hit);
      i = hit.last + 1;
    } else {
      i++;
    }
  }
  return out;
}

/**
 * Artist references: a run of capitalized words after "like", "in the style of",
 * "inspired by" and so on. If any word in the run isn't a style, it's a name
 * (Suno rejects artist names), so the run becomes a reference and any style
 * words inside it ("Daft Punk") are dropped.
 */
function findReferences(tokens: Token[], covered: (i: number) => boolean): [number, number][] {
  const runs: [number, number][] = [];
  for (let i = 0; i < tokens.length; i++) {
    let start = -1;
    if (tokens[i].norm === "like") start = i + 1;
    for (const [w1, w2] of REFERENCE_PAIRS) {
      if (tokens[i].norm === w1 && tokens[i + 1]?.norm === w2) start = i + 2;
    }
    if (start < 0) continue;
    let end = start - 1;
    for (let j = start; j < tokens.length; j++) {
      const t = tokens[j];
      if (t.boundary) break;
      if (t.capitalized || /^\d/.test(t.raw)) {
        end = j;
        continue;
      }
      // connectors only count if a capitalized word follows
      if (NAME_CONNECTORS.has(t.norm) && end >= start - 1 && tokens[j + 1]?.capitalized) continue;
      break;
    }
    if (end < start) continue;
    let k = start;
    // a leading connector ("like the Beatles") isn't part of the name
    while (k <= end && !tokens[k].capitalized && !/^\d/.test(tokens[k].raw)) k++;
    if (k > end) continue;
    let allStyles = true;
    for (let j = k; j <= end; j++) if (tokens[j].capitalized && !covered(j)) allStyles = false;
    if (!allStyles) runs.push([k, end]);
    i = end;
  }
  return runs;
}

function negatedTokens(tokens: Token[], covered: (i: number) => boolean, inTheme: (i: number) => boolean) {
  const negated = new Set<number>();
  const themeNegated = new Set<number>();
  for (let i = 0; i < tokens.length; i++) {
    if (!NEGATORS.has(tokens[i].norm) || covered(i)) continue;
    for (let j = i + 1; j < tokens.length; j++) {
      const t = tokens[j];
      if (t.boundary || NEGATION_END.has(t.norm)) break;
      (inTheme(i) ? themeNegated : negated).add(j);
    }
  }
  return { negated, themeNegated };
}

/** Categories where only the genre decides between candidates ("guitar" in shoegaze). */
const GENRE_DECIDED = new Set<StyleCategory>(["instrument", "vocal", "production", "rhythm", "structure"]);

/**
 * Choose among an ambiguous alias's styles by how well each fits the rest of
 * the idea. Sound sources are judged against genres only: a mood shouldn't pick
 * the guitar. With no evidence, the curated alias order decides.
 */
function pickBest(candidates: string[], context: string[]): string {
  if (candidates.length === 1) return candidates[0];
  const genres = context.filter((x) => getStyle(x)!.category === "genre");
  let best = candidates[0];
  let bestScore = -Infinity;
  candidates.forEach((c, idx) => {
    const style = getStyle(c)!;
    const judges = GENRE_DECIDED.has(style.category) ? genres : context;
    let s = -ORDER_PRIOR * idx + (style.launch ? LAUNCH_PRIOR : 0);
    for (const x of judges) if (x !== c) s += pairScore(c, x).score;
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  });
  return best;
}

const unique = <T,>(xs: T[]) => [...new Set(xs)];

/** Parse a free-text song idea into style chips, excludes, and leftovers. Deterministic. */
export function parseIdea(idea: string): IdeaParse {
  const tokens = tokenize(idea);

  const themes = themeRanges(tokens);
  const inTheme = (i: number) => themes.some(([a, b]) => i >= a && i <= b);

  let raw = findMatches(tokens, inTheme);
  const coveredBy = (ms: RawMatch[]) => (i: number) => ms.some((m) => i >= m.first && i <= m.last);

  const refRuns = findReferences(tokens, coveredBy(raw));
  const inRef = (i: number) => refRuns.some(([a, b]) => i >= a && i <= b);
  raw = raw.filter((m) => !inRef(m.first));

  const covered = coveredBy(raw);
  const { negated, themeNegated } = negatedTokens(tokens, covered, inTheme);
  // "about not being sad": a negation inside the subject is story, not an instruction. Drop it.
  raw = raw.filter((m) => !themeNegated.has(m.first));

  // Resolve picks: settled matches first, then ambiguous ones in order of appearance.
  const picks = new Map<RawMatch, string>();
  const context: string[] = [];
  for (const m of raw) {
    if (m.entry.styles.length === 1) {
      picks.set(m, m.entry.styles[0]);
      if (!negated.has(m.first)) context.push(m.entry.styles[0]);
    }
  }
  for (const m of raw) {
    if (picks.has(m)) continue;
    const pick = pickBest(m.entry.styles, context);
    picks.set(m, pick);
    if (!negated.has(m.first)) context.push(pick);
  }

  const matches: IdeaMatch[] = raw.map((m) => {
    const pick = picks.get(m)!;
    const start = tokens[m.first].start;
    const end = tokens[m.last].end;
    return {
      text: idea.slice(start, end),
      start,
      end,
      candidates: [pick, ...m.entry.styles.filter((s) => s !== pick)],
      pick,
      category: getStyle(pick)!.category,
      via: m.entry.via,
      negated: negated.has(m.first),
    };
  });

  // Something asked for positively anywhere wins over a "no" elsewhere.
  const tags = unique(matches.filter((m) => !m.negated).map((m) => m.pick));
  // "no drums" means every kind of drums: a negated generic word excludes all its candidates.
  const exclude = unique(matches.filter((m) => m.negated).flatMap((m) => m.candidates)).filter(
    (s) => !tags.includes(s),
  );

  const alternatives = unique(
    matches.filter((m) => !m.negated && m.candidates.length > 1).map((m) => m.pick),
  ).map(
    (pick) => ({
      pick,
      options: unique(
        matches.filter((m) => !m.negated && m.pick === pick).flatMap((m) => m.candidates.slice(1)),
      ),
    }),
  );

  const bpmMatch = BPM.exec(idea);
  const bpmValue = bpmMatch ? Number(bpmMatch[1]) : NaN;
  const bpm = bpmValue >= MIN_BPM && bpmValue <= MAX_BPM ? bpmValue : null;

  const theme = themes.length
    ? themes.map(([a, b]) => idea.slice(tokens[a].start, tokens[b].end)).join("; ")
    : null;

  const references = refRuns.map(([a, b]) => idea.slice(tokens[a].start, tokens[b].end));

  const finalCovered = coveredBy(raw);
  const unmatched = unique(
    tokens
      .filter((t, i) => !t.boundary && !inTheme(i) && !finalCovered(i) && !inRef(i))
      .map((t) => t.norm)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w)),
  );

  const needsModel = tags.length === 0 || references.length > 0 || unmatched.length >= 2;

  return { idea, tags, exclude, alternatives, matches, theme, bpm, references, unmatched, needsModel };
}
