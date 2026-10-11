// Writer configuration: models per tier, prices, output limits.
// Server-only. Models are overridable from the environment so they can be
// swapped without a deploy of code changes.

export type Tier = "anonymous" | "free" | "pro";

/**
 * Default models per tier. OpenAI's pricing page (checked Oct 11, 2026) lists
 * GPT-5.6 Sol / Terra / Luna by display name only; these IDs are the expected
 * API names. `npm run writer -- --list-models` shows what the key can use.
 */
const DEFAULT_MODELS: Record<Tier, string> = {
  anonymous: "gpt-5.6-luna",
  free: "gpt-5.6-luna",
  pro: "gpt-5.6-terra",
};

const ENV_KEYS: Record<Tier, string> = {
  anonymous: "OPENAI_MODEL_ANONYMOUS",
  free: "OPENAI_MODEL_FREE",
  pro: "OPENAI_MODEL_PRO",
};

export function modelFor(tier: Tier, env: NodeJS.ProcessEnv = process.env): string {
  return env[ENV_KEYS[tier]]?.trim() || env.OPENAI_MODEL_FREE?.trim() || DEFAULT_MODELS[tier];
}

/** USD per 1M tokens, standard tier, short context. Source: openai.com/api/pricing, Oct 11, 2026. */
export interface Price {
  input: number;
  cachedInput: number;
  output: number;
}

export const PRICES: Record<string, Price> = {
  "gpt-5.6-sol": { input: 5.0, cachedInput: 0.5, output: 30.0 },
  "gpt-5.6-terra": { input: 2.0, cachedInput: 0.2, output: 12.0 },
  "gpt-5.6-luna": { input: 0.2, cachedInput: 0.02, output: 1.2 },
};

/**
 * Price for a model ID as the API reports it. Responses often name a dated
 * snapshot ("gpt-5.6-luna-2026-09-15"), so the longest known prefix wins.
 * Unknown models return undefined: cost is reported as unknown, never guessed.
 */
export function priceFor(model: string): Price | undefined {
  const id = model.toLowerCase();
  let best: string | undefined;
  for (const key of Object.keys(PRICES)) {
    if ((id === key || id.startsWith(`${key}-`)) && (!best || key.length > best.length)) best = key;
  }
  return best ? PRICES[best] : undefined;
}

/**
 * Reasoning effort sent with the request. GPT-5-family models reason by
 * default, and reasoning tokens are billed as output; "low" keeps cost and
 * latency down. Set OPENAI_REASONING_EFFORT=off for models that reject it.
 */
export function reasoningEffortFor(env: NodeJS.ProcessEnv = process.env): string | null {
  const v = env.OPENAI_REASONING_EFFORT?.trim().toLowerCase();
  if (v === "off") return null;
  return v || "low";
}

/** Hard ceiling on output tokens, reasoning included. A full answer is ~400-700 visible tokens. */
export const MAX_OUTPUT_TOKENS = 4000;
export const REQUEST_TIMEOUT_MS = 60_000;
export const OPENAI_BASE_URL = "https://api.openai.com/v1";

/** Output caps enforced in code after the model answers. */
export const MAX_EXCLUDES = 8;
export const MAX_SECTIONS = 12;
export const MAX_WHY = 3;
