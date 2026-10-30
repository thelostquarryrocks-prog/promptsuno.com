"use client";

// "Go deeper with Suno": Learn / Build / Write. Learn and Build are live;
// Write is coming soon. The ribbon art only animates while the
// cards are on screen.

import Link from "next/link";
import { useEffect, useRef } from "react";
import { drawRibbon, type RGB } from "./canvas-art";
import { Reveal } from "./Reveal";

const PALETTES: readonly (readonly [RGB, RGB])[] = [
  [[255, 120, 20], [255, 205, 95]],
  [[255, 30, 80], [255, 120, 160]],
  [[165, 60, 255], [255, 60, 190]],
];

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

export function Explore() {
  const canvases = useRef<(HTMLCanvasElement | null)[]>([null, null, null]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const sizes = [0, 1, 2].map(() => ({ w: 0, h: 0 }));
    let visible = false;
    let raf = 0;
    const t0 = performance.now();

    const frame = (now: number) => {
      const t = reduce ? 2 : (now - t0) / 1000;
      canvases.current.forEach((el, i) => {
        const ctx = el?.getContext("2d");
        if (!el || !ctx) return;
        const cw = el.clientWidth;
        const ch = el.clientHeight;
        if (!cw || !ch) return;
        if (cw !== sizes[i].w || ch !== sizes[i].h) {
          const d = Math.min(window.devicePixelRatio || 1, 1.5);
          el.width = Math.round(cw * d);
          el.height = Math.round(ch * d);
          ctx.setTransform(d, 0, 0, d, 0, 0);
          sizes[i] = { w: cw, h: ch };
        }
        drawRibbon(ctx, cw, ch, t, PALETTES[i]);
      });
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    });
    io.observe(section);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="explore" ref={sectionRef} className="explore" aria-labelledby="explore-h">
      <div className="wrap">
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <p className="eyebrow">EXPLORE MORE</p>
            <h2 id="explore-h" className="h2">
              Go deeper <span className="grad-text">with Suno</span>
            </h2>
            <p className="lede">Tools and guides to turn your ideas into incredible music.</p>
          </div>
        </Reveal>
        <Reveal stagger className="cards">
          <div className="rv-item">
            <article className="xcard c-learn">
              <canvas ref={(el) => {
                  canvases.current[0] = el;
                }} className="xcard-art" aria-hidden="true" />
              <div className="xcard-body">
                <span className="xicon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></svg>
                </span>
                <h3 className="xtitle">LEARN</h3>
                <p className="xsub">Suno v6 knowledge base</p>
                <p className="xdesc">Five short modules, from your first prompt to the tricks experienced creators use.</p>
                <Link className="xbtn" href="/learn">Start learning<Arrow /></Link>
              </div>
            </article>
          </div>
          <div className="rv-item">
            <article className="xcard c-build">
              <canvas ref={(el) => {
                  canvases.current[1] = el;
                }} className="xcard-art" aria-hidden="true" />
              <div className="xcard-body">
                <span className="xicon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /></svg>
                </span>
                <h3 className="xtitle">BUILD</h3>
                <p className="xsub">Smarter Suno v6 prompts</p>
                <p className="xdesc">Describe the sound you&apos;re after and get a prompt built to land it.</p>
                <a className="xbtn" href="#build">Start building<Arrow /></a>
              </div>
            </article>
          </div>
          <div className="rv-item">
            <article className="xcard c-write">
              <canvas ref={(el) => {
                  canvases.current[2] = el;
                }} className="xcard-art" aria-hidden="true" />
              <div className="xcard-body">
                <span className="xicon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                </span>
                <h3 className="xtitle">WRITE</h3>
                <p className="xsub">Creative lyric tool</p>
                <p className="xdesc">Generate, edit and refine lyrics for any style or mood.</p>
                <span className="soon" style={{ marginTop: "auto" }}>COMING SOON</span>
              </div>
            </article>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
