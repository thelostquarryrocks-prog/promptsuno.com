# Writer

Step 3 of the generator: one OpenAI call that turns the idea and the engine's brief into the four-part Suno prompt. Server-only.

```ts
import { writePrompt, WriterError } from "@/lib/writer";

const r = await writePrompt({ idea }, { tier: "free" });           // from an idea
const r2 = await writePrompt({ idea, tags, exclude }, { tier });    // after chip edits
r.prompt   // style, exclude, sections, lyricsSkeleton, why
r.usage    // input / cached / output / reasoning tokens
r.costUsd  // null if the model isn't in the price table
```

**This module does not check credits.** The API route must check credits and rate limits before calling it, log usage after, and charge nothing when it throws a `WriterError`.

## How it works
1. `parseIdea` → `analyze` (free and anonymous use the launch library, Pro uses the full one).
2. One Responses API request (`/v1/responses`): static `WRITER_INSTRUCTIONS` first so OpenAI's automatic prompt caching can reuse them, then the per-request message. It uses strict JSON-schema output, `store: false`, `max_output_tokens` 4000, and reasoning effort `low`.
3. Code-side checks (`checkOutput`) enforce what a schema can't:
   - artist names from the idea are removed everywhere ("like Daft Punk" goes from the style text; prose says "that artist")
   - brackets are stripped from the style text, which is clamped to 1,000 characters
   - the person's excludes always come first, and nothing they chose is excluded
   - sections become a paste-ready lyrics skeleton
4. Cost is computed from the API's usage numbers and `PRICES` in `config.ts`, with cached input billed at its own rate.

The writing rules come from the project doc `suno-v6-prompting.md`.

## Models
Defaults are in `config.ts`: Luna for anonymous and free, Terra for Pro. Override with `OPENAI_MODEL_ANONYMOUS`, `OPENAI_MODEL_FREE` and `OPENAI_MODEL_PRO`. The model IDs are inferred from OpenAI's display names; check them with `npm run writer -- --list-models`.

## Trying it locally
`npm run writer` runs six sample ideas against the real API, using the key in `.env.local`. Each run prints the four parts, tokens, cost and latency, and saves a JSON log in `writer-runs/` (git-ignored). Flags:
- `--tier pro`
- `--model <id>`
- `"your idea"`

## Known limits
- Only artist names the parser caught as references are removed. A name the model invents on its own isn't detected.
- Prices are hand-copied from openai.com/api/pricing (Oct 11, 2026). Update `PRICES` when they change.
