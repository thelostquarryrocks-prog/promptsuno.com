// The contract between the homepage builder and POST /api/generate.
// Client-safe: types and limits only.

export const IDEA_MAX_CHARS = 500;
export const TAGS_MAX = 16;
export const EXCLUDES_MAX = 8;
export const TERM_MAX_CHARS = 60;

export interface GenerateRequest {
  idea: string;
  /** Style names picked in the builder. Merged with the styles found in the idea. */
  tags: string[];
  /** Things to keep out, in the person's words. */
  exclude: string[];
  /** Only when the person set them in the advanced panel. */
  bpm?: number;
  key?: string;
}

export interface GeneratedPrompt {
  style: string;
  exclude: string[];
  sections: { tag: string; note: string }[];
  lyricsSkeleton: string;
  why: string[];
}

export type GenerateErrorCode =
  | "bad_request"
  | "signin_required"
  | "quota_exceeded"
  | "rate_limited"
  | "unavailable"
  | "failed";

export interface GenerateSuccess {
  ok: true;
  prompt: GeneratedPrompt;
  /** Prompts left today for this person, when known. */
  remaining: number | null;
}

export interface GenerateFailure {
  ok: false;
  error: { code: GenerateErrorCode; message: string };
}

export type GenerateResponse = GenerateSuccess | GenerateFailure;
