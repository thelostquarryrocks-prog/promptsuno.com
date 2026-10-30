// Page frame for /learn: header, module rail (a collapsible list on phones), footer.

import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Footer } from "@/components/home/Footer";
import type { LearnModuleMeta } from "@/lib/learn/content";

export function LearnShell({
  modules,
  current,
  outline,
  children,
}: {
  modules: LearnModuleMeta[];
  current?: string;
  outline?: { id: string; text: string }[];
  children: ReactNode;
}) {
  const list = (
    <ol className="lm-rail-list">
      {modules.map((m) => (
        <li key={m.slug}>
          <Link href={`/learn/${m.slug}`} className={`lm-rail-link${m.slug === current ? " on" : ""}`} aria-current={m.slug === current ? "page" : undefined}>
            <span className="lm-rail-n">{m.number}</span>
            <span>{m.title}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
  const active = modules.find((m) => m.slug === current);

  return (
    <div className="ps lm" style={{ minHeight: "100vh", background: "#050304", color: "#fff" }}>
      <header className="lm-header">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#ffffff" }}>
          <Logo idPrefix="lh" />
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>PromptSuno</span>
        </Link>
        <nav aria-label="Main" className="lm-header-nav">
          <Link href="/learn" className="navlink" aria-current={current ? undefined : "page"}>Learn</Link>
          <Link href="/#build" className="create nav-cta sp" style={{ textDecoration: "none" }}><span className="lm-long">Build a prompt</span><span className="lm-short">Build</span></Link>
        </nav>
      </header>

      <div className="lm-layout">
        <aside className="lm-rail" aria-label="Learn modules">
          <details className="lm-rail-mobile">
            <summary>{active ? `Module ${active.number}: ${active.title}` : "All modules"}</summary>
            {list}
          </details>
          <div className="lm-rail-desktop">
            <Link href="/learn" className="lm-rail-home">Learn Suno v6</Link>
            {list}
            {outline && outline.length > 0 && (
              <nav aria-label="On this page" className="lm-outline">
                <p className="eyebrow" style={{ margin: "28px 0 10px" }}>ON THIS PAGE</p>
                <ul>
                  {outline.map((o) => (
                    <li key={o.id}><a href={`#${o.id}`}>{o.text}</a></li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </aside>
        <main className="lm-main">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
