import type { Metadata } from "next";
import Link from "next/link";
import { LearnShell } from "@/components/learn/LearnShell";
import { learnMeta, learnModules } from "@/lib/learn/content";

export const metadata: Metadata = {
  title: "Learn Suno v6",
  description:
    "A practical guide to prompting Suno v6: the style and lyrics boxes, section tags, pacing, duets, production terms, spelling tricks and a searchable style library.",
  alternates: { canonical: "/learn" },
};

export default function LearnIndex() {
  const modules = learnModules().map(learnMeta);
  return (
    <LearnShell modules={modules}>
      <p className="eyebrow">LEARN</p>
      <h1 className="h2" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}>
        Prompt Suno v6 <span className="grad-text">like a producer</span>
      </h1>
      <p className="lede" style={{ maxWidth: 680 }}>
        Five short modules, from how Suno reads your prompt to the tricks experienced creators use. Every tag is copyable, and every example opens in the builder.
      </p>

      <ol className="lm-cards">
        {modules.map((m) => (
          <li key={m.slug}>
            <Link href={`/learn/${m.slug}`} className="lm-card">
              <span className="lm-card-top">
                <span className="why-n" aria-hidden="true">{m.number}</span>
                <span className="lm-card-meta">{m.level} · {m.minutes} min</span>
              </span>
              <span className="lm-card-title">{m.title}</span>
              <span className="lm-card-sub">{m.subtitle}</span>
            </Link>
          </li>
        ))}
      </ol>

      <aside className="lm-callout" style={{ marginTop: 40 }}>
        <p className="lm-p" style={{ margin: 0 }}>
          <strong>How to read the advice here.</strong> Where Suno has documented something, we say so. Everything else is a technique creators commonly use. Suno is unpredictable, so try anything important a couple of times before you judge it.
        </p>
      </aside>
    </LearnShell>
  );
}
