// Types for the style catalog v2 (data/catalog/v2). Generated data is the
// source of truth; these types describe it. See data/catalog/README.md.

export type StyleCategory =
  | "genre"
  | "mood"
  | "instrument"
  | "vocal"
  | "rhythm"
  | "texture"
  | "production"
  | "structure"
  | "energy"
  | "era";

export type Provenance = "source_observed" | "author_expansion";

export interface Evidence {
  source_id: string;
  kind: string;
  match: string;
}

export interface Style {
  id: string;
  name: string;
  category: StyleCategory;
  secondary_categories: StyleCategory[];
  aliases: string[];
  provenance: Provenance;
  evidence: Evidence[];
  suno_audio_tested: boolean;
  launch: boolean;
  degree: number;
  note?: string;
  placement_note?: string;
  adherence_note?: string;
}

/** affinity >= 0.5 > tension >= 0.3 > clash */
export type EdgeKind = "affinity" | "tension" | "clash";

/** Precedence: generated > rule > claude-curated > inferred. "tested" arrives with the tester tool. */
export type EdgeSource = "generated" | "rule" | "claude-curated" | "inferred" | "tested";

export interface Edge {
  /** Style name; always alphabetically before `b`. */
  a: string;
  b: string;
  weight: number;
  kind: EdgeKind;
  source: EdgeSource;
  /** Inferred edges only: 0..1 strength of the two-hop evidence. */
  confidence?: number;
  /** Inferred edges only: the shared neighbors that suggested this edge. */
  via?: string[];
}

export interface CatalogFileMeta {
  catalog_version: string;
  built: string;
  sources: string[];
  research_date: string | null;
  missing_pair_policy: string;
}

export interface StylesFile extends CatalogFileMeta {
  styles: Style[];
}

export interface RelationshipsFile extends CatalogFileMeta {
  edges: Edge[];
}
