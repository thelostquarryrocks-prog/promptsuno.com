// The builder's tag picker, built from the launch library on the server.
//
// Server-only: it imports the catalog. The output is small (about 180 names)
// and is passed to the client builder as a prop.

import { allStyles } from "./index";
import { INSTRUMENTAL, type PickerGroup, type PickerGroupId } from "./picker-shared";
import type { Style, StyleCategory } from "./types";

export * from "./picker-shared";

const GROUPS: { id: PickerGroupId; label: string; max: number; hint: string; from: StyleCategory[] }[] = [
  {
    id: "genre",
    label: "Genre",
    max: 3,
    hint: "Up to 3. A blend of two plus an era gives Suno a clearer target than a long list.",
    from: ["genre", "era"],
  },
  {
    id: "mood",
    label: "Mood",
    max: 3,
    hint: "One to three moods or energy words. More than that tends to cancel out.",
    from: ["mood", "energy"],
  },
  {
    id: "instruments",
    label: "Instruments",
    max: 4,
    hint: "Name the lead sounds and the groove you want in front of the mix.",
    from: ["instrument", "rhythm"],
  },
  {
    id: "vocals",
    label: "Vocals",
    max: 2,
    hint: "Up to 2 that describe one voice, or Instrumental for none.",
    from: ["vocal"],
  },
  {
    id: "production",
    label: "Production",
    max: 3,
    hint: "Mix, texture and arrangement cues. Up to 3.",
    from: ["production", "texture", "structure"],
  },
];

const byDegree = (a: Style, b: Style) => b.degree - a.degree || a.name.localeCompare(b.name);

export function pickerGroups(): PickerGroup[] {
  const launch = allStyles().filter((s) => s.launch);
  return GROUPS.map((g) => {
    let options = launch
      .filter((s) => g.from.includes(s.category))
      .sort((a, b) => g.from.indexOf(a.category) - g.from.indexOf(b.category) || byDegree(a, b))
      .map((s) => s.name);
    if (g.id === "production") options = options.filter((n) => n !== INSTRUMENTAL);
    if (g.id === "vocals") options = [...options, INSTRUMENTAL];
    return { id: g.id, label: g.label, max: g.max, hint: g.hint, options };
  });
}
