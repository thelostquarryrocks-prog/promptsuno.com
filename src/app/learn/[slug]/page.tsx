import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LearnShell } from "@/components/learn/LearnShell";
import { Markdown } from "@/components/learn/Markdown";
import { learnMeta, learnModule, learnModules } from "@/lib/learn/content";
import { libraryStyles } from "@/lib/learn/library";

export function generateStaticParams() {
  return learnModules().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const m = learnModule(slug);
  if (!m) return {};
  return {
    title: `${m.title} · Learn Suno v6`,
    description: m.subtitle,
    alternates: { canonical: `/learn/${m.slug}` },
    openGraph: { type: "article", title: m.title, description: m.subtitle, url: `/learn/${m.slug}` },
  };
}

export default async function LearnModulePage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const m = learnModule(slug);
  if (!m) notFound();
  const all = learnModules();
  const i = all.findIndex((x) => x.slug === m.slug);
  const prev = all[i - 1];
  const next = all[i + 1];
  const needsLibrary = m.tokens.some((t) => t.type === "code" && (t as { lang?: string }).lang === "widget:library");

  return (
    <LearnShell modules={all.map(learnMeta)} current={m.slug} outline={m.outline}>
      <article className="lm-article">
        <p className="eyebrow">MODULE {m.number} · {m.level.toUpperCase()} · {m.minutes} MIN</p>
        <h1 className="h2 lm-title">{m.title}</h1>
        <p className="lede">{m.subtitle}</p>
        <Markdown tokens={m.tokens} library={needsLibrary ? libraryStyles() : undefined} />
      </article>

      <nav className="lm-pager" aria-label="Modules">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="lm-pager-link">
            <span className="lm-muted">Previous</span>
            <span>{prev.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/learn/${next.slug}`} className="lm-pager-link lm-pager-next">
            <span className="lm-muted">Next</span>
            <span>{next.title}</span>
          </Link>
        ) : (
          <Link href="/#build" className="lm-pager-link lm-pager-next">
            <span className="lm-muted">Put it to work</span>
            <span>Build a prompt</span>
          </Link>
        )}
      </nav>
    </LearnShell>
  );
}
