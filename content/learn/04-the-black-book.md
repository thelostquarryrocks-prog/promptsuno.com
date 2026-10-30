---
slug: the-black-book
number: 4
title: The Black Book
subtitle: Spelling, punctuation and extend tricks for when the basics aren't enough.
minutes: 7
level: Expert
---

These are the techniques experienced creators reach for when a song is almost right. None of them is officially documented by Suno, and results vary from song to song. Treat each one as something to try, and generate a couple of versions before you judge it.

## Spell it the way you want it sung

Suno sings what it reads, and spelling changes what it reads. That gives you a surprising amount of control over a single word.

| Technique | Example | What it's for |
| :--- | :--- | :--- |
| Hyphenated vowels | `lo-o-ove` | Encourages a short run across notes (R&B, soul, gospel, country). |
| Stretched vowels | `loooove` | Encourages a longer held note. Don't go past a few letters, or it can turn into a stutter. |
| Phonetic respelling | `lehd` for the metal "lead" | Fixes words Suno mispronounces, especially names and words with two pronunciations. |
| Dropped G's and contractions | `runnin'`, `gonna` | A looser, more casual delivery that suits country, blues, folk and hip-hop. |

Phonetic respelling is the most dependable of these, and the best fix for a mispronounced word: spell it how it sounds.

Try the converter below on your own lines. It changes the spelling only; your section tags are left alone.

```widget:phonetic
I'm going to keep on running till the morning
We were falling through the evening light
Stay with me tonight
```

## Punctuation shapes the delivery

Inside the lyrics box, punctuation affects timing and emphasis, not just grammar. These are common creator techniques. They nudge the delivery rather than control it exactly.

| Punctuation | Example | What it tends to do |
| :--- | :--- | :--- |
| Ellipsis `...` | `I reached out... and you were gone` | A pause or breath mid-line. |
| Comma | `Walk slow, don't look back` | A small hesitation that changes the phrasing. |
| Em dash `—` | `Cut the wire— watch it burn` | A sharper break. |
| ALL CAPS | `till the SKY FELL DOWN` | Often more emphasis or volume on those words. |
| (Parentheses) | `We never learned (never learned)` | Usually sung as a backing vocal or echo. |
| Question mark | `Is anybody listening?` | Often a rising end to the line. |

## Changing direction with Extend

Extending a song into something very different, like an acoustic ballad that turns into a drum-and-bass drop, often gives a muddy blend instead of a clean switch. Extend continues from what's already playing, so if a big chord is still ringing where you extend, the new section has to build on top of it.

What helps:

1. **Extend from a quiet moment.** Find a breath, a drum stop or the tail of a section, not the middle of a sung word or a loud chord.
2. **Rewrite the style text for the new section.** Describe what you want *next*, not what came before.
3. **Open the new section with a transition tag.** `[Break]`, `[Drum Fill]` or `[Tape Stop]` gives the switch a natural seam.

```lyrics
[Break]
[Drum Fill: Rapid Snare Build]
[Drop]
```

With v6, you can also use section editing to rewrite one part of a song in plain language. That's often easier than Extend for big changes in the middle of a song.

## Collisions and sound effects

**Genre collisions.** A single, common genre tends to land on familiar territory. Pairing two that rarely meet pushes Suno somewhere less expected, and v6-wild is designed for exactly this.

```style
1920s Delta slide blues field recording, modern glitchy 808 sub-bass, dusty mono room
```

```style
Gregorian chant choir, 128 BPM industrial acid techno, squelching 303 bass line, cavernous reverb
```

Some collisions fail outright. That's the cost of asking for something new, so generate several versions.

**Sound-effect words.** In a percussion break, onomatopoeia in parentheses can nudge the rhythm. It's unpredictable: sometimes it shapes the drums, sometimes it gets sung.

```lyrics
[Break: Percussion Only]
(Boom... bap-bap... boom-bap!)
[Drop]
```
