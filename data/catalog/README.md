# PromptSuno style catalog v2

This is the cleaned and merged version of James's two v1 files:

- **`suno-style-matrix-v1.json`**: 899 styles and 6,449 weighted pairs. It was compiled with ChatGPT.
- **`suno-style-catalog-v1.json`**: the same 899 styles, each with a category, aliases, provenance, evidence and notes. The research date is 2026-09-27.

v2 is ready to load into Supabase and for the engine to read.

## What's here

| Path | What it is |
|---|---|
| `data/catalog/v2/styles.v2.json` | 899 styles: `id`, `name`, `category`, `secondary_categories`, `aliases`, `provenance`, `evidence`, `suno_audio_tested`, catalog notes, `launch` flag, `degree` |
| `data/catalog/v2/relationships.v2.json` | 9,403 undirected edges: `a`, `b`, `weight`, `kind`, `source` (and `confidence` and `via` for inferred edges) |
| `data/catalog/v2/launch-shortlist.csv` | The 187 proposed launch styles, showing which ones were seen in Suno sources, with an empty `approve` column |
| `data/catalog/v2/merge-candidates.csv` | 20 near-duplicate names, each with a recommendation |
| `data/catalog/v2/conflicts-for-review.csv` | 3 places where my additions disagree with the v1 weights |
| `data/catalog/v2/user-aliases.json` | 142 everyday words → styles (`80s`, `808s`, `chill`, `no vocals`…) for the idea → tags step |
| `data/catalog/v2/build-stats.json` | The numbers below |
| `scripts/catalog/` | The build, rules, curation and validation. Rerun with `npm run catalog:build`, then `npm run catalog:validate` (requires Python 3.10+) |

## What the catalog added

- **Categories come from the catalog.** It uses ten: genre (220), instrument (161), texture (90), production (84), vocal (79), rhythm (75), mood (68), structure (61), energy (37), era (24). Energy is especially useful to the engine. My own draft categories are retired; they agreed with the catalog 84% of the time.
- **Provenance.** 178 styles are `source_observed`, meaning they appeared in community or official Suno sources (S01–S11). The other 721 are `author_expansion`, meaning they were added by the researcher. None are Suno audio-tested yet. The catalog is honest about this.
- **Aliases and ambiguity.** 110 one-to-one aliases (`80s` → 1980s) plus ambiguous inputs (`808s` → 808 Drums or 808 Bass), merged with my list of everyday words.
- **Usage notes** carried through as they are. For example, the catalog notes that section-specific directions belong in the lyrics, not the style field, and warns that odd meters and microtonal tuning may not be followed precisely.
- **The two matrix files are identical in content.** Same 6,449 edges and same weights; only the formatting differs.

## What v2 changes

1. **Made symmetric.** v1 stored each pair once under the alphabetically earlier label. v2 stores each pair as one edge with `a < b`. No v1 weight was changed.
2. **Unknown is no longer the same as a clash.** The catalog itself says a missing pair means "unscored". v2 makes that explicit: no edge means unknown, and every edge that does exist has a kind:
   - `affinity`: 0.5 or higher
   - `tension`: 0.3 up to 0.5. The combination works, but the prompt has to reconcile it.
   - `clash`: below 0.3. The combination works against itself, so the engine should warn or exclude.
3. **Every edge says where it came from:**
   - `generated`: v1 matrix, 6,449 edges
   - `rule`: physical or logical opposites, 75 edges. These are clashes like slow tempo vs. very fast tempo, plus deliberate tensions like happy vs. sad.
   - `claude-curated`: mood × genre and mood × instrument judgments, 513 edges. For example, Cinematic↔Melancholic was missing from v1.
   - `inferred`: two-hop estimates for launch-set pairs only, 2,366 edges. Hub styles are discounted so they don't make everything look related. These are low confidence.
   - `tested`: James's Suno results. This source gets added once the tester tool exists.

Precedence: generated > rule > claude-curated > inferred. A later layer only fills gaps. Disagreements go to `conflicts-for-review.csv` instead of overwriting.

## Launch set coverage (187 styles, 17,391 possible pairs)

- **106 of the 187** launch styles were seen in Suno sources.
- **v1:** 1,084 pairs known (6%).
- **v2:** 3,988 pairs known (23%). The rest is honestly marked unknown.

The weakest areas the engine actually needs are:
- genre × vocal
- mood × vocal
- anything × production

Those are the first curation and testing targets.

## Decisions for James

1. **Launch shortlist:** approve, cut or swap styles in `launch-shortlist.csv`. The `seen_in_suno_sources` column shows which styles real users have been seen typing.
2. **Merges:** confirm the 20 near-duplicates.
3. **Conflicts:** 3 rows, mainly Euphoric↔Melancholic (v1 says affinity, my rules say tension). This is a good first Suno test.
4. **Source list:** the evidence points to sources S01–S11, but the file that says what those are isn't included. If you have it, it makes the "seen in Suno sources" claims checkable.
