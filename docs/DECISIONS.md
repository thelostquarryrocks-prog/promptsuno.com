# Decisions

Calls made during the v1 build that depart from the comp or the Ship Brief, or that someone will wonder about later. One line each, newest first. The Ship Brief lives in the claude.ai project docs.

## 2026-10-28 · M3 accounts (code)

- Google sign-in runs on the server with PKCE (`/auth/sign-in` → Google → `/auth/callback`), using `@supabase/ssr` on plain Request and Response objects. There's no proxy/middleware: the API route refreshes the session when it reads it and passes the new cookies along.
- Sign-out is POST-only, so a link or prefetch can't sign anyone out.
- `next` redirects accept same-site paths only, to stop open redirects.
- The browser's auth client loads lazily, only when sign-in is on, so visitors don't download it up front.
- The bubble promises the daily allowance (20), not a remaining count, which visitors don't have.
- The Supabase publishable key (`sb_publishable_`) is used as the public key. New-style keys are the platform's recommendation, and RLS protects the data.

## 2026-10-28 · M2 generation and limits

- Limits are enforced inside Postgres (`claim_generation` and `finish_generation`), with a row lock so two fast requests can't both slip past a limit. RLS is on with no policies; only the service role can call the functions. Tested against a local Postgres 16.
- Defaults live in one `generation_settings` row and change without a deploy: 1 prompt per visitor per day, 5 per IP per day, 300 signed-out per day across the site, 20 per day and 3 per minute per signed-in user. Days are UTC.
- `anon_enabled` is the kill switch. Hitting the 300 ceiling turns it off automatically, and it stays off until someone turns it back on.
- Failed generations are recorded as failed and never count against anyone.
- Visitors get an HttpOnly `ps_v` cookie. The token and the IP are stored only as keyed hashes (HMAC-SHA256).
- Styles picked in the builder are merged with the styles found in the idea text. The writer on its own would replace one with the other.
- The Sign in button needs `NEXT_PUBLIC_GOOGLE_SIGNIN=on` as well as Supabase, because the database goes live before Google sign-in does.

## 2026-10-28 · M1 homepage

- Next.js 16.4.0 → 16.4.3: three critical advisories (incl. remote code execution in image optimization and `use cache`). Also applied the non-breaking fix for a dev-only zod advisory.
- Plus Jakarta Sans is self-hosted with `next/font/local` (OFL, `src/app/fonts/OFL.txt`) instead of `next/font/google`, so builds don't depend on reaching Google Fonts.
- Hero subtitle changed from "Turn your ideas into original music with AI": PromptSuno makes prompts, not music.
- Dropped the comp's wheel-hijack scroll (one flick jumps a whole section). It fights trackpads and accessibility settings. The hero still fades as you scroll.
- The comp's five chips cover the catalog's ten categories: era → Genre, energy → Mood, rhythm → Instruments, texture and structure → Production, Instrumental → Vocals. Limits: Genre 3, Mood 3, Instruments 4, Vocals 2, Production 3.
- Category panels show the 12 most-connected launch styles first, then "Show all".
- The result card has one copy button per Suno field (style, exclude, lyrics), because Suno has separate fields.
- Weirdness and Style influence stay in the advanced panel, labelled "set in Suno". PromptSuno can't set them, so the result card shows them as reminders.
- A failed or refused generation never clears a result the person already has.
- Premium keeps the comp's $8, labelled Coming soon with the button disabled. A waitlist needs the database, so it waits for M3 or V2.
- Removed links with nowhere to go: "View all FAQs", Blog, Help, socials, Cookies (covered on the Privacy page).
- `/api/generate` validates requests but refuses to call OpenAI (503) until server-side limits exist. No limits, no model calls.
- The Privacy page says we don't keep idea text. Usage logs in M2 must store counts and cost, never the idea.
- Only production (`VERCEL_ENV=production`) is indexable; previews send `Disallow: /`.
- The comp's button reset now uses `:where(.ps) button`, so component padding wins over it (FAQ rows and chips were losing their padding).
