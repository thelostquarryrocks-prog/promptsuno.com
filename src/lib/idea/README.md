# Idea → tags

The first step of the generator. It turns a free-text song idea into style chips, excludes, and a few extras, using plain code with no model cost. Server-only, because it reads the catalog.

```ts
import { parseIdea, ideaToBrief } from "@/lib/idea";

parseIdea("moody 80s synthwave about driving at night, female vocals, no guitar");
// tags:    Dark, 1980s, Synthwave, Nocturnal, Female Vocals
// exclude: Electric Guitar, Acoustic Guitar
// theme:   "driving at night"

const { parsed, brief } = ideaToBrief(idea, { library: "launch" }); // parse + engine
```

To try it from the terminal: `npm run idea -- "sad piano ballad about my grandmother, cinematic strings, 70 bpm"`. Add `--full` for the whole library.

## What `parseIdea` does

1. **Tokenizes** the idea, keeping character offsets so the UI can highlight what was understood. Hyphens split (`hip-hop` = `hip hop`), `&` reads as `and`.
2. **Matches** against every style name, catalog alias and everyday-word alias (`data/catalog/v2/user-aliases.json`). The longest phrase wins: "lofi hip hop" is Lo-Fi Hip-Hop, not Lo-Fi. Fallbacks, in order: collapsed spellings (`lofi`, `hiphop`), plurals (`female vocal`), and comparatives for adjective-like styles only (`darker` → Dark).
3. **Sets the subject aside.** Text after "about", "called", "titled" or "named", up to the next comma or "with", is the `theme`. Inside it only mood, energy and era words count, so "about crossing a bridge" doesn't add a Bridge section, but "about driving at night" still adds Nocturnal.
4. **Negation.** "no", "without", "not", "avoid"… cover the words up to the next comma or "but / and / with". "or" continues the list ("no autotune or drums"). Negated styles go to `exclude`, and a generic word excludes all its candidates ("no drums" → Drum Kit and Programmed Drums). Aliases that contain the negator win first: "no vocals" is Instrumental. A positive mention anywhere beats a negated one. A negation inside the theme ("about not being sad") is story, so it's dropped.
5. **Ambiguous words** ("guitar", "bass", "chill") get one chip plus swap options in `alternatives`. The pick is the candidate that fits the rest of the idea best. Sound sources (instrument, vocal, production, rhythm) are judged against genres only, so a mood can't choose the guitar. With no evidence, the curated alias order decides.
6. **Artist references.** A run of capitalized words after "like", "in the style of", "inspired by"… that isn't all style names is an artist: it goes to `references`, and style words inside it are dropped ("Daft Punk" doesn't add Punk Rock). Suno rejects artist names, so the writer must translate these into styles and never pass the name on.
7. **BPM** ("124 bpm", 40–240) is read into `bpm`.
8. **`needsModel`** is true when nothing matched, an artist was referenced, or two or more content words outside the theme went unrecognized. That's the signal for the small-model fallback, which isn't built yet.

## Known limits

- Ambiguity picks are only as good as the catalog's genre × instrument coverage, which is thin. When a pair is unknown, the alias order decides; testing fixes this over time.
- Some common words have no style at all yet, e.g. "ballad" and plain "vocals". They show up in `unmatched`.
- Negation scope is a heuristic. "no drums and bass" negates only drums. Chips are editable, so the person can fix the rare miss.
- New everyday words go in `USER_ALIASES` in `scripts/catalog/curated.py`, then `npm run catalog:build`. Never hand-edit the generated JSON.
