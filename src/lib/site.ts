// Site-wide settings read on the server.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://promptsuno.com";

/** Prompts a signed-in free account gets per day. The server enforces it; this is for copy. */
export const DAILY_FREE_PROMPTS = 20;

/**
 * Google sign-in is switched on for this deployment. Separate from Supabase
 * being configured, because the database (limits) goes live before sign-in does.
 */
export function authEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === "on" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
