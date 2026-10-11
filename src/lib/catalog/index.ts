// Read-only access to the style catalog v2.
//
// Server-side only: the relationship data is ~1.3 MB and must never be shipped
// to the browser. Import this from server components, route handlers and
// server actions, not from client components.

import stylesJson from "../../../data/catalog/v2/styles.v2.json";
import relationshipsJson from "../../../data/catalog/v2/relationships.v2.json";
import aliasesJson from "../../../data/catalog/v2/user-aliases.json";
import type { Edge, RelationshipsFile, Style, StylesFile } from "./types";

export type * from "./types";

const stylesFile = stylesJson as unknown as StylesFile;
const relationshipsFile = relationshipsJson as unknown as RelationshipsFile;
const aliasesFile = aliasesJson as unknown as Record<string, string[]>;

const byName = new Map<string, Style>();
const byId = new Map<string, Style>();
const byLowerName = new Map<string, Style>();
for (const s of stylesFile.styles) {
  byName.set(s.name, s);
  byId.set(s.id, s);
  byLowerName.set(s.name.toLowerCase(), s);
}

const pairKey = (a: string, b: string) => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);

const edgeByPair = new Map<string, Edge>();
const neighborsByName = new Map<string, Edge[]>();
for (const e of relationshipsFile.edges) {
  edgeByPair.set(pairKey(e.a, e.b), e);
  for (const n of [e.a, e.b]) {
    const list = neighborsByName.get(n);
    if (list) list.push(e);
    else neighborsByName.set(n, [e]);
  }
}

export const catalogVersion = stylesFile.catalog_version;

export function allStyles(): readonly Style[] {
  return stylesFile.styles;
}

export function getStyle(nameOrId: string): Style | undefined {
  return byName.get(nameOrId) ?? byId.get(nameOrId) ?? byLowerName.get(nameOrId.toLowerCase());
}

/** The edge between two styles, or undefined when the pair is unknown (not the same as a clash). */
export function getEdge(a: string, b: string): Edge | undefined {
  if (a === b) return undefined;
  return edgeByPair.get(pairKey(a, b));
}

/** Every known edge touching a style. */
export function getNeighbors(name: string): readonly Edge[] {
  return neighborsByName.get(name) ?? [];
}

/**
 * Resolve a user's word or phrase to styles: exact style name (case-insensitive)
 * first, then aliases. Returns an empty list when nothing matches.
 */
export function resolveTerm(term: string): Style[] {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const exact = byLowerName.get(t);
  if (exact) return [exact];
  return (aliasesFile[t] ?? []).map((n) => byName.get(n)).filter((s): s is Style => !!s);
}
