// POST /api/generate: idea + tags in, a four-part Suno prompt out.
// The work happens in src/lib/generate/handle.ts; this file wires in the
// real dependencies. With no database configured, it refuses to call the model.

import { handleGenerate } from "@/lib/generate/handle";
import { limitsFromEnv } from "@/lib/limits";
import { hashSecret } from "@/lib/limits/identity";
import { DAILY_FREE_PROMPTS } from "@/lib/site";
import { userIdFromRequest } from "@/lib/supabase/server";
import { writePrompt } from "@/lib/writer";

export async function POST(request: Request): Promise<Response> {
  // Refreshed session cookies, if any, are carried onto the response.
  const authHeaders = new Headers();
  const res = await handleGenerate(request, {
    limits: limitsFromEnv(),
    secret: hashSecret(),
    getUserId: () => userIdFromRequest(request, authHeaders),
    write: writePrompt,
    dailyUserLimit: DAILY_FREE_PROMPTS,
  });
  const cookies = authHeaders.getSetCookie();
  if (!cookies.length) return res;
  const headers = new Headers(res.headers);
  for (const c of cookies) headers.append("set-cookie", c);
  return new Response(res.body, { status: res.status, headers });
}
