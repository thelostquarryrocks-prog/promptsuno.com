// Who is asking: a stable, private identity for signed-out visitors.
// Browser tokens and IP addresses are never stored as-is, only as keyed hashes.

import { createHmac, randomUUID } from "node:crypto";

export const VISITOR_COOKIE = "ps_v";
const ONE_YEAR_S = 60 * 60 * 24 * 365;
const TOKEN_RE = /^[0-9a-f-]{36}$/;

export function hashSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  return env.LIMITS_HASH_SECRET?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function keyedHash(secret: string, kind: "visitor" | "ip", value: string): string {
  return createHmac("sha256", secret).update(`${kind}:${value}`).digest("base64url");
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** The visitor's browser token, minting a new one when it's missing or malformed. */
export function visitorToken(cookieHeader: string | null): { token: string; isNew: boolean } {
  const existing = readCookie(cookieHeader, VISITOR_COOKIE);
  if (existing && TOKEN_RE.test(existing)) return { token: existing, isNew: false };
  return { token: randomUUID(), isNew: true };
}

export function visitorCookie(token: string, secure: boolean): string {
  return `${VISITOR_COOKIE}=${token}; Path=/; Max-Age=${ONE_YEAR_S}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** The client IP as Vercel reports it. Null when unknown (local development). */
export function clientIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || null;
}
