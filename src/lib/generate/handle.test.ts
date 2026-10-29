import { describe, expect, it, vi } from "vitest";
import type { Actor, Claim, LimitsStore, Outcome } from "@/lib/limits";
import { VISITOR_COOKIE } from "@/lib/limits/identity";
import { WriterError, type WriterInput, type WriterResult } from "@/lib/writer";
import { handleGenerate, type GenerateDeps } from "./handle";

class FakeLimits implements LimitsStore {
  claims: Actor[] = [];
  finished: { id: number; outcome: Outcome }[] = [];
  constructor(private readonly next: Claim | Error = { allowed: true, eventId: 7, remaining: null }) {}
  async claim(actor: Actor) {
    this.claims.push(actor);
    if (this.next instanceof Error) throw this.next;
    return this.next;
  }
  async finish(id: number, outcome: Outcome) {
    this.finished.push({ id, outcome });
  }
}

const fakeResult = {
  prompt: { style: "synthwave, dreamy", exclude: ["autotune"], sections: [{ tag: "Verse 1", note: "hush" }], lyricsSkeleton: "[Verse 1]\n", why: ["because"] },
  model: "gpt-5.6-luna",
  usage: { inputTokens: 1200, cachedInputTokens: 800, outputTokens: 500, reasoningTokens: 100 },
  costUsd: 0.0012,
  latencyMs: 2100,
  warnings: [],
} as unknown as WriterResult;

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://promptsuno.com/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "203.0.113.9", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const deps = (over: Partial<GenerateDeps> = {}): GenerateDeps & { limits: FakeLimits; write: ReturnType<typeof vi.fn> } =>
  ({
    limits: new FakeLimits(),
    secret: "test-secret",
    getUserId: async () => null,
    write: vi.fn(async () => fakeResult),
    dailyUserLimit: 20,
    ...over,
  }) as GenerateDeps & { limits: FakeLimits; write: ReturnType<typeof vi.fn> };

describe("handleGenerate", () => {
  it("rejects a bad body before anything else", async () => {
    const d = deps();
    const res = await handleGenerate(req("not json"), d);
    expect(res.status).toBe(400);
    expect(d.limits.claims).toHaveLength(0);
    expect(d.write).not.toHaveBeenCalled();
  });

  it("refuses to call the model without a limits store", async () => {
    const write = vi.fn();
    const res = await handleGenerate(req({ idea: "night drive" }), { ...deps(), limits: null, write });
    expect(res.status).toBe(503);
    expect(write).not.toHaveBeenCalled();
  });

  it("claims, writes, records the cost, and returns the four parts", async () => {
    const d = deps();
    const res = await handleGenerate(req({ idea: "night drive", tags: ["Synthwave"], exclude: ["autotune"] }), d);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, prompt: fakeResult.prompt, remaining: null });
    expect(d.limits.finished).toEqual([
      { id: 7, outcome: expect.objectContaining({ ok: true, model: "gpt-5.6-luna", costUsd: 0.0012, inputTokens: 1200 }) },
    ]);
  });

  it("gives a new visitor a cookie and identifies them only by hashes", async () => {
    const d = deps();
    const res = await handleGenerate(req({ idea: "night drive" }), d);
    expect(res.headers.get("set-cookie")).toContain(`${VISITOR_COOKIE}=`);
    expect(res.headers.get("set-cookie")).toContain("HttpOnly");
    const actor = d.limits.claims[0];
    expect(actor.userId).toBeNull();
    expect(actor.visitorHash).toMatch(/^[\w-]{43}$/);
    expect(actor.ipHash).toMatch(/^[\w-]{43}$/);
    expect(actor.ipHash).not.toContain("203.0.113.9");
  });

  it("keeps a returning visitor's token", async () => {
    const token = "0b9a4c5e-1d2f-4a3b-8c7d-6e5f4a3b2c1d";
    const d = deps();
    const res = await handleGenerate(req({ idea: "x y" }, { cookie: `${VISITOR_COOKIE}=${token}` }), d);
    expect(res.headers.get("set-cookie")).toBeNull();
    const again = deps();
    await handleGenerate(req({ idea: "x y" }, { cookie: `${VISITOR_COOKIE}=${token}` }), again);
    expect(again.limits.claims[0].visitorHash).toBe(d.limits.claims[0].visitorHash);
  });

  it("identifies a signed-in user by id, not by hashes", async () => {
    const d = deps({ getUserId: async () => "user-1", limits: new FakeLimits({ allowed: true, eventId: 1, remaining: 19 }) });
    const res = await handleGenerate(req({ idea: "x" }), d);
    expect(d.limits.claims[0]).toEqual({ userId: "user-1", visitorHash: null, ipHash: null });
    expect((await res.json()).remaining).toBe(19);
    expect(d.write.mock.calls[0][1]).toEqual({ tier: "free" });
  });

  it("asks a visitor to sign in once the free prompt is used, without calling the model", async () => {
    const d = deps({ limits: new FakeLimits({ allowed: false, code: "signin_required" }) });
    const res = await handleGenerate(req({ idea: "x" }), d);
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("signin_required");
    expect(d.write).not.toHaveBeenCalled();
  });

  it("tells a user over quota how many they had", async () => {
    const d = deps({ getUserId: async () => "u", limits: new FakeLimits({ allowed: false, code: "quota_exceeded" }) });
    const res = await handleGenerate(req({ idea: "x" }), d);
    expect(res.status).toBe(429);
    expect((await res.json()).error.message).toContain("20 prompts");
  });

  it("records a failed write as failed so it doesn't count", async () => {
    const d = deps({ write: vi.fn(async () => { throw new WriterError("timeout", "slow"); }) });
    const res = await handleGenerate(req({ idea: "x" }), d);
    expect(res.status).toBe(502);
    expect(d.limits.finished[0].outcome).toEqual(expect.objectContaining({ ok: false, errorCode: "timeout" }));
  });

  it("reports unavailable when the database is down", async () => {
    const d = deps({ limits: new FakeLimits(new Error("down")) });
    const res = await handleGenerate(req({ idea: "x" }), d);
    expect(res.status).toBe(503);
    expect(d.write).not.toHaveBeenCalled();
  });

  it("merges styles from the idea with picked tags, and folds tempo and key into the idea", async () => {
    const d = deps();
    await handleGenerate(req({ idea: "dreamy synthwave", tags: ["Female Vocals"], bpm: 96, key: "A minor" }), d);
    const input = d.write.mock.calls[0][0] as WriterInput;
    expect(input.idea).toBe("dreamy synthwave, 96 bpm, in A minor");
    expect(input.tags).toEqual(expect.arrayContaining(["Synthwave", "Dreamy", "Female Vocals"]));
  });

  it("never hands the idea text to the limits store", async () => {
    const d = deps();
    await handleGenerate(req({ idea: "my secret song about Alice" }), d);
    expect(JSON.stringify(d.limits.claims)).not.toContain("Alice");
    expect(JSON.stringify(d.limits.finished)).not.toContain("Alice");
  });
});
