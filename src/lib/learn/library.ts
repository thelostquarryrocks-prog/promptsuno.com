// The style library shown on /learn/style-library: the launch catalog, slimmed
// down to what the page needs. Server-only (reads the catalog).

import { allStyles, getNeighbors } from "@/lib/catalog";
import type { StyleCategory } from "@/lib/catalog/types";
import { SECTION_TAGS } from "@/lib/engine/config";

export interface LibraryStyle {
  name: string;
  group: LibraryGroup;
  /** How many other styles this one has a known relationship with. */
  connected: number;
}

export type LibraryGroup = "Genre & era" | "Mood & energy" | "Instruments & rhythm" | "Vocals" | "Production & texture";

const GROUP: Partial<Record<StyleCategory, LibraryGroup>> = {
  genre: "Genre & era",
  era: "Genre & era",
  mood: "Mood & energy",
  energy: "Mood & energy",
  instrument: "Instruments & rhythm",
  rhythm: "Instruments & rhythm",
  vocal: "Vocals",
  production: "Production & texture",
  texture: "Production & texture",
};

export const LIBRARY_GROUPS: LibraryGroup[] = ["Genre & era", "Mood & energy", "Instruments & rhythm", "Vocals", "Production & texture"];

export function libraryStyles(): LibraryStyle[] {
  return allStyles()
    .filter((s) => s.launch && GROUP[s.category] && !SECTION_TAGS.has(s.name))
    .map((s) => ({ name: s.name, group: GROUP[s.category]!, connected: getNeighbors(s.name).length }))
    .sort((a, b) => LIBRARY_GROUPS.indexOf(a.group) - LIBRARY_GROUPS.indexOf(b.group) || b.connected - a.connected || a.name.localeCompare(b.name));
}
