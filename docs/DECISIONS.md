# Decisions

Calls made during the v1 build that depart from the comp or the Ship Brief, or that someone will wonder about later. One line each, newest first. The Ship Brief lives in the claude.ai project docs.

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
