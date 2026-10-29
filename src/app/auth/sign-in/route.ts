// GET /auth/sign-in?next=/%23build: starts Google sign-in (PKCE). The
// verifier cookie set here is read back in /auth/callback.

import { redirectWith, safeNext, supabaseConfigured, supabaseForRequest } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const headers = new Headers();
  if (!supabaseConfigured()) return redirectWith("/?auth=unavailable", headers);

  const supabase = supabaseForRequest(request, headers);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data?.url) {
    console.error("auth: sign-in start failed", error?.message);
    return redirectWith("/?auth=error#build", headers);
  }
  return redirectWith(data.url, headers);
}
