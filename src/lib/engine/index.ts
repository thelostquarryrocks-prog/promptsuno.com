// PromptSuno style engine. Server-only (reads the catalog).
//
//   const brief = analyze(["Piano", "Cinematic", "Driving Rhythm"]);
//   toWriterContext(brief)   // text for the prompt-writing model
//   fallbackStyleText(brief) // deterministic style text, no model
//   excludeText(brief)       // text for Suno's exclude-styles field

export { analyze, librarySize, pairScore } from "./analyze";
export {
  clampToLimit,
  excludeText,
  fallbackStyleText,
  lyricsSectionTags,
  orderForStyleField,
} from "./budget";
export { STYLE_MAX_CHARS, STYLE_TARGET_CHARS } from "./config";
export { toWriterContext, type WriterContextOptions } from "./writer-context";
export type * from "./types";
