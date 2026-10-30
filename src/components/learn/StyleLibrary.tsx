"use client";

// Module 5: the launch style library, searchable, filterable, copyable.

import { useMemo, useState } from "react";
import type { LibraryGroup, LibraryStyle } from "@/lib/learn/library";
import { CopyChip } from "./Interactive";

const GROUPS: (LibraryGroup | "All")[] = ["All", "Genre & era", "Mood & energy", "Instruments & rhythm", "Vocals", "Production & texture"];

export function StyleLibrary({ styles }: { styles: LibraryStyle[] }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<LibraryGroup | "All">("All");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return styles.filter((s) => (group === "All" || s.group === group) && (!needle || s.name.toLowerCase().includes(needle)));
  }, [styles, q, group]);

  return (
    <div className="lm-widget lm-lib">
      <div className="lm-lib-controls">
        <label htmlFor="lm-lib-q" className="sr-only">Search styles</label>
        <input id="lm-lib-q" className="lm-search" type="search" placeholder={`Search ${styles.length} styles`} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="lm-modes" role="radiogroup" aria-label="Category">
          {GROUPS.map((g) => (
            <button key={g} type="button" role="radio" aria-checked={group === g} className={`opt sp${group === g ? " on" : ""}`} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <p className="lm-widget-note" aria-live="polite">{shown.length === styles.length ? `${styles.length} styles` : `${shown.length} of ${styles.length} styles`}</p>
      {shown.length === 0 ? (
        <p className="lm-p lm-muted">Nothing matches “{q}”. Try a broader word.</p>
      ) : (
        <ul className="lm-lib-grid">
          {shown.map((s) => (
            <li key={s.name} className="lm-lib-item">
              <CopyChip text={s.name} />
              <span className="lm-lib-meta">
                {group === "All" ? `${s.group} · ` : ""}
                {s.connected} connected
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
