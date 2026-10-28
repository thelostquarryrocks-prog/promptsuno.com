// POST /api/generate: idea + tags in, a four-part Suno prompt out.
//
// Every call costs money, so the order is fixed: validate, check limits on the
// server, call the writer, log usage. Until the limits backend (Supabase) is
// configured, this route refuses to call the model at all.

import type { GenerateFailure, GenerateErrorCode } from "@/lib/generate/contract";
import { validateGenerateRequest } from "@/lib/generate/validate";

const fail = (status: number, code: GenerateErrorCode, message: string) =>
  Response.json({ ok: false, error: { code, message } } satisfies GenerateFailure, { status });

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "bad_request", "Send a JSON body.");
  }
  const parsed = validateGenerateRequest(body);
  if (!parsed.ok) return fail(400, "bad_request", parsed.message);

  // Limits arrive with the database (milestone 2). No limits, no model calls.
  return fail(503, "unavailable", "Prompt generation is switching on shortly. Keep your tags and try again in a bit.");
}
