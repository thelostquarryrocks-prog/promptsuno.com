// Validates the builder's request body. Pure, so it's easy to test.

import { EXCLUDES_MAX, IDEA_MAX_CHARS, TAGS_MAX, TERM_MAX_CHARS, type GenerateRequest } from "./contract";

export type Validated = { ok: true; value: GenerateRequest } | { ok: false; message: string };

const cleanTerms = (v: unknown, max: number): string[] | null => {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return null;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") return null;
    const t = item.trim().slice(0, TERM_MAX_CHARS);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, max);
};

export function validateGenerateRequest(body: unknown): Validated {
  if (!body || typeof body !== "object") return { ok: false, message: "Send a JSON body." };
  const b = body as Record<string, unknown>;
  const idea = typeof b.idea === "string" ? b.idea.trim() : "";
  if (idea.length > IDEA_MAX_CHARS) return { ok: false, message: `Keep the idea under ${IDEA_MAX_CHARS} characters.` };
  const tags = cleanTerms(b.tags, TAGS_MAX);
  const exclude = cleanTerms(b.exclude, EXCLUDES_MAX);
  if (!tags || !exclude) return { ok: false, message: "Tags and excludes must be lists of words." };
  if (!idea && tags.length === 0) return { ok: false, message: "Describe a track or pick a few tags first." };

  const value: GenerateRequest = { idea, tags, exclude };
  if (b.bpm !== undefined) {
    const bpm = Number(b.bpm);
    if (!Number.isInteger(bpm) || bpm < 40 || bpm > 240) return { ok: false, message: "Tempo must be between 40 and 240 BPM." };
    value.bpm = bpm;
  }
  if (b.key !== undefined) {
    if (typeof b.key !== "string" || !/^[A-G][♭♯#b]? (major|minor)$/.test(b.key)) return { ok: false, message: "Unknown key." };
    value.key = b.key;
  }
  return { ok: true, value };
}

/** Folds tempo and key into the idea text, where the idea parser and the writer read them. */
export function ideaWithSettings(req: GenerateRequest): string {
  const extras: string[] = [];
  if (req.bpm && !/\b\d{2,3}\s*-?\s*bpm\b/i.test(req.idea)) extras.push(`${req.bpm} bpm`);
  if (req.key) extras.push(`in ${req.key}`);
  if (!extras.length) return req.idea;
  return req.idea ? `${req.idea}, ${extras.join(", ")}` : extras.join(", ");
}
