// Ordering and length budget for the Suno style field.

import { PROMPT_ORDER, STYLE_MAX_CHARS } from "./config";
import type { Brief, SelectedStyle, StyleRole } from "./types";

const ROLE_RANK: Record<StyleRole, number> = {
  anchor: 0,
  core: 1,
  support: 2,
  contrast: 3,
  outlier: 9,
};

/**
 * Styles that belong in the style field, most important first: the anchor,
 * then by category in prompt order, then by role. Outliers and section tags are left out.
 */
export function orderForStyleField(brief: Brief): SelectedStyle[] {
  return brief.styles
    .filter((s) => s.placement === "style" && s.role !== "outlier")
    .sort((a, b) => {
      if (a.role === "anchor") return -1;
      if (b.role === "anchor") return 1;
      return (
        PROMPT_ORDER.indexOf(a.category) - PROMPT_ORDER.indexOf(b.category) ||
        ROLE_RANK[a.role] - ROLE_RANK[b.role] ||
        b.cohesion - a.cohesion
      );
    });
}

/** Section tags the user picked, for the lyrics skeleton rather than the style field. */
export function lyricsSectionTags(brief: Brief): string[] {
  return brief.styles.filter((s) => s.placement === "lyrics").map((s) => s.name);
}

/**
 * Cut text to a character limit without breaking a phrase: it ends at the last
 * comma, period or semicolon that fits, falling back to the last space.
 */
export function clampToLimit(text: string, max = STYLE_MAX_CHARS): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const cut = Math.max(slice.lastIndexOf(","), slice.lastIndexOf("."), slice.lastIndexOf(";"));
  if (cut > max * 0.5) return slice.slice(0, cut).trim();
  const space = slice.lastIndexOf(" ");
  return (space > 0 ? slice.slice(0, space) : slice).trim();
}

/**
 * Deterministic style text with no model call: the ordered tags, comma
 * separated, within the budget. Used as a fallback and as a baseline in tests.
 */
export function fallbackStyleText(brief: Brief, max = brief.budget.targetChars): string {
  const parts: string[] = [];
  let length = 0;
  for (const s of orderForStyleField(brief)) {
    const add = (parts.length ? 2 : 0) + s.name.length;
    if (length + add > Math.min(max, STYLE_MAX_CHARS)) break;
    parts.push(s.name);
    length += add;
  }
  return parts.join(", ");
}

/** Comma-separated text for Suno's exclude-styles field. */
export function excludeText(brief: Brief): string {
  return brief.exclude.map((e) => e.name).join(", ");
}
