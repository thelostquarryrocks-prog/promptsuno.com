---
slug: sound-and-production
number: 3
title: Sound, production and the studio tools
subtitle: Getting rid of the "AI sheen", keeping out what you don't want, odd time signatures, and v6's production tools.
minutes: 7
level: Advanced
---

This module is about the sound itself: making a track feel recorded rather than generated, steering what's in the mix, and using v6's tools to build a song in stages.

## Keep the style text focused

A long style text isn't a better one. Every extra descriptor competes with the others, so a must-have instrument at the end of a 25-item list can disappear. A few habits help:

- **Put essentials near the front.** If the hook depends on pedal steel, don't leave it at the end.
- **Cut duplicates and near-duplicates.** `dreamy, ethereal, airy, floaty` mostly says one thing four times.
- **Order changes the result.** Creators report that `1970s funk, acoustic folk` and `acoustic folk, 1970s funk` lean in noticeably different directions. Try both.

Suno's style box allows up to 1,000 characters, but most strong prompts use far less.

## Say what you want, and use the Exclude field for what you don't

Writing `no drums` or `without synths` in the style text often backfires: the word "drums" is right there in your prompt. Two better tools:

1. **Describe the sparse version you want.** `solo acoustic piano and voice only` says the same thing without naming drums.
2. **Use Suno's Exclude Styles field.** It exists for exactly this. Put the things you want kept out there, not in the style text.

```style
solo acoustic piano and voice, intimate, slow, felt piano, close vocal, quiet room
```

> PromptSuno fills in the exclude field for you. If two of your picks pull against each other, it suggests what to leave out.

## Describe the recording, not the quality

You can't fix a harsh, over-compressed sound by asking for "good mixing". What tends to work is describing *how* a record was made: the era, the equipment, the room, the playing. Those words carry real sonic information.

| What you want | Vague (usually ignored) | Specific (try this) |
| :--- | :--- | :--- |
| Warmth | `warm mix, high quality` | `warm analog tape, vintage console` |
| Human feel | `real drums, natural` | `live drum kit, room mics, loose groove` |
| Intimate vocal | `emotional singing, clear voice` | `close-mic vocal, dry room, audible breath` |
| Vintage | `old sounding, retro` | `1950s mono recording, tube mic, tape hiss` |

```style
1970s soul, live drum kit, room mics, loose groove, Hammond organ, warm analog tape, vintage console, close-mic vocal, dry room
```

## Odd time signatures

Most generated music falls back to 4/4. Writing `5/4` in the style box alone is unreliable, because the vocal tends to pull the song back into fours. What helps is stacking three things:

1. **Name a genre where that meter is normal.** Waltz and 6/8 blues for threes, cool jazz or math rock for 5/4, progressive metal or Balkan music for 7/8.
2. **Start with an instrumental intro.** `[Instrumental Intro]` lets the groove settle before the vocal comes in.
3. **Write lines that fit the count.** For a waltz, phrases that sway in threes.

| Meter | Style box idea | How it usually goes |
| :--- | :--- | :--- |
| 3/4 or 6/8 | `6/8 slow blues waltz, swaying triplet groove` | The easiest; waltz feels are common in training music. |
| 5/4 | `5/4 cool jazz, asymmetric groove` | Possible, but expect to generate several versions. |
| 7/8 | `7/8 progressive metal, odd-meter riffs` | Experimental. Treat a good result as a lucky one. |

## v6's production tools

v6 goes beyond typing a prompt and getting a song. These are the tools Suno announced with v6, and how they fit together.

1. **Start from more than text.** v6 accepts text, audio, images and video, alone or mixed. A hummed melody or a voice memo can be your starting point.
2. **Explore with v6-wild, refine with v6.** v6-wild is built to be less predictable. Use it to find an interesting idea, then use v6 to make a polished version.
3. **Sample and build.** v6 can take a moment from a song, isolate an instrument, and build a new beat around it in one step.
4. **Mashups.** Combine elements from several of your own songs in one request.
5. **Stems.** Suno's stem separation exports parts for your DAW. Auto Split gives up to 12 stems on Pro. Advanced Split, which lets you pick from nearly 100 instrument types, is Premier only.

> **Suno also launched Speech (beta) on October 1.** It generates spoken voice and background music together from text you type. It's useful for intros, skits and voiceovers.
