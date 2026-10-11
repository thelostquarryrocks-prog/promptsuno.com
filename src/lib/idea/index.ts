// Idea -> tags. Server-only (reads the catalog).
//
//   const parsed = parseIdea("moody 80s synthwave about driving at night, female vocals, no guitar");
//   parsed.tags     // ["Dark", "1980s", "Synthwave", "Nocturnal", "Female Vocals"]
//   parsed.exclude  // ["Electric Guitar", "Acoustic Guitar"]
//   parsed.theme    // "driving at night"
//
//   const { parsed, brief } = ideaToBrief(idea, { library: "launch" });

import { analyze, type AnalyzeOptions, type Brief } from "@/lib/engine";
import { parseIdea } from "./parse";
import type { IdeaParse } from "./types";

export { parseIdea } from "./parse";
export { tokenize } from "./tokenize";
export type * from "./types";

/**
 * Parse an idea and run the engine on the result. The idea's own "no X" terms
 * become user excludes. Chip edits later skip the parse and call analyze()
 * with the edited tags and excludes directly.
 */
export function ideaToBrief(
  idea: string,
  opts: Omit<AnalyzeOptions, "exclude"> = {},
): { parsed: IdeaParse; brief: Brief } {
  const parsed = parseIdea(idea);
  const brief = analyze(parsed.tags, { ...opts, exclude: parsed.exclude });
  return { parsed, brief };
}
