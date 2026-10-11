// Run the writer against the real OpenAI API from your own machine.
// Reads OPENAI_API_KEY from .env.local. Never prints the key.
//
//   npm run writer                         # the six sample ideas, free-tier model
//   npm run writer -- "your idea here"     # one idea
//   npm run writer -- --tier pro           # Pro model (full library)
//   npm run writer -- --model gpt-5.6-sol  # any model ID
//   npm run writer -- --list-models        # model IDs your key can use
//
// Each run is also saved to writer-runs/<time>.json (git-ignored), without the key.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { modelFor, writePrompt, WriterError, type Tier, type WriterResult } from "../../src/lib/writer";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fine if the variables are already in the environment
}

const SAMPLES = [
  "moody 80s synthwave about driving at night, female vocals, no guitar",
  "sad piano ballad about my grandmother's garden, cinematic strings, 70 bpm",
  "piano, cinematic, melancholic but with a driving rhythm",
  "something like Daft Punk but darker",
  "chill lofi hip hop beat for studying, no vocals",
  "trap banger with heavy 808s and autotune, no piano",
];

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function listModels(apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
  const body = (await res.json()) as { data?: { id: string }[]; error?: { message?: string } };
  if (!res.ok) throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  const ids = (body.data ?? []).map((m) => m.id).filter((id) => /^(gpt|o\d)/.test(id)).sort();
  console.log(ids.join("\n"));
}

const usd = (x: number | null) => (x === null ? "unknown" : `$${x.toFixed(5)}`);

function print(r: WriterResult) {
  const p = r.prompt;
  console.log(`\nChips: ${r.parsed.tags.join(", ") || "(none)"}${r.parsed.references.length ? `   refs: ${r.parsed.references.join(", ")}` : ""}`);
  console.log(`\nSTYLE (${p.style.length} chars)\n${p.style}`);
  console.log(`\nEXCLUDE\n${p.exclude.join(", ") || "(none)"}`);
  console.log(`\nSTRUCTURE\n${p.sections.map((s) => `[${s.tag}]  ${s.note}`).join("\n")}`);
  console.log(`\nWHY\n${p.why.map((w) => `- ${w}`).join("\n")}`);
  if (r.warnings.length) console.log(`\nFIXED BY CODE\n${r.warnings.map((w) => `- ${w}`).join("\n")}`);
  const u = r.usage;
  console.log(
    `\n${r.model} | in ${u.inputTokens} (cached ${u.cachedInputTokens}) | out ${u.outputTokens} (reasoning ${u.reasoningTokens}) | ${usd(r.costUsd)} | ${(r.latencyMs / 1000).toFixed(1)}s`,
  );
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY isn't set. Put it in .env.local in the repo folder.");
    process.exit(1);
  }
  if (process.argv.includes("--list-models")) return listModels(apiKey);

  const tier = (flag("tier") ?? "free") as Tier;
  const model = flag("model") ?? modelFor(tier);
  const skip = new Set(["--tier", "--model", flag("tier"), flag("model")]);
  const ideaArgs = process.argv.slice(2).filter((a) => !skip.has(a));
  const ideas = ideaArgs.length ? [ideaArgs.join(" ")] : SAMPLES;

  console.log(`Model: ${model}   Tier: ${tier}   Ideas: ${ideas.length}`);
  const runs: unknown[] = [];
  const costs: number[] = [];
  let failures = 0;

  for (const idea of ideas) {
    console.log(`\n${"=".repeat(78)}\nIDEA: ${idea}`);
    try {
      const r = await writePrompt({ idea }, { tier, model });
      print(r);
      if (r.costUsd !== null) costs.push(r.costUsd);
      runs.push({ idea, model: r.model, prompt: r.prompt, usage: r.usage, costUsd: r.costUsd, latencyMs: r.latencyMs, warnings: r.warnings, tags: r.parsed.tags });
    } catch (err) {
      failures++;
      const msg = err instanceof WriterError ? `${err.code}: ${err.message}` : String(err);
      console.log(`\nFAILED  ${msg}`);
      runs.push({ idea, model, error: msg });
    }
  }

  console.log(`\n${"=".repeat(78)}`);
  if (costs.length) {
    const avg = costs.reduce((a, b) => a + b, 0) / costs.length;
    console.log(`Average cost per generation: ${usd(avg)}   (${usd(avg * 1000)} per 1,000)   failures: ${failures}`);
  } else {
    console.log(`No cost measured${failures ? ` (${failures} failed)` : " (model not in the price table)"}.`);
  }

  mkdirSync("writer-runs", { recursive: true });
  const file = join("writer-runs", `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify({ model, tier, runs }, null, 2));
  console.log(`Saved to ${file}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
