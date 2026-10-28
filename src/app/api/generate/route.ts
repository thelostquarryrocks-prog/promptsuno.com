// POST /api/generate: idea + tags in, a four-part Suno prompt out.
// The work happens in src/lib/generate/handle.ts; this file wires in the
// real dependencies. With no database configured, it refuses to call the model.

import { handleGenerate } from "@/lib/generate/handle";
import { limitsFromEnv } from "@/lib/limits";
import { hashSecret } from "@/lib/limits/identity";
import { DAILY_FREE_PROMPTS } from "@/lib/site";
import { writePrompt } from "@/lib/writer";

export async function POST(request: Request): Promise<Response> {
  return handleGenerate(request, {
    limits: limitsFromEnv(),
    secret: hashSecret(),
    // Accounts arrive in M3; until then everyone is a visitor.
    getUserId: async () => null,
    write: writePrompt,
    dailyUserLimit: DAILY_FREE_PROMPTS,
  });
}
