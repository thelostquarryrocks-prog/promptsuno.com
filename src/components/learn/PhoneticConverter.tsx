"use client";

// Module 4: try the spelling tricks on your own lines.

import { useState } from "react";
import { convertLyrics, type PhoneticMode } from "@/lib/learn/lyrics";

const MODES: { id: PhoneticMode; label: string; hint: string }[] = [
  { id: "relaxed", label: "Relaxed", hint: "gonna, runnin'" },
  { id: "run", label: "Vocal run", hint: "toni-i-ight" },
  { id: "echo", label: "Echo", hint: "(backing vocal)" },
];

export function PhoneticConverter({ initial }: { initial: string }) {
  const [text, setText] = useState(initial.trim());
  const [mode, setMode] = useState<PhoneticMode>("relaxed");
  const [copied, setCopied] = useState(false);
  const out = convertLyrics(text, mode);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="lm-widget">
      <div className="lm-widget-head">
        <label htmlFor="lm-pho" className="lm-widget-title">Spelling converter</label>
        <div className="lm-modes" role="radiogroup" aria-label="Technique">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={`opt sp${mode === m.id ? " on" : ""}`} onClick={() => setMode(m.id)}>
              {m.label} <span className="lm-muted">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="lm-pho">
        <textarea id="lm-pho" className="lm-textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        <div className="lm-pho-out">
          <div className="out-top">
            <span>Result</span>
            <button type="button" className={`out-copy sp${copied ? " ok" : ""}`} onClick={() => void copy()}>{copied ? "Copied" : "Copy"}</button>
          </div>
          <pre className="out-text" aria-live="polite">{out}</pre>
        </div>
      </div>
    </div>
  );
}
