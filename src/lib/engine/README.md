# Style engine

This turns a set of tags into a **brief** for the prompt-writing model. It's plain TypeScript: no model calls, and the same input always gives the same output. It's server-only because it reads the catalog.

```ts
import { analyze, toWriterContext, fallbackStyleText, excludeText } from "@/lib/engine";

const brief = analyze(["Piano", "Cinematic", "Driving Rhythm"], { library: "launch" });
toWriterContext(brief);   // compact text for the writer model
fallbackStyleText(brief); // style text without a model call
excludeText(brief);       // text for Suno's exclude-styles field
```

To try it from the terminal: `npm run engine -- Piano Cinematic "Driving Rhythm"`. Add `--full` to use the whole library instead of the launch set.

## What `analyze` does

1. **Resolves** each term to catalog styles: exact name, id, or alias (`80s`, `chill`, `808s`). Anything it can't resolve goes to `unresolved`.
2. **Scores every pair** as `weight × source trust`. The trust values are tested 1.0, rule 0.9, generated 0.85, claude-curated 0.75 and inferred 0.5. Tensions and clashes count as negatives, and an unknown pair counts as 0. An unknown pair is never treated as a clash.
3. **Assigns roles:**

   | Role | Meaning |
   |---|---|
   | `anchor` | The most cohesive genre |
   | `core` | Fits the selection well |
   | `support` | A loose fit, or unknown |
   | `contrast` | Has tensions with the selection, but no clash |
   | `outlier` | The weaker side of a clash, so it gets dropped |

   After outliers are set aside, roles are recalculated against what remains.
4. **Tensions and clashes.** A tension is either a `tension` edge or a "stretch" (an affinity weaker than 0.6). Each one comes with a short hint on how to reconcile it. Each clash names the style to drop. Exclusive groups, such as two tempos, are reported as `conflicts`.
5. **Suggestions** are built only on the styles that are kept. A suggestion has to fit at least two of them (one, if only one style is selected) and must not clash with any. Bonuses go to styles that fill a missing category (genre, instrument, vocal, mood) and to styles seen in Suno sources. There are at most 2 per category and 8 in total. With `library: "launch"`, suggestions come only from the approved launch set, which is the free tier's library.
6. **Exclude list.** User excludes come first (`exclude` option: "no drums" from the idea, or a chip dragged out), marked `reason: "user"`. They always stay, win over the same style in the tags, and are never suggested. After them come engine-found styles (`reason: "clash"`) that clash with the kept selection but don't also fit it well. Concrete sound sources rank above moods. The total is capped at 6 unless the user asked for more.
7. **Placement and budget.** Section tags like Intro, Drop and Bridge go to the lyrics, per the catalog's placement note. The style text aims for about 450 characters and never exceeds Suno's 1,000-character limit.

All the tunable values live in `config.ts`.
