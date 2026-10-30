---
slug: how-suno-reads-a-prompt
number: 1
title: How Suno reads your prompt
subtitle: Two boxes, two jobs, and why your first prompts sound generic.
minutes: 5
level: Foundations
---

Most first songs sound generic for the same reason: everything goes into one description and Suno is left to guess the rest. Custom Mode fixes that by splitting your instructions into two boxes that do very different jobs.

## The style box and the lyrics box

**The style box is the band and the studio.** It describes what the whole song sounds like: genre, era, instruments, voice, and how it's mixed. It applies to the entire track at once, so it has no sense of time.

**The lyrics box is the timeline.** Suno reads it top to bottom. Section tags in square brackets, like `[Verse]` and `[Chorus]`, tell it what happens and when. Anything in brackets is an instruction; anything outside them gets sung.

| Put it in the style box | Put it in the lyrics box |
| :--- | :--- |
| Genre and era | Song structure: `[Intro]`, `[Verse]`, `[Chorus]` |
| Lead instruments | When an instrument features: `[Guitar Solo]` |
| Voice type and delivery | Changes in delivery per section |
| Mix and room sound | The words |

Two common mistakes come from mixing these up:

- **Telling the style box about time.** "Starts with soft piano and turns into metal at 1:30" doesn't work, because the style box can't count. You'll usually get piano and metal blended from the first second. Put the change in the lyrics box instead.
- **Telling the lyrics box about the whole song.** A line like `[Make the whole song sound like 1970s tape]` belongs in the style box, where it applies everywhere.

> **Name it in both places.** If you want a saxophone solo halfway through, add `saxophone` to the style box *and* `[Saxophone Solo]` in the lyrics. The style box puts the player in the room; the tag tells them when to play. Creators widely report solos are far more reliable this way.

## Build the style box in four layers

Beginners tend to either under-prompt ("pop song") or pile on twenty buzzwords. A steadier approach is to build the style text in four layers, most important first:

1. **Genre and era**: the foundation. `1984 synth-pop`, `1970s outlaw country`.
2. **Instruments**: the palette. `pulsing analog bass, gated reverb snare, chorus guitar`.
3. **Voice**: who's singing and how. `breathy female alto, detached delivery`.
4. **Mix and room**: the polish. `warm analog tape, intimate room, dry mix`.

```style
1974 outlaw country, Americana, fingerpicked acoustic guitar, upright bass, brushed snare, gritty baritone male vocals, weathered intimate delivery, warm analog tape, small room
```

**Why order matters.** Creators consistently find that what comes first in the style text shapes the song most. Lead with the genre and era, and keep anything essential near the front. Suno hasn't published how it weighs the text, so treat this as a strong habit, not a law.

**Skip the quality words.** `masterpiece`, `high quality`, `8k`, `best mix` describe nothing about the sound. They take up space that real instructions could use. If you want a cleaner or warmer sound, describe the sound: `polished modern pop mix`, `warm analog tape`.

> **This is what PromptSuno's builder does for you.** Describe the song in plain words, and the builder sorts it into these layers and checks each style against how Suno styles combine.

## The v6 models

Suno v6 launched on September 9, 2026 as three models, and Suno is retiring its older models as v6 rolls out.

| Model | Who gets it | What it's for |
| :--- | :--- | :--- |
| **v6** | Pro and Premier | The flagship. Suno describes it as reliable, precise and polished. |
| **v6-wild** | Pro and Premier | Less predictable and more varied. Use it when you want surprises. |
| **v6-mini** | Everyone, including free | A faster, more efficient version. |

v6 also understands more natural, musician-style language than earlier models. You can describe a feeling ("midnight on a rooftop") and it will try to get there. Our advice is to combine both: use specific terms for the things that must be right (genre, instruments, voice), then one plain-language phrase for the feel.

```style
1970s jazz-funk, Fender Rhodes, slap bass, tight dry drums, smoky female contralto, recorded live in a small club with the bass sitting behind the beat
```

## The five section tags that matter most

There are dozens of section tags, but most songs are built from five. These are standard structure tags Suno recognizes; how strictly each one is followed varies by song and genre.

| Tag | What it usually does |
| :--- | :--- |
| `[Intro]` or `[Instrumental Intro]` | Gives the song a few bars before the vocal comes in. |
| `[Verse]` | Lower energy, more room for the story. |
| `[Pre-Chorus]` | Builds tension that sets up the hook. |
| `[Chorus]` | The peak: fuller, wider, the hook. |
| `[Bridge]` and `[Outro]` | A change of scenery late in the song, and a proper ending. |

## Three common beginner problems

**The singer reads your tag out loud.** This usually happens when a bracket holds a full sentence, like `[the drums drop out and a sad violin plays softly]`. Keep brackets short and use a colon for detail: `[Break: Solo Violin]`.

**The verse sounds rushed.** Long lines get crammed into the same musical space as short ones. If a line has more than about 12 syllables at a normal tempo, split it into two. Module 2 covers this in detail.

**The song stops mid-word.** Give Suno an ending to aim for. Finish the lyrics with an outro and an end tag:

```lyrics
[Outro]
[Fade Out]
[End]
```

## Your first full prompt

Here's everything from this module in one prompt. Notice how short the style text is, and how cleanly the lyrics separate instructions from words.

```style
1984 dark synth-pop, new wave, pulsing analog synth bass, gated reverb snare, shimmering chorus guitar, melancholic female alto, breathy and detached, warm analog tape
```

```lyrics
[Instrumental Intro]

[Verse 1]
Neon flickers on the wet pavement
Static humming through the dashboard wire
Every mile is a quiet statement
Pullin' further from the city fire

[Pre-Chorus]
And the mirror only shows the rain
Washing out the streetlamp glow

[Chorus]
We are ghosts on the midnight frequency
Fading out before the signal dies
Nothing left of what we used to be
Just the headlights and the painted lines

[Outro]
(Midnight frequency)
[Fade Out]
[End]
```
