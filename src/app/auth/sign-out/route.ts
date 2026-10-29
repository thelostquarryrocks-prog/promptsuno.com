// POST /auth/sign-out: ends the session and returns home. POST only, so a
// link or prefetch can't sign anyone out.

import { redirectWith, supabaseConfigured, supabaseForRequest } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<Response> {
  const headers = new Headers();
  if (supabaseConfigured()) {
    const supabase = supabaseForRequest(request, headers);
    await supabase.auth.signOut();
  }
  return redirectWith("/", headers);
}
