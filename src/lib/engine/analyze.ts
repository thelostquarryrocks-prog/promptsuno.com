// The style engine: turns a set of tags into a structured brief for the prompt
// writer. Plain code, no model calls, deterministic for a given input.
//
// Server-only (it reads the catalog).

import {
  allStyles,
  catalogVersion,
  getEdge,
  getNeighbors,
  getStyle,
  resolveTerm,
} from "@/lib/catalog";
import type { Style, StyleCategory } from "@/lib/catalog/types";
import {
  EXCLUDABLE_CATEGORIES,
  EXCLUSIVE_GROUPS,
  GAP_CATEGORIES,
  SECTION_TAGS,
  SOURCE_TRUST,
  STRETCH_BELOW,
  STYLE_MAX_CHARS,
  STYLE_TARGET_CHARS,
  tensionHint,
} from "./config";
import type {
  AnalyzeOptions,
  Brief,
  Clash,
  Conflict,
  ExcludeItem,
  PairReport,
  ResolvedTerm,
  SelectedStyle,
  StyleRole,
  Suggestion,
  Tension,
} from "./types";

const TENSION_PENALTY = 0.3;
const CLASH_PENALTY = 1.0;
const CORE_COHESION = 0.35;
const OUTLIER_BELOW = -0.05;
const STRONG_FIT = 0.6;
const GAP_BONUS = 0.15;
const OBSERVED_BONUS = 0.02;
const MAX_PER_CATEGORY = 2;
const CONCRETE_EXCLUDES = new Set<StyleCategory>(["genre", "instrument", "vocal", "production"]);

/** Trust-weighted score for one pair: positive for fits, negative for tensions and clashes. */
export function pairScore(a: string, b: string): PairReport {
  const e = getEdge(a, b);
  const [x, y] = a < b ? [a, b] : [b, a];
  if (!e) return { a: x, b: y, kind: "unknown", weight: null, source: null, score: 0 };
  const trust = SOURCE_TRUST[e.source];
  const score =
    e.kind === "affinity"
      ? e.weight * trust
      : e.kind === "tension"
        ? -TENSION_PENALTY * trust
        : -CLASH_PENALTY * trust;
  return { a: x, b: y, kind: e.kind, weight: e.weight, source: e.source, score };
}

function resolveAll(terms: string[]): {
  resolved: ResolvedTerm[];
  unresolved: string[];
  names: string[];
} {
  const resolved: ResolvedTerm[] = [];
  const unresolved: string[] = [];
  const names: string[] = [];
  for (const raw of terms) {
    const term = raw.trim();
    if (!term) continue;
    const hits = resolveTerm(term);
    if (hits.length === 0) {
      unresolved.push(term);
      continue;
    }
    resolved.push({ term, styles: hits.map((s) => s.name) });
    for (const s of hits) if (!names.includes(s.name)) names.push(s.name);
  }
  return { resolved, unresolved, names };
}

function assignRoles(
  names: string[],
  cohesion: Map<string, number>,
  clashing: Set<string>,
): Map<string, StyleRole> {
  const roles = new Map<string, StyleRole>();
  if (names.length === 0) return roles;

  const byCohesion = (list: string[]) =>
    [...list].sort((p, q) => cohesion.get(q)! - cohesion.get(p)! || names.indexOf(p) - names.indexOf(q));

  const genres = names.filter((n) => getStyle(n)!.category === "genre");
  const anchor = byCohesion(genres.length ? genres : names)[0];

  for (const n of names) {
    const c = cohesion.get(n)!;
    if (n === anchor) roles.set(n, "anchor");
    else if (c < OUTLIER_BELOW) roles.set(n, clashing.has(n) ? "outlier" : "contrast");
    else if (names.length <= 2 || c >= CORE_COHESION) roles.set(n, "core");
    else roles.set(n, "support");
  }
  return roles;
}

function findConflicts(names: string[]): Conflict[] {
  const conflicts: Conflict[] = [];
  for (const [group, members] of Object.entries(EXCLUSIVE_GROUPS)) {
    const picked = names.filter((n) => members.includes(n));
    if (picked.length > 1) {
      conflicts.push({
        type: "exclusive-group",
        group,
        styles: picked,
        message: `Only one ${group} can apply; ${picked.join(" and ")} contradict each other.`,
      });
    }
  }
  return conflicts;
}

function suggest(
  allNames: string[],
  roles: Map<string, StyleRole>,
  options: Required<AnalyzeOptions>,
  avoid: ReadonlySet<string>,
): Suggestion[] {
  // Suggestions build on what the engine would keep: outliers are excluded from the basis.
  const names = allNames.filter((n) => roles.get(n) !== "outlier");
  if (names.length === 0) return [];
  const selected = new Set(allNames);
  const coveredCategories = new Set(names.map((n) => getStyle(n)!.category));
  const blockedByGroup = new Set<string>();
  for (const members of Object.values(EXCLUSIVE_GROUPS)) {
    if (members.some((m) => selected.has(m))) members.forEach((m) => blockedByGroup.add(m));
  }

  const candidates = new Set<string>();
  for (const n of names) {
    for (const e of getNeighbors(n)) {
      if (e.kind !== "affinity") continue;
      candidates.add(e.a === n ? e.b : e.a);
    }
  }

  const required = Math.min(2, names.length);
  const scored: Suggestion[] = [];
  for (const c of candidates) {
    if (selected.has(c) || avoid.has(c) || blockedByGroup.has(c) || SECTION_TAGS.has(c)) continue;
    const style = getStyle(c)!;
    if (options.library === "launch" && !style.launch) continue;

    let sum = 0;
    let clashes = false;
    const because: string[] = [];
    for (const n of names) {
      const p = pairScore(c, n);
      if (p.kind === "clash") clashes = true;
      sum += p.score;
      if (p.kind === "affinity" && p.weight! >= STRONG_FIT) because.push(n);
    }
    if (clashes || because.length < required) continue;

    const fillsGap = GAP_CATEGORIES.includes(style.category) && !coveredCategories.has(style.category);
    const score =
      sum / names.length +
      (fillsGap ? GAP_BONUS : 0) +
      (style.provenance === "source_observed" ? OBSERVED_BONUS : 0);
    scored.push({ name: c, category: style.category, score: round(score), because, fillsGap });
  }

  scored.sort((p, q) => q.score - p.score || p.name.localeCompare(q.name));
  const perCategory = new Map<StyleCategory, number>();
  const out: Suggestion[] = [];
  for (const s of scored) {
    const used = perCategory.get(s.category) ?? 0;
    if (used >= MAX_PER_CATEGORY) continue;
    perCategory.set(s.category, used + 1);
    out.push(s);
    if (out.length >= options.maxSuggestions) break;
  }
  return out;
}

function excludeList(
  names: string[],
  roles: Map<string, StyleRole>,
  options: Required<AnalyzeOptions>,
  userExcludes: readonly string[],
): ExcludeItem[] {
  const user: ExcludeItem[] = userExcludes.map((name) => ({
    name,
    category: getStyle(name)!.category,
    reason: "user",
    clashesWith: [],
  }));
  const userSet = new Set(userExcludes);
  const keep = names.filter((n) => roles.get(n) !== "outlier");
  const selected = new Set(names);
  const clashTotals = new Map<string, { score: number; with: string[] }>();

  for (const n of keep) {
    for (const e of getNeighbors(n)) {
      if (e.kind !== "clash") continue;
      const other = e.a === n ? e.b : e.a;
      if (selected.has(other) || userSet.has(other)) continue;
      const entry = clashTotals.get(other) ?? { score: 0, with: [] };
      entry.score += SOURCE_TRUST[e.source] * (1 - e.weight);
      entry.with.push(n);
      clashTotals.set(other, entry);
    }
  }

  const items: (ExcludeItem & { score: number })[] = [];
  for (const [name, { score, with: clashesWith }] of clashTotals) {
    const style = getStyle(name)!;
    if (!EXCLUDABLE_CATEGORIES.has(style.category)) continue;
    if (options.library === "launch" && !style.launch) continue;
    // Don't exclude something that also fits the selection well; that would confuse Suno.
    const alsoFits = names.some((n) => {
      const e = getEdge(name, n);
      return e?.kind === "affinity" && e.weight >= STRONG_FIT;
    });
    if (alsoFits) continue;
    // Suno's exclude field works best on concrete sound sources; moods and energy rank lower.
    const weight = CONCRETE_EXCLUDES.has(style.category) ? 1 : 0.6;
    items.push({ name, category: style.category, reason: "clash", clashesWith, score: score * weight });
  }
  items.sort((p, q) => q.score - p.score || p.name.localeCompare(q.name));
  const found = items
    .slice(0, Math.max(0, options.maxExcludes - user.length))
    .map(({ name, category, reason, clashesWith }) => ({ name, category, reason, clashesWith }));
  return [...user, ...found];
}

function collectNotes(styles: Style[]): string[] {
  const notes: string[] = [];
  for (const s of styles) {
    if (s.adherence_note) notes.push(`${s.name}: ${s.adherence_note}`);
    if (s.note) notes.push(`${s.name}: ${s.note}`);
  }
  return notes;
}

const round = (x: number) => Math.round(x * 1000) / 1000;

/** Analyze a set of user tags (style names, ids, or everyday words like "chill" or "80s"). */
export function analyze(terms: string[], opts: AnalyzeOptions = {}): Brief {
  const options: Required<AnalyzeOptions> = {
    library: opts.library ?? "launch",
    maxSuggestions: opts.maxSuggestions ?? 8,
    maxExcludes: opts.maxExcludes ?? 6,
    targetChars: Math.min(opts.targetChars ?? STYLE_TARGET_CHARS, STYLE_MAX_CHARS),
    exclude: opts.exclude ?? [],
  };

  // An explicit exclude wins over the same style in `terms`.
  const excluded = resolveAll(options.exclude);
  const userExcludes = excluded.names;
  const avoid = new Set(userExcludes);
  const included = resolveAll(terms);
  const resolved = included.resolved;
  const unresolved = [...included.unresolved, ...excluded.unresolved];
  const names = included.names.filter((n) => !avoid.has(n));
  const styles = names.map((n) => getStyle(n)!);

  // every pair once
  const pairs: PairReport[] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) pairs.push(pairScore(names[i], names[j]));
  }

  // Cohesion = average pair score against the other styles in `among`.
  const cohesionAmong = (among: Set<string>) => {
    const out = new Map<string, number>();
    for (const n of names) {
      const mine = pairs.filter(
        (p) => (p.a === n && among.has(p.b)) || (p.b === n && among.has(p.a)),
      );
      out.set(n, mine.length ? round(mine.reduce((t, p) => t + p.score, 0) / mine.length) : 0);
    }
    return out;
  };
  let cohesion = cohesionAmong(new Set(names));

  const tensions: Tension[] = [];
  const clashes: Clash[] = [];
  for (const p of pairs) {
    if (p.kind === "unknown" || p.weight === null || p.source === null) continue;
    const ca = getStyle(p.a)!.category;
    const cb = getStyle(p.b)!.category;
    if (p.kind === "clash") {
      const drop =
        cohesion.get(p.a)! < cohesion.get(p.b)!
          ? p.a
          : cohesion.get(p.b)! < cohesion.get(p.a)!
            ? p.b
            : names.indexOf(p.a) > names.indexOf(p.b)
              ? p.a
              : p.b;
      clashes.push({ a: p.a, b: p.b, weight: p.weight, source: p.source, suggestDrop: drop });
    } else if (p.kind === "tension" || p.weight < STRETCH_BELOW) {
      tensions.push({
        a: p.a,
        b: p.b,
        weight: p.weight,
        source: p.source,
        level: p.kind === "tension" ? "tension" : "stretch",
        hint: tensionHint(ca, cb),
      });
    }
  }
  tensions.sort((x, y) => x.weight - y.weight);

  // Only the side the engine would drop becomes an outlier; the other side stays.
  const clashing = new Set(clashes.map((c) => c.suggestDrop));
  let roles = assignRoles(names, cohesion, clashing);

  // Second pass: once outliers are set aside, judge everything else against what stays.
  if (clashing.size) {
    const kept = new Set(names.filter((n) => roles.get(n) !== "outlier"));
    cohesion = cohesionAmong(kept);
    const rest = assignRoles([...kept], cohesion, new Set());
    roles = new Map(names.map((n) => [n, kept.has(n) ? rest.get(n)! : "outlier"] as const));
  }

  const selected: SelectedStyle[] = styles.map((s) => ({
    name: s.name,
    category: s.category,
    role: roles.get(s.name)!,
    cohesion: cohesion.get(s.name)!,
    placement: SECTION_TAGS.has(s.name) ? "lyrics" : "style",
    launch: s.launch,
  }));

  return {
    catalogVersion,
    resolved,
    unresolved,
    styles: selected,
    pairs,
    tensions: tensions.filter(
      (t) => roles.get(t.a) !== "outlier" && roles.get(t.b) !== "outlier",
    ),
    clashes,
    conflicts: findConflicts(names),
    suggestions: suggest(names, roles, options, avoid),
    exclude: excludeList(names, roles, options, userExcludes),
    notes: collectNotes(styles),
    budget: { targetChars: options.targetChars, maxChars: STYLE_MAX_CHARS },
    confidence: {
      pairsTotal: pairs.length,
      pairsKnown: pairs.filter((p) => p.kind !== "unknown").length,
      pairsTested: pairs.filter((p) => p.source === "tested").length,
    },
  };
}

/** Number of styles in the library a given tier can draw suggestions from. */
export function librarySize(library: "launch" | "full"): number {
  return library === "full" ? allStyles().length : allStyles().filter((s) => s.launch).length;
}
