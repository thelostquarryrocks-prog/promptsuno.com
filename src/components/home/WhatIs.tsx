// Section 3: what PromptSuno is and why its prompts land better.
// Server component. The demo tags come from the real idea parser at build
// time, so the example shows exactly what the engine hears.

import { Reveal } from "./Reveal";

export interface DemoTag {
  label: string;
  group: string;
}

export function WhatIs({ demoIdea, demoTags }: { demoIdea: string; demoTags: DemoTag[] }) {
  return (
    <section id="whatis" className="whatis" aria-labelledby="whatis-h">
      <div className="wrap">
        <Reveal className="" >
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">WHAT IS PROMPTSUNO</p>
            <h2 id="whatis-h" className="h2">
              You describe the vibe. <span className="grad-text">We speak fluent Suno.</span>
            </h2>
            <p className="lede" style={{ maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
              PromptSuno turns the way you&apos;d describe a song to a friend into the prompt Suno actually responds to.
            </p>
          </div>
        </Reveal>

        {demoTags.length > 0 && (
          <Reveal className="">
            <div className="demo">
              <div>
                <span className="demo-lbl">You say</span>
                <p className="demo-say">{demoIdea}</p>
              </div>
              <svg className="demo-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              <div>
                <span className="demo-lbl">PromptSuno hears</span>
                <ul className="demo-tags" aria-label="Styles found in the idea">
                  {demoTags.map((t) => (
                    <li key={t.label} className={`tag c-${t.group}`} style={{ paddingRight: 12 }}>{t.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        )}

        <Reveal stagger className="why-grid">
          <article className="why rv-item" style={{ display: "block" }}>
            <span className="why-n" aria-hidden="true">1</span>
            <h3>It hears what you mean.</h3>
            <p>Your words are broken down into genre, mood, instruments, vocals and production, so nothing you said gets lost.</p>
          </article>
          <article className="why rv-item" style={{ display: "block" }}>
            <span className="why-n" aria-hidden="true">2</span>
            <h3>It knows what goes together.</h3>
            <p>Every choice is checked against a map of how Suno styles combine. It leans into pairings that work and steers away from ones that fight each other.</p>
          </article>
          <article className="why rv-item" style={{ display: "block" }}>
            <span className="why-n" aria-hidden="true">3</span>
            <h3>It writes the way Suno reads.</h3>
            <p>Style text within Suno&apos;s limit, no artist names (Suno blocks them), what to leave out, and a lyrics structure with section tags, plus a short note on why.</p>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
