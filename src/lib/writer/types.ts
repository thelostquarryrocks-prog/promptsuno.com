import type { Brief } from "@/lib/engine";
import type { IdeaParse } from "@/lib/idea";
import type { Tier } from "./config";

/** What the model returns (strict JSON schema in schema.ts). */
export interface RawWriterOutput {
  style: string;
  exclude: string[];
  sections: { tag: string; note: string }[];
  why: string[];
}

/** The four copyable parts, after code-side checks. */
export interface SunoPrompt {
  /** For Suno's style field. Never longer than 1,000 characters. */
  style: string;
  /** For Suno's exclude-styles field, the person's own excludes first. */
  exclude: string[];
  /** Section labels with a short direction each. The note is shown in our UI, not pasted. */
  sections: { tag: string; note: string }[];
  /** Ready to paste into Suno's lyrics field: "[Verse 1]" lines with space for words. */
  lyricsSkeleton: string;
  /** 2-3 lines on how the tensions were resolved. */
  why: string[];
}

export interface Usage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  /** Part of outputTokens; billed as output. */
  reasoningTokens: number;
}

export interface WriterResult {
  prompt: SunoPrompt;
  model: string;
  usage: Usage;
  /** USD for this call, or null when the model's price isn't in the table. */
  costUsd: number | null;
  latencyMs: number;
  /** What the code-side checks had to fix (reference names removed, text clamped...). */
  warnings: string[];
  parsed: IdeaParse;
  brief: Brief;
}

export interface WriterInput {
  idea: string;
  /** Edited chips. When given, they replace the idea's own tags (the idea still supplies theme, BPM and references). */
  tags?: string[];
  /** Edited excludes. When given, they replace the idea's own "no X" excludes. */
  exclude?: string[];
}

export interface WriterOptions {
  tier: Tier;
  /** Overrides the tier's model. */
  model?: string;
  apiKey?: string;
  /** Injected in tests; defaults to global fetch. */
  fetch?: typeof fetch;
  env?: NodeJS.ProcessEnv;
}

export type WriterErrorCode =
  | "missing_api_key"
  | "http_error"
  | "timeout"
  | "refused"
  | "incomplete"
  | "bad_output";

/** A failed generation. The caller must not charge a credit for it. */
export class WriterError extends Error {
  constructor(
    readonly code: WriterErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "WriterError";
  }
}
