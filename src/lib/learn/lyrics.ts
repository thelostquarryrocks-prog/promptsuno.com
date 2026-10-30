// Lyric helpers for the Learn widgets. Client-safe, no dependencies.
// Adapted from the Learn handoff package, with fixes noted inline.

/** Rough English syllable count for one sung line. Tags and backing parts are ignored. */
export function countSyllables(line: string): number {
  const clean = line
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .replace(/'/g, "");
  let total = 0;
  for (const word of clean.split(/[\s-]+/).filter(Boolean)) total += syllablesInWord(word);
  return total;
}

export function syllablesInWord(word: string): number {
  if (word.length <= 3) return 1;
  const stripped = word
    // Silent endings: "made", "named". Keep "-le" ("table") and "-ted/-ded" ("wanted") as syllables.
    .replace(/(?:[^laeiouy]es|[^tdaeiouy]ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export type LineFit = "short" | "comfortable" | "long" | "very-long";

/** How a line's length sits at a mid tempo (the Module 2 table). */
export function lineFit(syllables: number): LineFit {
  if (syllables === 0) return "comfortable";
  if (syllables < 5) return "short";
  if (syllables <= 11) return "comfortable";
  if (syllables <= 15) return "long";
  return "very-long";
}

export type PhoneticMode = "relaxed" | "run" | "echo";

/** "tonight" -> "toni-i-ight", "fire" -> "fi-i-ire", "morning" -> "mo-o-orning": the last sung vowel. */
export function stretchWord(word: string): string {
  // Skip endings that aren't the sung vowel: a silent final e ("fire"), "-ing" ("morning").
  const skip = word.length > 4 && /ing$/i.test(word) ? 3 : word.length > 3 && /[^aeiou]e$/i.test(word) ? 1 : 0;
  const body = word.slice(0, word.length - skip);
  let i = -1;
  for (let k = body.length - 1; k >= 0; k--) {
    if ("aeiouAEIOU".includes(body[k])) {
      i = k;
      // Use the first vowel of a vowel pair ("night" has one, "mean" -> "me-e-ean").
      while (i > 0 && "aeiouAEIOU".includes(body[i - 1])) i--;
      break;
    }
  }
  if (i < 0) return word;
  const v = word[i].toLowerCase();
  return `${word.slice(0, i + 1)}-${v}-${v}${word.slice(i + 1)}`;
}

const isTag = (line: string) => /^\s*\[.*\]\s*$/.test(line);

/**
 * Module 4 spelling tricks, one line at a time. Section tags and blank lines
 * are never changed.
 *  - relaxed: "going to" -> "gonna", "-ing" -> "-in'"
 *  - run: hyphenated vowel on the last word ("night" -> "ni-i-ight")
 *  - echo: repeat the last few words in parentheses as a backing vocal
 */
export function convertLyrics(lyrics: string, mode: PhoneticMode): string {
  return lyrics
    .split("\n")
    .map((line) => {
      if (!line.trim() || isTag(line)) return line;
      switch (mode) {
        case "relaxed":
          return line
            .replace(/\bgoing to\b/gi, (m) => (m[0] === "G" ? "Gonna" : "gonna"))
            .replace(/\bwant to\b/gi, (m) => (m[0] === "W" ? "Wanna" : "wanna"))
            .replace(/\bgot to\b/gi, (m) => (m[0] === "G" ? "Gotta" : "gotta"))
            // Only when the stem has a vowel, so "string", "thing", "king" stay as they are.
            .replace(/\b([a-zA-Z]*[aeiouyAEIOUY][a-zA-Z]*?)ing\b/g, (m, stem: string) => (stem.length >= 2 ? `${stem}in'` : m));
        case "run":
          return line.replace(/([a-zA-Z']+)([^a-zA-Z']*)$/, (_m, word: string, tail: string) => `${stretchWord(word)}${tail}`);
        case "echo": {
          if (line.includes("(")) return line;
          const words = line.trim().split(/\s+/);
          if (words.length < 4) return line;
          const echo = words.slice(-3).join(" ").replace(/[.!?,;:]/g, "").toLowerCase();
          return `${line.replace(/\s+$/, "")} (${echo})`;
        }
      }
    })
    .join("\n");
}
