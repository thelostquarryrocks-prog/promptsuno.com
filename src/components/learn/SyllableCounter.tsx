"use client";

// Module 2: type lyrics, see a rough syllable count per line.

import { useState } from "react";
import { countSyllables, lineFit, type LineFit } from "@/lib/learn/lyrics";

const LABEL: Record<LineFit, string> = {
  short: "Short",
  comfortable: "Comfortable",
  long: "Long",
  "very-long": "Too long",
};

export function SyllableCounter({ initial }: { initial: string }) {
  const [text, setText] = useState(initial.trim());
  const lines = text.split("\n");
  return (
    <div className="lm-widget">
      <div className="lm-widget-head">
        <label htmlFor="lm-syl" className="lm-widget-title">Syllable counter</label>
        <span className="lm-widget-note">Estimates, at a mid tempo (90–120 BPM)</span>
      </div>
      <div className="lm-syl">
        <textarea id="lm-syl" className="lm-textarea" rows={Math.max(4, lines.length + 1)} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        <ol className="lm-syl-out" aria-label="Syllables per line">
          {lines.map((line, i) => {
            const trimmed = line.trim();
            const tag = /^\[.*\]$/.test(trimmed);
            if (!trimmed || tag) return <li key={i} className="lm-syl-row lm-muted">{tag ? "tag" : " "}</li>;
            const n = countSyllables(line);
            const fit = lineFit(n);
            return (
              <li key={i} className={`lm-syl-row fit-${fit}`}>
                <b>{n}</b> {LABEL[fit]}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
