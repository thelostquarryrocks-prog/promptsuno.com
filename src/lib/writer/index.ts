// The writer: idea (or edited chips) -> engine -> one model call -> checked
// Suno prompt. Server-only.
//
//   const result = await writePrompt({ idea: "sad piano, cinematic strings" }, { tier: "free" });
//   result.prompt   // style, exclude, sections, lyricsSkeleton, why
//   result.costUsd  // what this call cost
//
// This module does NOT check credits or rate limits. The API route must do
// that before calling it, log the usage after, and charge nothing when it
// throws a WriterError.

import { analyze } from "@/lib/engine";
import { parseIdea } from "@/lib/idea";
import { modelFor, reasoningEffortFor } from "./config";
import { callWriterModel, costOf } from "./openai";
import { buildWriterMessage, WRITER_INSTRUCTIONS } from "./prompt";
import { checkOutput, parseRawOutput } from "./schema";
import type { WriterInput, WriterOptions, WriterResult } from "./types";
import { WriterError } from "./types";

export { modelFor, PRICES, priceFor, type Tier } from "./config";
export { costOf, requestBody } from "./openai";
export { buildWriterMessage, WRITER_INSTRUCTIONS } from "./prompt";
export { checkOutput, OUTPUT_SCHEMA, parseRawOutput } from "./schema";
export * from "./types";

export async function writePrompt(input: WriterInput, opts: WriterOptions): Promise<WriterResult> {
  const env = opts.env ?? process.env;
  const apiKey = opts.apiKey ?? env.OPENAI_API_KEY;
  if (!apiKey) throw new WriterError("missing_api_key", "OPENAI_API_KEY isn't set on the server.");

  const parsed = parseIdea(input.idea);
  const tags = input.tags ?? parsed.tags;
  const userExcludeTerms = input.exclude ?? parsed.exclude;
  const brief = analyze(tags, {
    library: opts.tier === "pro" ? "full" : "launch",
    exclude: userExcludeTerms,
  });
  const userExcludes = brief.exclude.filter((e) => e.reason === "user").map((e) => e.name);
  // Excludes the engine couldn't resolve are still the person's words; keep them verbatim.
  const unresolvedExcludes = userExcludeTerms.filter((t) => brief.unresolved.includes(t));

  const model = opts.model ?? modelFor(opts.tier, env);
  const call = await callWriterModel({
    apiKey,
    model,
    instructions: WRITER_INSTRUCTIONS,
    input: buildWriterMessage(parsed, brief, [...userExcludes, ...unresolvedExcludes]),
    reasoningEffort: reasoningEffortFor(env),
    fetch: opts.fetch,
  });

  const raw = parseRawOutput(call.text);
  const { prompt, warnings } = checkOutput(raw, {
    references: parsed.references,
    userExcludes: [...userExcludes, ...unresolvedExcludes],
    tags: brief.styles.filter((s) => s.role !== "outlier").map((s) => s.name),
  });

  return {
    prompt,
    model: call.model,
    usage: call.usage,
    costUsd: costOf(call.model, call.usage),
    latencyMs: call.latencyMs,
    warnings,
    parsed,
    brief,
  };
}
