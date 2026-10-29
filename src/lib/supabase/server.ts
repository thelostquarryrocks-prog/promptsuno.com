// Supabase on the server, bound to one request. Cookies are read from the
// request and any cookies Supabase sets (session, PKCE verifier, refreshed
// tokens) are collected into `headers`, which the caller copies onto its
// response. Server-only.

import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

export function supabaseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseForRequest(request: Request, headers: Headers) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie") ?? "").map((c) => ({ name: c.name, value: c.value ?? "" }));
      },
      setAll(cookiesToSet, cacheHeaders) {
        for (const { name, value, options } of cookiesToSet) {
          headers.append("set-cookie", serializeCookieHeader(name, value, options));
        }
        for (const [k, v] of Object.entries(cacheHeaders ?? {})) headers.set(k, v);
      },
    },
  });
}

/** The signed-in user's id, verified, or null. Refreshed session cookies land in `headers`. */
export async function userIdFromRequest(request: Request, headers: Headers): Promise<string | null> {
  if (!supabaseConfigured()) return null;
  const supabase = supabaseForRequest(request, headers);
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}

/** Only same-site paths, so a crafted `next` can't bounce people to another site. */
export function safeNext(next: string | null, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** A redirect that carries the cookies Supabase set. */
export function redirectWith(location: string, headers: Headers, status = 303): Response {
  const h = new Headers(headers);
  h.set("location", location);
  h.set("cache-control", "no-store");
  return new Response(null, { status, headers: h });
}
