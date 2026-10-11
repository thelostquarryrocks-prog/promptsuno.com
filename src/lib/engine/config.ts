import type { EdgeSource, StyleCategory } from "@/lib/catalog/types";

/** Suno v6 style field limit (confirmed Oct 2026). */
export const STYLE_MAX_CHARS = 1000;
/** Working target: focused prompts first; the writer may go longer when the idea needs it. */
export const STYLE_TARGET_CHARS = 450;

/**
 * How much each edge source is trusted when scoring. A tested result beats
 * everything; inferred edges are weak two-hop guesses.
 */
export const SOURCE_TRUST: Record<EdgeSource, number> = {
  tested: 1.0,
  rule: 0.9,
  generated: 0.85,
  "claude-curated": 0.75,
  inferred: 0.5,
};

/** Affinity below this is a "stretch": compatible, but the prompt should frame it on purpose. */
export const STRETCH_BELOW = 0.6;

/** Styles where picking more than one is contradictory. */
export const EXCLUSIVE_GROUPS: Record<string, string[]> = {
  tempo: [
    "Adagio",
    "Andante",
    "Slow Tempo",
    "Midtempo",
    "Allegro",
    "Fast Tempo",
    "Presto",
    "Very Fast Tempo",
  ],
};

/**
 * Section-specific tags. Per the catalog's placement note, these belong with
 * the intended lyric section ([Intro], [Drop], ...) rather than the style field.
 */
export const SECTION_TAGS = new Set<string>([
  "Intro",
  "Extended Intro",
  "Instrumental Intro",
  "Short Intro",
  "Verse",
  "Restrained Verse",
  "Rap Verse",
  "Pre-Chorus",
  "Chorus",
  "Post-Chorus",
  "Bridge",
  "Contrasting Bridge",
  "Breakdown",
  "Drop",
  "Double Drop",
  "Guitar Solo",
  "Drum Solo",
  "Extended Solo",
  "Instrumental Break",
  "Stop-Time Break",
  "Transition",
  "Key Change",
  "Modulation Section",
  "Contrast Section",
  "Outro",
  "Fade In",
  "Fade Out",
  "False Ending",
  "Abrupt Ending",
  "Resolved Ending",
  "Unresolved Ending",
]);

/** Categories a complete Suno style prompt usually covers, in prompt order. */
export const PROMPT_ORDER: StyleCategory[] = [
  "genre",
  "era",
  "mood",
  "energy",
  "rhythm",
  "instrument",
  "vocal",
  "texture",
  "production",
  "structure",
];

/** Categories worth suggesting when the selection has none of them. */
export const GAP_CATEGORIES: StyleCategory[] = ["genre", "instrument", "vocal", "mood"];

/** Categories that make sense in Suno's exclude field. */
export const EXCLUDABLE_CATEGORIES = new Set<StyleCategory>([
  "genre",
  "instrument",
  "vocal",
  "production",
  "texture",
  "energy",
  "mood",
  "rhythm",
]);

const HINTS: Partial<Record<string, string>> = {
  "instrument|rhythm":
    "Give the instrument the rhythmic job: an ostinato, pulse or percussive figure instead of sustained chords.",
  "genre|rhythm":
    "Keep the genre's palette but say plainly how the groove departs from its usual feel.",
  "mood|rhythm":
    "Hold the mood in harmony, timbre and vocal delivery while the rhythm carries the drive.",
  "energy|mood":
    "Let energy and mood live in different layers, e.g. driving drums under a wistful melody.",
  "mood|mood": "Frame it as a deliberate contrast, e.g. bittersweet, or a happy sound with sad lyrics.",
  "genre|mood": "Name the mood as a twist on the genre rather than its default character.",
  "genre|instrument": "Feature the instrument as a signature color within the genre's arrangement.",
  "instrument|mood": "Describe how the instrument is played (dynamics, register) to carry the mood.",
  "genre|genre": "Pick one genre as the base and describe the other as an influence or texture.",
  "genre|production": "Treat the production choice as a deliberate aesthetic layered on the genre.",
  "mood|texture": "Use the texture (harmony, timbre, register) as the counterweight to the mood.",
};

/** A short reconciliation hint for two categories, falling back to a generic one. */
export function tensionHint(a: StyleCategory, b: StyleCategory): string {
  return (
    HINTS[`${a}|${b}`] ??
    HINTS[`${b}|${a}`] ??
    "Say which element leads and describe the other as a contrasting layer, so Suno doesn't average them out."
  );
}
