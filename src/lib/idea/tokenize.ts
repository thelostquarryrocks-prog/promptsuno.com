// Tokenizer for song ideas. Pure functions, no catalog access, safe anywhere.
//
// Words keep their character offsets so the UI can highlight what was
// understood. Hyphenated words are split ("hip-hop" -> "hip" "hop") so they
// match either spelling; the phrase index adds collapsed forms ("lofi").

export interface Token {
  /** Lowercased, normalized text used for matching. */
  norm: string;
  /** Text exactly as written. */
  raw: string;
  start: number;
  end: number;
  /** Punctuation that ends a clause (, . ; : ! ? and brackets). */
  boundary: boolean;
  /** First letter was uppercase in the original. */
  capitalized: boolean;
}

const WORD = /[\p{L}\p{N}](?:[\p{L}\p{N}'’&/+#]|-(?=[\p{L}\p{N}]))*|&|[,.;:!?()[\]]/gu;

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(WORD)) {
    const raw = m[0];
    const start = m.index;
    if (/^[,.;:!?()[\]]$/.test(raw)) {
      out.push({ norm: raw, raw, start, end: start + 1, boundary: true, capitalized: false });
      continue;
    }
    if (raw === "&") {
      out.push({ norm: "and", raw, start, end: start + 1, boundary: false, capitalized: false });
      continue;
    }
    // Split on hyphens, keeping each part's own offsets.
    let offset = 0;
    for (const part of raw.split("-")) {
      const s = start + offset;
      offset += part.length + 1;
      if (!part) continue;
      out.push({
        norm: normalizeWord(part),
        raw: part,
        start: s,
        end: s + part.length,
        boundary: false,
        capitalized: /^\p{Lu}/u.test(part),
      });
    }
  }
  return out;
}

export function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/’/g, "'").replace(/'+$/, "");
}

/** Normalize a whole phrase (a style name or alias) into match keys, the same way ideas are tokenized. */
export function phraseWords(phrase: string): string[] {
  return tokenize(phrase)
    .filter((t) => !t.boundary)
    .map((t) => t.norm);
}

/**
 * Light singularization so "female vocal" finds "Female Vocals" and "synths"
 * finds "Synth". Applied to both sides; only used after an exact match fails.
 */
export function stem(w: string): string {
  if (w.length <= 3 || /\d/.test(w)) return w;
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith("s") && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}
