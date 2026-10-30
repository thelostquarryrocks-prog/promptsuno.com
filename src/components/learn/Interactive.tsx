"use client";

// Small interactive pieces for Learn: copyable tag chips and Suno field blocks.

import { useState } from "react";

function useCopy() {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const copy = async (text: string) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    setState(ok ? "ok" : "fail");
    setTimeout(() => setState("idle"), 1600);
  };
  return { state, copy };
}

/** An inline tag. Click to copy it exactly as written. */
export function CopyChip({ text }: { text: string }) {
  const { state, copy } = useCopy();
  return (
    <button type="button" className={`lm-chip${state === "ok" ? " ok" : ""}`} onClick={() => void copy(text)} title="Copy">
      <code>{text}</code>
      <span className="lm-chip-hint" aria-live="polite">{state === "ok" ? "Copied" : state === "fail" ? "Select it" : ""}</span>
      <span className="sr-only">{state === "idle" ? "(copy)" : ""}</span>
    </button>
  );
}

/** A Suno field example: the style box or the lyrics box. */
export function PromptBlock({ kind, text }: { kind: "style" | "lyrics"; text: string }) {
  const { state, copy } = useCopy();
  const label = kind === "style" ? "Style box" : "Lyrics box";
  const builderHref = `/?idea=${encodeURIComponent(text.slice(0, 500))}#build`;
  return (
    <figure className={`lm-block lm-${kind}`}>
      <figcaption className="out-top">
        <span>{label}</span>
        {kind === "style" && <span className="meta">{text.length} / 1,000</span>}
        <button type="button" className={`out-copy sp${state === "ok" ? " ok" : ""}`} onClick={() => void copy(text)}>
          {state === "ok" ? "Copied" : state === "fail" ? "Select it" : "Copy"}
        </button>
        {kind === "style" && (
          <a className="out-copy sp lm-open" href={builderHref}>
            Open in builder
          </a>
        )}
      </figcaption>
      <pre className="out-text">{text}</pre>
    </figure>
  );
}
