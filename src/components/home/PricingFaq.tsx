"use client";

// Pricing (Free is live, Premium is coming soon) beside the FAQ.
// Copy is about prompts: PromptSuno makes prompts, not audio.

import { useState } from "react";
import { Reveal } from "./Reveal";

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
);

export interface Faq {
  q: string;
  a: string;
}

export function PricingFaq({ faqs, dailyFree, authEnabled }: { faqs: Faq[]; dailyFree: number; authEnabled: boolean }) {
  const [open, setOpen] = useState(-1);

  return (
    <section id="pricing" className="wrap duo" aria-label="Pricing and questions">
      <div>
        <Reveal>
          <p className="eyebrow">SIMPLE PRICING</p>
          <h2 className="h2">
            Create more, <span className="grad-text">your way</span>
          </h2>
          <p className="lede">Start free today. Premium is on the way for people who prompt every day.</p>
        </Reveal>
        <Reveal stagger className="plans">
          <div className="rv-item">
            <div className="plan">
              <h3 className="plan-name">Free</h3>
              <p className="plan-tag">Everything you need to start.</p>
              <p className="price">
                <span className="amt"><sup>$</sup>0</span>
                <span className="per">/ forever</span>
              </p>
              <ul className="feats">
                <li><Check />A free prompt to try, no account</li>
                <li><Check />{authEnabled ? `Up to ${dailyFree} prompts a day with a free account` : "Free accounts with daily prompts, coming soon"}</li>
                <li><Check />Style, exclude and lyrics structure</li>
                <li><Check />A curated library of Suno styles</li>
              </ul>
              <a className="plan-btn sp" href="#build" style={{ display: "grid", placeItems: "center", textDecoration: "none", color: "#fff" }}>Start building</a>
            </div>
          </div>
          <div className="rv-item">
            <div className="plan pro">
              <span className="badge">COMING SOON</span>
              <h3 className="plan-name">Premium</h3>
              <p className="plan-tag">For people who prompt every day.</p>
              <p className="price">
                <span className="amt"><sup>$</sup>8</span>
                <span className="per">/ month</span>
              </p>
              <ul className="feats">
                <li><Check />More prompts every day</li>
                <li><Check />A stronger AI model for the writing</li>
                <li><Check />The full style library</li>
                <li><Check />Early access to new tools</li>
              </ul>
              <button type="button" className="plan-btn pro-btn" disabled aria-disabled="true" style={{ opacity: 0.7, cursor: "default" }}>Coming soon</button>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div id="faq">
          <p className="eyebrow">QUICK ANSWERS</p>
          <h2 className="h2 sm">Frequently asked questions</h2>
          <div className="faq-list">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className={`faq-item${isOpen ? " open" : ""}`}>
                  <h3 style={{ margin: 0, fontSize: "inherit", fontWeight: "inherit" }}>
                    <button type="button" className="faq-q" id={`faq-q${i}`} aria-expanded={isOpen} aria-controls={`faq-a${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                      <span>{f.q}</span>
                      <svg className="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                  </h3>
                  {isOpen && (
                    <div className="faq-a" id={`faq-a${i}`} role="region" aria-labelledby={`faq-q${i}`}>
                      <p>{f.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
