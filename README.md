# PromptSuno

Better Suno v6 style prompts, backed by a style-relationship engine.
*An independent tool. Not affiliated with Suno.*

## Stack

- Next.js 16 (App Router) with TypeScript, Tailwind CSS 4 and Vitest
- Coming as the build progresses: shadcn/ui, Framer Motion, Supabase (Postgres + Auth), Stripe, OpenAI
- Hosted on Vercel

## Getting started

Requires Node 22 or newer. Python 3.10 or newer is only needed to rebuild the catalog.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests (Vitest) |
| `npm run catalog:build` | Rebuild `data/catalog/v2` from the v1 sources |
| `npm run catalog:validate` | Integrity checks on catalog v2 |

## Layout

```
data/catalog/       style catalog: v1 sources, v2 build output, README
scripts/catalog/    Python build + validation for the catalog
src/app/            Next.js routes (placeholder until the design lands)
src/lib/catalog/    typed, server-only access to catalog v2
```

## Environment

Copy `.env.example` to `.env.local` and fill in values as each service is added. Never commit real keys.
