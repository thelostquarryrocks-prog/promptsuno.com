// GET /auth/callback?code=...&next=...: Google sends people back here.
// Exchanges the code for a session cookie, then returns them to the builder,
// where their saved draft is restored.

import { redirectWith, safeNext, supabaseConfigured, supabaseForRequest } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const headers = new Headers();
  if (!code || !supabaseConfigured()) return redirectWith("/?auth=error#build", headers);

  const supabase = supabaseForRequest(request, headers);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("auth: code exchange failed", error.message);
    return redirectWith("/?auth=error#build", headers);
  }
  return redirectWith(next, headers);
}
