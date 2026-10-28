// The generation request, end to end, with its dependencies passed in so it
// can be tested without a database or the OpenAI API.
//
// Fixed order, because every model call costs money:
//   validate -> identify -> claim a slot (server-side limits) -> write -> record outcome.
// Idea text is never stored or logged.

import { parseIdea } from "@/lib/idea";
import type { LimitsStore, Actor } from "@/lib/limits";
import { clientIp, keyedHash, visitorCookie, visitorToken } from "@/lib/limits/identity";
import { WriterError, type WriterInput, type WriterOptions, type WriterResult } from "@/lib/writer";
import type { GenerateErrorCode, GenerateFailure, GenerateSuccess } from "./contract";
import { ideaWithSettings, validateGenerateRequest } from "./validate";

export interface GenerateDeps {
  limits: LimitsStore | null;
  /** Secret for hashing visitor tokens and IPs. */
  secret: string | null;
  /** The signed-in user's id, or null. */
  getUserId: () => Promise<string | null>;
  write: (input: WriterInput, opts: WriterOptions) => Promise<WriterResult>;
  dailyUserLimit: number;
}

const MESSAGES: Record<GenerateErrorCode, string> = {
  bad_request: "That request didn't look right. Refresh and try again.",
  signin_required: "That was your free prompt. Sign up free for daily prompts.",
  quota_exceeded: "You've used today's prompts. They reset at midnight UTC.",
  rate_limited: "Easy, producer. Give it a minute and try again.",
  unavailable: "Prompt generation is switching on shortly. Keep your tags and try again in a bit.",
  failed: "We couldn't write that one, and it didn't count against you. Try again.",
};

const STATUS: Record<GenerateErrorCode, number> = {
  bad_request: 400,
  signin_required: 401,
  quota_exceeded: 429,
  rate_limited: 429,
  unavailable: 503,
  failed: 502,
};

const unique = (xs: string[]) => [...new Set(xs)];

export async function handleGenerate(request: Request, deps: GenerateDeps): Promise<Response> {
  const headers = new Headers({ "cache-control": "no-store" });
  const fail = (code: GenerateErrorCode, message?: string) =>
    Response.json({ ok: false, error: { code, message: message ?? MESSAGES[code] } } satisfies GenerateFailure, {
      status: STATUS[code],
      headers,
    });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("bad_request", "Send a JSON body.");
  }
  const parsed = validateGenerateRequest(body);
  if (!parsed.ok) return fail("bad_request", parsed.message);
  const req = parsed.value;

  if (!deps.limits || !deps.secret) return fail("unavailable");

  // Who is asking.
  const userId = await deps.getUserId().catch(() => null);
  let actor: Actor;
  if (userId) {
    actor = { userId, visitorHash: null, ipHash: null };
  } else {
    const { token, isNew } = visitorToken(request.headers.get("cookie"));
    if (isNew) headers.append("set-cookie", visitorCookie(token, new URL(request.url).protocol === "https:"));
    const ip = clientIp(request.headers);
    actor = {
      userId: null,
      visitorHash: keyedHash(deps.secret, "visitor", token),
      ipHash: ip ? keyedHash(deps.secret, "ip", ip) : null,
    };
  }

  // Server-side limits, before any model call.
  let claim;
  try {
    claim = await deps.limits.claim(actor);
  } catch (err) {
    console.error("generate: limits claim failed", err instanceof Error ? err.message : err);
    return fail("unavailable");
  }
  if (!claim.allowed) {
    if (claim.code === "quota_exceeded") {
      return fail("quota_exceeded", `You've used today's ${deps.dailyUserLimit} prompts. They reset at midnight UTC.`);
    }
    return fail(claim.code);
  }

  // The styles found in the idea plus the ones picked in the builder.
  const idea = ideaWithSettings(req);
  const fromIdea = parseIdea(idea);
  const input: WriterInput = {
    idea,
    tags: req.tags.length ? unique([...fromIdea.tags, ...req.tags]) : undefined,
    exclude: req.exclude.length ? unique([...fromIdea.exclude, ...req.exclude]) : undefined,
  };

  try {
    const result = await deps.write(input, { tier: userId ? "free" : "anonymous" });
    await deps.limits
      .finish(claim.eventId, {
        ok: true,
        model: result.model,
        inputTokens: result.usage.inputTokens,
        cachedInputTokens: result.usage.cachedInputTokens,
        outputTokens: result.usage.outputTokens,
        costUsd: result.costUsd,
        latencyMs: result.latencyMs,
        errorCode: null,
      })
      .catch((err) => console.error("generate: finish failed", err instanceof Error ? err.message : err));
    const { style, exclude, sections, lyricsSkeleton, why } = result.prompt;
    return Response.json(
      { ok: true, prompt: { style, exclude, sections, lyricsSkeleton, why }, remaining: claim.remaining } satisfies GenerateSuccess,
      { headers },
    );
  } catch (err) {
    const code = err instanceof WriterError ? err.code : "unexpected";
    console.error("generate: writer failed", code, err instanceof Error ? err.message : "");
    await deps.limits
      .finish(claim.eventId, {
        ok: false,
        model: null,
        inputTokens: null,
        cachedInputTokens: null,
        outputTokens: null,
        costUsd: null,
        latencyMs: null,
        errorCode: code,
      })
      .catch((e) => console.error("generate: finish failed", e instanceof Error ? e.message : e));
    return fail(code === "missing_api_key" ? "unavailable" : "failed");
  }
}
