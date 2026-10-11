// The phrase index the idea parser matches against: every style name, every
// catalog alias and every everyday-word alias, normalized the same way the
// idea is tokenized. Built once per server process. Server-only.

import { aliasMap, allStyles } from "@/lib/catalog";
import { phraseWords, stem } from "./tokenize";

export interface LexEntry {
  /** Style names, best first. */
  styles: string[];
  via: "name" | "alias";
}

export interface Lexicon {
  exact: Map<string, LexEntry>;
  /** Same keys, singularized word by word. Only consulted when exact fails. */
  stemmed: Map<string, LexEntry>;
  /** Longest key, in words. */
  maxWords: number;
}

let cache: Lexicon | undefined;

export function lexicon(): Lexicon {
  if (cache) return cache;
  const exact = new Map<string, LexEntry>();
  let maxWords = 1;

  const put = (words: string[], styles: readonly string[], via: LexEntry["via"]) => {
    if (words.length === 0) return;
    maxWords = Math.max(maxWords, words.length);
    const key = words.join(" ");
    const entry = exact.get(key);
    if (!entry) {
      exact.set(key, { styles: [...styles], via });
      return;
    }
    for (const s of styles) if (!entry.styles.includes(s)) entry.styles.push(s);
  };

  // Style names first, so a name always outranks an alias on the same words.
  const names = allStyles().map((s) => s.name);
  for (const n of names) put(phraseWords(n), [n], "name");
  for (const [alias, styles] of aliasMap()) put(phraseWords(alias), styles, "alias");

  // Collapsed spellings ("lofi", "hiphop", "dreampop") for short multi-word phrases,
  // only where they don't collide with a real key.
  for (const [key, entry] of [...exact]) {
    const words = key.split(" ");
    if (words.length < 2 || words.length > 3) continue;
    const collapsed = words.join("");
    if (!exact.has(collapsed)) exact.set(collapsed, { styles: [...entry.styles], via: entry.via });
  }

  const stemmed = new Map<string, LexEntry>();
  for (const [key, entry] of exact) {
    const s = key.split(" ").map(stem).join(" ");
    const prev = stemmed.get(s);
    if (!prev) stemmed.set(s, { styles: [...entry.styles], via: entry.via });
    else for (const n of entry.styles) if (!prev.styles.includes(n)) prev.styles.push(n);
  }

  cache = { exact, stemmed, maxWords };
  return cache;
}
