import type { StyleCategory } from "@/lib/catalog/types";

/** One span of the idea that matched a style name or alias. */
export interface IdeaMatch {
  /** The words as written in the idea. */
  text: string;
  /** Character offsets into the idea, for highlighting. */
  start: number;
  end: number;
  /** Candidate styles, best first. More than one means the words were ambiguous ("bass"). */
  candidates: string[];
  /** The candidate chosen for the chip; the others are offered as swaps. */
  pick: string;
  category: StyleCategory;
  /** Matched a style name directly, or one of its aliases. */
  via: "name" | "alias";
  /** "no drums", "without autotune": goes to the exclude list instead of the tags. */
  negated: boolean;
}

export interface IdeaParse {
  idea: string;
  /** Chips: one style per distinct thing the idea asked for, in the order it was mentioned. */
  tags: string[];
  /** Styles the idea asked to keep out ("no drums" -> every drum candidate). Feed these to analyze({ exclude }). */
  exclude: string[];
  /** Ambiguous chips and their alternatives, for the swap menu. */
  alternatives: { pick: string; options: string[] }[];
  matches: IdeaMatch[];
  /**
   * What the song is about ("about leaving home for the first time"). Kept for
   * the writer and the lyric tool; never matched as styles except mood words.
   */
  theme: string | null;
  /** "120 bpm" in the idea, when it's a plausible tempo. */
  bpm: number | null;
  /**
   * Artist-style references ("like Daft Punk"). Suno rejects artist names in
   * the style field, so these must be translated to styles, never passed on.
   */
  references: string[];
  /** Content words outside the theme that matched nothing. */
  unmatched: string[];
  /**
   * True when the deterministic pass probably missed something worth a small
   * model call: nothing matched, an artist was referenced, or several words
   * went unrecognized.
   */
  needsModel: boolean;
}
