// Server-side generation limits. The rules live in the database
// (supabase/migrations/*_generation_limits.sql); this module calls them.
// Server-only: uses the Supabase service role key.

import type { GenerateErrorCode } from "@/lib/generate/contract";

export interface Actor {
  /** Signed-in Supabase user, or null for a visitor. */
  userId: string | null;
  /** Keyed hash of the visitor's browser token. */
  visitorHash: string | null;
  /** Keyed hash of the visitor's IP address. */
  ipHash: string | null;
}

export type Claim =
  | { allowed: true; eventId: number; remaining: number | null }
  | { allowed: false; code: Extract<GenerateErrorCode, "signin_required" | "quota_exceeded" | "rate_limited" | "bad_request"> };

export interface Outcome {
  ok: boolean;
  model: string | null;
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  latencyMs: number | null;
  errorCode: string | null;
}

export interface LimitsStore {
  claim(actor: Actor): Promise<Claim>;
  finish(eventId: number, outcome: Outcome): Promise<void>;
}

const CLAIM_CODES = new Set(["signin_required", "quota_exceeded", "rate_limited", "bad_request"]);

/** Calls the two database functions through Supabase's REST API. */
export class SupabaseLimits implements LimitsStore {
  constructor(
    private readonly url: string,
    private readonly serviceKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async rpc(fn: string, args: Record<string, unknown>): Promise<unknown> {
    // New-style secret keys (sb_secret_...) go on the apikey header only: the
    // platform rejects them in Authorization. Legacy JWT keys need both.
    const headers: Record<string, string> = { apikey: this.serviceKey, "content-type": "application/json" };
    if (!this.serviceKey.startsWith("sb_")) headers.authorization = `Bearer ${this.serviceKey}`;
    const res = await this.fetchImpl(`${this.url.replace(/\/$/, "")}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers,
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`limits: ${fn} failed with HTTP ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async claim(actor: Actor): Promise<Claim> {
    const rows = (await this.rpc("claim_generation", {
      p_user_id: actor.userId,
      p_visitor_hash: actor.visitorHash,
      p_ip_hash: actor.ipHash,
    })) as { allowed: boolean; code: string | null; remaining: number | null; event_id: number | null }[];
    const row = rows?.[0];
    if (!row) throw new Error("limits: claim_generation returned nothing");
    if (row.allowed && row.event_id !== null) {
      return { allowed: true, eventId: row.event_id, remaining: actor.userId ? row.remaining : null };
    }
    const code = row.code && CLAIM_CODES.has(row.code) ? row.code : "signin_required";
    return { allowed: false, code: code as Extract<Claim, { allowed: false }>["code"] };
  }

  async finish(eventId: number, o: Outcome): Promise<void> {
    await this.rpc("finish_generation", {
      p_event_id: eventId,
      p_ok: o.ok,
      p_model: o.model,
      p_input_tokens: o.inputTokens,
      p_cached_input_tokens: o.cachedInputTokens,
      p_output_tokens: o.outputTokens,
      p_cost_usd: o.costUsd,
      p_latency_ms: o.latencyMs,
      p_error_code: o.errorCode,
    });
  }
}

/** The limits store for this deployment, or null when the database isn't configured. */
export function limitsFromEnv(env: NodeJS.ProcessEnv = process.env): LimitsStore | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? new SupabaseLimits(url, key) : null;
}
