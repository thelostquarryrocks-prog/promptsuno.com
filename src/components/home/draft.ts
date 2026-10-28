// Keeps the builder's work through a sign-in round trip (Google redirects away
// and back). Session storage only: it never leaves this browser tab, and every
// read and write is allowed to fail.

import type { PickerGroupId } from "@/lib/catalog/picker-shared";
import type { GeneratedPrompt } from "@/lib/generate/contract";

const KEY = "promptsuno:draft:v1";
const MAX_AGE_MS = 60 * 60 * 1000;

export interface Draft {
  text: string;
  sel: Record<PickerGroupId, string[]>;
  excludes: string[];
  bpm: number;
  musicKey: string;
  weird: number;
  influence: number;
  advTouched: boolean;
  result: GeneratedPrompt | null;
  savedAt: number;
}

export function saveDraft(d: Omit<Draft, "savedAt">) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...d, savedAt: Date.now() }));
  } catch {
    // Private mode or storage blocked: the round trip just starts fresh.
  }
}

/** Returns the saved draft once, then clears it. */
export function takeDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (!d || typeof d.savedAt !== "number" || Date.now() - d.savedAt > MAX_AGE_MS) return null;
    return d;
  } catch {
    return null;
  }
}
