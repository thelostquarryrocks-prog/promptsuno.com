import { describe, expect, it, vi } from "vitest";
import { SupabaseLimits } from "./index";
import { keyedHash, readCookie, visitorToken } from "./identity";

const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("SupabaseLimits", () => {
  it("sends a new-style secret key on apikey only", async () => {
    const f = vi.fn(async () => okJson([{ allowed: true, code: null, remaining: 0, event_id: 5 }]));
    const store = new SupabaseLimits("https://x.supabase.co/", "sb_secret_abc", f as unknown as typeof fetch);
    await store.claim({ userId: null, visitorHash: "v", ipHash: "i" });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://x.supabase.co/rest/v1/rpc/claim_generation");
    const headers = init.headers as Record<string, string>;
    expect(headers.apikey).toBe("sb_secret_abc");
    expect(headers.authorization).toBeUndefined();
  });

  it("sends a legacy JWT key on both headers", async () => {
    const f = vi.fn(async () => okJson([{ allowed: true, code: null, remaining: 0, event_id: 5 }]));
    await new SupabaseLimits("https://x.supabase.co", "eyJlegacy", f as unknown as typeof fetch).claim({ userId: null, visitorHash: "v", ipHash: null });
    const headers = (f.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer eyJlegacy");
  });

  it("maps a refusal and hides remaining counts from visitors", async () => {
    const refuse = vi.fn(async () => okJson([{ allowed: false, code: "signin_required", remaining: null, event_id: null }]));
    expect(await new SupabaseLimits("u", "sb_secret_k", refuse as unknown as typeof fetch).claim({ userId: null, visitorHash: "v", ipHash: null })).toEqual({
      allowed: false,
      code: "signin_required",
    });
    const allow = vi.fn(async () => okJson([{ allowed: true, code: null, remaining: 0, event_id: 9 }]));
    expect(await new SupabaseLimits("u", "sb_secret_k", allow as unknown as typeof fetch).claim({ userId: null, visitorHash: "v", ipHash: null })).toEqual({
      allowed: true,
      eventId: 9,
      remaining: null,
    });
  });

  it("throws on an HTTP error so the route can report unavailable", async () => {
    const f = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(new SupabaseLimits("u", "sb_secret_k", f as unknown as typeof fetch).claim({ userId: "x", visitorHash: null, ipHash: null })).rejects.toThrow();
  });
});

describe("identity", () => {
  it("hashes the same input the same way, and differently by kind", () => {
    expect(keyedHash("s", "ip", "1.2.3.4")).toBe(keyedHash("s", "ip", "1.2.3.4"));
    expect(keyedHash("s", "ip", "1.2.3.4")).not.toBe(keyedHash("s", "visitor", "1.2.3.4"));
    expect(keyedHash("s", "ip", "1.2.3.4")).not.toBe(keyedHash("t", "ip", "1.2.3.4"));
  });

  it("reads cookies and rejects malformed tokens", () => {
    expect(readCookie("a=1; ps_v=abc; b=2", "ps_v")).toBe("abc");
    expect(visitorToken("ps_v=not-a-token").isNew).toBe(true);
    expect(visitorToken("ps_v=0b9a4c5e-1d2f-4a3b-8c7d-6e5f4a3b2c1d")).toEqual({ token: "0b9a4c5e-1d2f-4a3b-8c7d-6e5f4a3b2c1d", isNew: false });
  });
});
