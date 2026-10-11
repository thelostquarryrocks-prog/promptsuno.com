// Serializes a Brief into the compact text the prompt-writing model receives.
// Keep it short and factual: every token here is paid for on every generation.

import { lyricsSectionTags, orderForStyleField } from "./budget";
import type { Brief, StyleRole } from "./types";

const ROLE_LABEL: Record<Exclude<StyleRole, "outlier">, string> = {
  anchor: "Anchor (build around this)",
  core: "Core (fits well)",
  support: "Support (keep it; fit is loose or untested, so don't let it lead)",
  contrast: "Contrast (deliberate tension, reconcile it)",
};

export interface WriterContextOptions {
  /** Include the exclude list. The writer lists excludes itself, split into the person's own and candidates. */
  excludes?: boolean;
}

export function toWriterContext(brief: Brief, opts: WriterContextOptions = {}): string {
  const lines: string[] = [];
  const ordered = orderForStyleField(brief);

  for (const role of ["anchor", "core", "support", "contrast"] as const) {
    const names = ordered.filter((s) => s.role === role).map((s) => `${s.name} (${s.category})`);
    if (names.length) lines.push(`${ROLE_LABEL[role]}: ${names.join(", ")}`);
  }

  const dropped = brief.styles.filter((s) => s.role === "outlier").map((s) => s.name);
  if (dropped.length) lines.push(`Dropped (clashes with the rest): ${dropped.join(", ")}`);

  for (const c of brief.conflicts) lines.push(`Conflict: ${c.message}`);

  if (brief.tensions.length) {
    lines.push("Tensions to reconcile:");
    for (const t of brief.tensions) {
      lines.push(`- ${t.a} + ${t.b} (${t.level}): ${t.hint}`);
    }
  }

  const sections = lyricsSectionTags(brief);
  if (sections.length) {
    lines.push(`Section tags for the lyrics, not the style field: ${sections.join(", ")}`);
  }

  if (opts.excludes !== false && brief.exclude.length) {
    lines.push(`Exclude field: ${brief.exclude.map((e) => e.name).join(", ")}`);
  }

  for (const n of brief.notes) lines.push(`Note: ${n}`);

  lines.push(
    `Style field: aim for about ${brief.budget.targetChars} characters, never more than ${brief.budget.maxChars}. Put the most important elements first.`,
  );
  return lines.join("\n");
}
