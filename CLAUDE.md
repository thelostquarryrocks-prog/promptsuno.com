@AGENTS.md

# PromptSuno — working rules

Product decisions and current status live in the claude.ai project docs (`product-vision.md`, `build-log.md`, `style-catalog-v2.md`). This file holds only the rules for working in the code.

## Engineering rules
- **Every OpenAI call costs money.** Credit checks, rate limiting and usage logging happen server-side before any generation call. Never trust the client for credit balances or plan status.
- **Stripe webhooks are the source of truth** for subscription state. Never infer plan status from client redirects.
- **Supabase Row Level Security on every table.** Service-role and API keys stay server-only, and never get a `NEXT_PUBLIC_` prefix.
- TypeScript everywhere. Use App Router server components and actions where they fit. Use shadcn/ui components before writing custom ones.
- Animations must be purposeful and cheap. Nothing that hurts load time or mobile.

## Catalog and engine
- `src/lib/catalog` is **server-only**. The relationship data is about 1.3 MB; never import it into a client component.
- A missing edge means **unknown**, not a clash. Treat the two differently.
- Edge source precedence: tested > generated > rule > claude-curated > inferred. Weight inferred edges less.
- Regenerate catalog data with `npm run catalog:build`; never hand-edit files in `data/catalog/v2`.

## Before committing
`npm run lint && npm run typecheck && npm test && npm run build`

## Design
The Claude Design work is the visual source of truth. Until it lands, `src/app` is a placeholder. Don't build UI styling ahead of it.
