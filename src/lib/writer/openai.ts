// Minimal client for OpenAI's Responses API: one structured-output request.
// Plain fetch, no SDK. Server-only: the key comes from the server environment.

import { MAX_OUTPUT_TOKENS, OPENAI_BASE_URL, priceFor, REQUEST_TIMEOUT_MS } from "./config";
import { OUTPUT_SCHEMA } from "./schema";
import type { Usage } from "./types";
import { WriterError } from "./types";

export interface CallParams {
  apiKey: string;
  model: string;
  instructions: string;
  input: string;
  reasoningEffort: string | null;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface CallResult {
  text: string;
  /** The model ID the API actually served (often a dated snapshot). */
  model: string;
  usage: Usage;
  latencyMs: number;
}

interface ResponsesPayload {
  model?: string;
  status?: string;
  incomplete_details?: { reason?: string } | null;
  error?: { message?: string } | null;
  output?: {
    type?: string;
    content?: { type?: string; text?: string; refusal?: string }[];
  }[];
  usage?: {
    input_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
    output_tokens?: number;
    output_tokens_details?: { reasoning_tokens?: number };
  };
}

/** The request body, exported so tests can check it without a network call. */
export function requestBody(p: Omit<CallParams, "apiKey" | "fetch" | "timeoutMs">) {
  return {
    model: p.model,
    instructions: p.instructions,
    input: p.input,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    // Don't keep prompts on OpenAI's side; we log usage ourselves.
    store: false,
    text: { format: { type: "json_schema", name: "suno_prompt", strict: true, schema: OUTPUT_SCHEMA } },
    ...(p.reasoningEffort ? { reasoning: { effort: p.reasoningEffort } } : {}),
  };
}

export async function callWriterModel(p: CallParams): Promise<CallResult> {
  const doFetch = p.fetch ?? fetch;
  const started = Date.now();
  let res: Response;
  try {
    res = await doFetch(`${OPENAI_BASE_URL}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.apiKey}` },
      body: JSON.stringify(requestBody(p)),
      signal: AbortSignal.timeout(p.timeoutMs ?? REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      throw new WriterError("timeout", "OpenAI didn't answer in time.");
    }
    throw new WriterError("http_error", `Couldn't reach OpenAI: ${(err as Error)?.message ?? err}`);
  }
  const latencyMs = Date.now() - started;

  const payload = (await res.json().catch(() => ({}))) as ResponsesPayload;
  if (!res.ok) {
    // OpenAI's error messages don't include the key; safe to surface to logs.
    throw new WriterError("http_error", payload.error?.message ?? `OpenAI returned HTTP ${res.status}.`, res.status);
  }

  const content = (payload.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? []);
  const refusal = content.find((c) => c.type === "refusal");
  if (refusal) throw new WriterError("refused", refusal.refusal ?? "The model declined this request.");
  if (payload.status === "incomplete") {
    throw new WriterError("incomplete", `The answer was cut off (${payload.incomplete_details?.reason ?? "unknown reason"}).`);
  }
  const text = content
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
  if (!text) throw new WriterError("bad_output", "The model returned no text.");

  const u = payload.usage ?? {};
  return {
    text,
    model: payload.model ?? p.model,
    latencyMs,
    usage: {
      inputTokens: u.input_tokens ?? 0,
      cachedInputTokens: u.input_tokens_details?.cached_tokens ?? 0,
      outputTokens: u.output_tokens ?? 0,
      reasoningTokens: u.output_tokens_details?.reasoning_tokens ?? 0,
    },
  };
}

/** USD cost of one call, or null when the model isn't in the price table. Cached input is billed at its own rate. */
export function costOf(model: string, usage: Usage): number | null {
  const price = priceFor(model);
  if (!price) return null;
  const uncached = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
  return (
    (uncached * price.input + usage.cachedInputTokens * price.cachedInput + usage.outputTokens * price.output) /
    1_000_000
  );
}
