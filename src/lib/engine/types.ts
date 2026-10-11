import type { EdgeKind, EdgeSource, StyleCategory } from "@/lib/catalog/types";

/** How a pair of selected styles relates. `unknown` means no data, which is not a clash. */
export type PairKind = EdgeKind | "unknown";

export interface ResolvedTerm {
  /** What the user typed or picked. */
  term: string;
  /** Catalog style names it resolved to (an alias can map to several). */
  styles: string[];
}

/**
 * anchor:   the style the prompt is built around (the most cohesive genre, if any)
 * core:     fits the rest of the selection well
 * support:  fits loosely or is unknown to the rest
 * contrast: pulls against the selection (tensions) but no hard clash; reconcile it
 * outlier:  clashes with the selection; the engine would drop it
 */
export type StyleRole = "anchor" | "core" | "support" | "contrast" | "outlier";

export interface SelectedStyle {
  name: string;
  category: StyleCategory;
  role: StyleRole;
  /**
   * Average trust-weighted relationship to the other selected styles, roughly
   * -1 (fights everything) to 1 (fits everything). 0 when nothing is known.
   */
  cohesion: number;
  /** Where the tag belongs in Suno: the style field, or as a section tag in the lyrics. */
  placement: "style" | "lyrics";
  launch: boolean;
}

export interface PairReport {
  a: string;
  b: string;
  kind: PairKind;
  weight: number | null;
  source: EdgeSource | null;
  /** weight x source trust; 0 for unknown pairs. */
  score: number;
}

export interface Tension {
  a: string;
  b: string;
  weight: number;
  source: EdgeSource;
  /** "tension" = catalog says reconcilable; "stretch" = weak affinity worth framing deliberately. */
  level: "tension" | "stretch";
  /** Short hint for the writer on how to reconcile the pair. */
  hint: string;
}

export interface Clash {
  a: string;
  b: string;
  weight: number;
  source: EdgeSource;
  /** The style the engine would drop to resolve it (the less central one). */
  suggestDrop: string;
}

/** Rule-level problems that aren't a single edge, e.g. two tempos selected. */
export interface Conflict {
  type: "exclusive-group";
  group: string;
  styles: string[];
  message: string;
}

export interface Suggestion {
  name: string;
  category: StyleCategory;
  score: number;
  /** Selected styles this one fits well with. */
  because: string[];
  /** True when it fills a category the selection doesn't cover yet (e.g. no vocal chosen). */
  fillsGap: boolean;
}

export interface ExcludeItem {
  name: string;
  category: StyleCategory;
  /** "user": the person asked for it ("no drums"). "clash": the engine found it fights the selection. */
  reason: "user" | "clash";
  /** Selected styles it clashes with. Empty for user excludes. */
  clashesWith: string[];
}

export interface Brief {
  catalogVersion: string;
  resolved: ResolvedTerm[];
  unresolved: string[];
  styles: SelectedStyle[];
  pairs: PairReport[];
  tensions: Tension[];
  clashes: Clash[];
  conflicts: Conflict[];
  suggestions: Suggestion[];
  exclude: ExcludeItem[];
  /** Usage cautions from the catalog (e.g. odd meters may not be followed exactly). */
  notes: string[];
  budget: { targetChars: number; maxChars: number };
  confidence: {
    pairsTotal: number;
    pairsKnown: number;
    /** Known pairs backed by Suno listening tests. 0 until the tester tool exists. */
    pairsTested: number;
  };
}

export interface AnalyzeOptions {
  /** "launch" limits suggestions and excludes to the approved launch set (free tier). */
  library?: "launch" | "full";
  maxSuggestions?: number;
  /** Caps engine-found (clash) excludes; user excludes are always kept and come first. */
  maxExcludes?: number;
  /**
   * Styles the person explicitly doesn't want ("no drums", or a chip dragged to
   * exclude). They go first in the exclude list, are never suggested, and win
   * over the same style in `terms`.
   */
  exclude?: string[];
  targetChars?: number;
}
