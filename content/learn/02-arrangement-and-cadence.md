---
slug: arrangement-and-cadence
number: 2
title: Arrangement, pacing and cadence
subtitle: Directing the band, fitting words to the beat, and handling more than one singer.
minutes: 6
level: Intermediate
---

Once the style is right, most problems come from the lyrics box: lines that don't fit the tempo, songs that sit at one energy level for three minutes, and duets that collapse into one voice. This module covers the habits that fix them.

## Fit your lines to the tempo

When Suno sings a line, it has to fit the words into the music. A line break usually marks the end of a musical phrase, so a long line gets squeezed and a very short one gets stretched. That's why a ballad can suddenly sound like a fast rap, or one word gets dragged across several bars.

Two habits fix most of it:

1. **Keep lines a sensible length for the tempo.** The table below is a starting point, not a rule.
2. **Keep matching lines a similar length.** If line 1 has 8 syllables and line 2 has 16, the melody has to lurch to fit both. Aim for matching lines within a syllable or two of each other.

| Tempo and feel | Syllables per line, roughly | Why |
| :--- | :--- | :--- |
| Slow ballad or ambient (60–85 BPM) | 5–8 | Leaves room for held notes and breaths. |
| Mid-tempo pop, rock or country (90–120 BPM) | 8–11 | A natural, conversational pocket. |
| Up-tempo electronic or punk (125–150 BPM) | 7–10 | Short, punchy phrases ride a fast beat. |
| Rap | 10–16 | Dense lines are the point. |

Type a line below to count it. The count is an estimate (English spelling makes exact counts impossible without a dictionary), but it's close enough to spot a line that's twice as long as its neighbour.

```widget:syllables
I walked alone down gravel roads
And thought of all the things we lost
Thinking about every single mistake that we ever made back in July
```

> **Tap it out.** Read the verse aloud while tapping four beats per line. If you have to rush to fit the words between taps, Suno will rush too.

## Shape the energy across the song

Left alone, a generated song can lock into one energy level and stay there. Real records breathe: the verse pulls back so the chorus hits harder. You can direct that with modifiers after a colon inside a section tag.

- **Strip the second verse.** `[Verse 2: Bass and Drums Only]` straight after a big chorus makes the next chorus feel bigger.
- **Build into the chorus.** `[Pre-Chorus: Building, Snare Roll]` asks for a lift.
- **Leave a gap.** `[Break]` or `[Stop]` right before the chorus can let the hook land on its own. This one is hit-and-miss, so generate a couple of versions.
- **Feature an instrument.** `[Guitar Solo: Melodic, Overdriven]`. Leave a blank line or two under a solo tag before the next lyrics. If you put words straight underneath, the singer will often sing over the solo.

```lyrics
[Verse 1]
...
[Chorus]
...
[Verse 2: Bass and Drums Only]
...
[Pre-Chorus: Building, Snare Roll]
...
[Chorus: Full Band, Layered Harmonies]
...
[Guitar Solo: Melodic, Overdriven]

[Bridge: Stripped, Piano and Voice]
...
[Final Chorus]
...
[Outro]
[End]
```

## Change how the singer delivers each section

If you describe the voice only once in the style box, you'll often get the same tone for the whole song. Add delivery cues to section tags to change it as the song goes.

| What you want | Try this in the lyrics box | Good for |
| :--- | :--- | :--- |
| Close and intimate | `[Verse: Whispered, Close-Mic]` | Opening verses, quiet bridges |
| Big and belted | `[Chorus: Belting, Powerful]` | Final choruses, rock and pop peaks |
| Spoken | `[Intro: Spoken Word]` | Story intros, skits, breakdowns |
| Group vocal | `[Chorus: Gang Vocals, Layered Harmonies]` | Anthem hooks |
| Raw and strained | `[Bridge: Raw, Raspy]` | Ballads, grunge, blues |

These are common techniques, not guarantees. Keep the cues short, and keep them consistent with the voice you described in the style box.

## Duets and call-and-response

The classic duet problem: you ask for a male and female duet and get one singer for the whole song, or voices that swap mid-line. Creators usually fix it in three steps.

**1. Describe both voices in the style box, with contrast.** `male and female duet` alone can blur into one voice. Contrast helps: `deep baritone male vocals and airy soprano female vocals`.

```style
country duet, deep baritone male vocals and airy soprano female vocals, acoustic guitar, pedal steel, warm live room
```

**2. Say who sings each section.**

**3. Use parentheses for the answering voice.** Text in parentheses is usually sung as a backing or echo part.

```lyrics
[Verse 1: Male Vocal]
I left the porch light burning through the fog
Waiting on the sound of tires in the drive

[Verse 2: Female Vocal]
I saw the county line fade in the glass
Never knew that leaving kept me more alive

[Chorus: Duet, Male and Female Harmonies]
Two hundred miles of static on the line (static on the line)
You keep your ghosts and I'll keep mine (I'll keep mine)
```

## Fix it after it's generated

v6 added two editing tools that change how you work. You don't have to get everything right in one generation anymore.

1. **Edit a single lyric.** If one word is wrong or mispronounced, change just that line without rebuilding the song.
2. **Edit a section in plain language.** Select a section, like the bridge, and describe the change: "strip out the drums and make it just piano and a whispered vocal."

This means a good workflow is often: get the style and structure right first, then fix the details with edits instead of regenerating the whole song.
