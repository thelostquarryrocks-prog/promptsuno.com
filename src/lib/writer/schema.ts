// The JSON schema the model must follow (OpenAI structured outputs, strict
// mode), and the code-side checks applied to whatever comes back. The schema
// guarantees shape; the checks enforce the rules a schema can't express.

import { clampToLimit, STYLE_MAX_CHARS } from "@/lib/engine";
import { MAX_EXCLUDES, MAX_SECTIONS, MAX_WHY } from "./config";
import type { RawWriterOutput, SunoPrompt } from "./types";
import { WriterError } from "./types";

export const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["style", "exclude", "sections", "why"],
  properties: {
    style: { type: "string", description: "Text for Suno's Style field." },
    exclude: { type: "array", items: { type: "string" }, description: "Entries for Suno's exclude-styles field." },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tag", "note"],
        properties: {
          tag: { type: "string", description: "Section label without brackets, e.g. Verse 1." },
          note: { type: "string", description: "One short direction for the section." },
        },
      },
    },
    why: { type: "array", items: { type: "string" }, description: "Two or three short sentences." },
  },
} as const;

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/** Parse and shape-check the model's JSON. Throws WriterError("bad_output") on anything unexpected. */
export function parseRawOutput(text: string): RawWriterOutput {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new WriterError("bad_output", "The model's answer wasn't valid JSON.");
  }
  const o = data as Partial<RawWriterOutput> | null;
  const ok =
    !!o &&
    typeof o === "object" &&
    typeof o.style === "string" &&
    isStringArray(o.exclude) &&
    isStringArray(o.why) &&
    Array.isArray(o.sections) &&
    o.sections.every(
      (s) => !!s && typeof s === "object" && typeof s.tag === "string" && typeof s.note === "string",
    );
  if (!ok) throw new WriterError("bad_output", "The model's answer didn't match the expected shape.");
  return o as RawWriterOutput;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const LEAD_IN = String.raw`(?:(?:sounds?|sounding)\s+)?(?:like|in the (?:style|vein|spirit) of|inspired by|influenced by|reminiscent of|a la|à la)\s+(?:the\s+)?`;
const nameRe = (name: string, withLeadIn: boolean) =>
  new RegExp(
    String.raw`(^|[^\p{L}\p{N}])${withLeadIn ? `(?:${LEAD_IN})?` : ""}${escapeRegExp(name)}(?=$|[^\p{L}\p{N}])`,
    "giu",
  );

/**
 * Remove a name as whole words. In the style text the lead-in goes too
 * ("like Daft Punk" -> ""). In prose it becomes "that artist" so sentences
 * still read.
 */
function stripName(text: string, name: string, prose: boolean): string {
  if (prose) return tidy(text.replace(nameRe(name, false), "$1that artist"));
  return tidy(text.replace(nameRe(name, true), "$1"));
}

function tidy(text: string): string {
  return text
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([,;:])\s*(?=[,;:.])/g, "")
    .replace(/^[\s,;:.]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const mentions = (text: string, name: string) => nameRe(name, false).test(text);

export interface CheckContext {
  /** Artist names from the idea. They must not appear anywhere in the output. */
  references: string[];
  /** The person's own excludes: always kept, always first. */
  userExcludes: string[];
  /** The styles in use. Excluding one of these would contradict the prompt. */
  tags: string[];
}

/** Apply the rules the schema can't express. Returns the prompt and a list of what was fixed. */
export function checkOutput(raw: RawWriterOutput, ctx: CheckContext): { prompt: SunoPrompt; warnings: string[] } {
  const warnings: string[] = [];
  const names = ctx.references.filter((r) => r.trim().length > 1);

  const scrub = (text: string, where: string, prose = false) => {
    let out = text;
    for (const n of names) {
      if (mentions(out, n)) {
        out = stripName(out, n, prose);
        warnings.push(`Removed the reference "${n}" from ${where}.`);
      }
    }
    return out;
  };

  // Style field
  let style = scrub(raw.style.replace(/\s+/g, " ").trim(), "the style text");
  if (/[[\]{}<>]/.test(style)) {
    style = tidy(style.replace(/[[\]{}<>]/g, ""));
    warnings.push("Removed brackets from the style text.");
  }
  if (style.length > STYLE_MAX_CHARS) {
    style = clampToLimit(style, STYLE_MAX_CHARS);
    warnings.push(`Style text was over ${STYLE_MAX_CHARS} characters and was shortened.`);
  }
  if (!style) throw new WriterError("bad_output", "The model returned an empty style prompt.");

  // Exclude field: the person's own first, then the model's, never something in use.
  const seen = new Set<string>();
  const exclude: string[] = [];
  const inUse = new Set(ctx.tags.map((t) => t.toLowerCase()));
  const push = (item: string, fromUser: boolean) => {
    const v = item.trim();
    const key = v.toLowerCase();
    if (!v || seen.has(key)) return;
    if (names.some((n) => n.toLowerCase() === key)) return;
    // Only chosen tags count as "in use": the style text may legitimately say "no drums".
    if (!fromUser && inUse.has(key)) {
      warnings.push(`Dropped "${v}" from excludes because the prompt uses it.`);
      return;
    }
    seen.add(key);
    exclude.push(v);
  };
  for (const u of ctx.userExcludes) push(u, true);
  const userCount = exclude.length;
  for (const e of raw.exclude) push(e, false);
  if (exclude.length > Math.max(MAX_EXCLUDES, userCount)) exclude.length = Math.max(MAX_EXCLUDES, userCount);

  // Sections
  const sections = raw.sections
    .map((s) => ({
      tag: scrub(s.tag.replace(/[[\]]/g, "").trim(), "a section label"),
      note: scrub(s.note.trim(), "a section note", true),
    }))
    .filter((s) => s.tag)
    .slice(0, MAX_SECTIONS);
  if (sections.length === 0) throw new WriterError("bad_output", "The model returned no song sections.");

  const why = raw.why
    .map((w) => scrub(w.trim(), "the explanation", true))
    .filter(Boolean)
    .slice(0, MAX_WHY);

  const lyricsSkeleton = sections.map((s) => `[${s.tag}]`).join("\n\n");

  return { prompt: { style, exclude, sections, lyricsSkeleton, why }, warnings };
}
