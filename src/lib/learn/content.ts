// Learn modules: Markdown files in content/learn, parsed at build time.
// Server-only (reads the filesystem). Pages under /learn are prerendered.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { marked, type Token, type TokensList } from "marked";

export interface LearnModuleMeta {
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  minutes: number;
  level: string;
}

export interface LearnModule extends LearnModuleMeta {
  tokens: TokensList;
  /** Level-2 headings, for the on-page outline. */
  outline: { id: string; text: string }[];
}

const DIR = path.join(process.cwd(), "content", "learn");

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Splits `---` front matter (simple `key: value` lines) from the body. */
export function parseFrontMatter(source: string): { meta: Record<string, string>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(source);
  if (!m) return { meta: {}, body: source };
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: source.slice(m[0].length) };
}

export function parseModule(source: string): LearnModule {
  const { meta, body } = parseFrontMatter(source);
  const required = ["slug", "number", "title", "subtitle", "minutes", "level"];
  for (const k of required) if (!meta[k]) throw new Error(`learn: module is missing "${k}"`);
  const tokens = marked.lexer(body);
  const outline = tokens
    .filter((t): t is Token & { type: "heading"; depth: number; text: string } => t.type === "heading" && (t as { depth: number }).depth === 2)
    .map((t) => ({ id: slugify(t.text), text: t.text.replace(/[`*_]/g, "") }));
  return {
    slug: meta.slug,
    number: Number(meta.number),
    title: meta.title,
    subtitle: meta.subtitle,
    minutes: Number(meta.minutes),
    level: meta.level,
    tokens,
    outline,
  };
}

let cache: LearnModule[] | null = null;

export function learnModules(): LearnModule[] {
  if (cache) return cache;
  cache = readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => parseModule(readFileSync(path.join(DIR, f), "utf8")))
    .sort((a, b) => a.number - b.number);
  return cache;
}

export function learnModule(slug: string): LearnModule | undefined {
  return learnModules().find((m) => m.slug === slug);
}

export function learnMeta(m: LearnModule): LearnModuleMeta {
  const { slug, number, title, subtitle, minutes, level } = m;
  return { slug, number, title, subtitle, minutes, level };
}
