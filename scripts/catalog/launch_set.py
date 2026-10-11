"""Draft launch shortlist: the styles PromptSuno exposes and tests first.

Chosen for what a hobbyist is likely to type or pick, balanced across
categories. The group names below are only for readability; each style's real
category comes from the catalog. James approves or edits this list; everything else stays in the
catalog as long-tail (available to Pro / the engine, marked untested).
"""

LAUNCH = {
    "genre": [
        "Pop", "Rock", "Hip-Hop", "R&B", "Soul", "Country", "Folk", "Indie Pop", "Indie Rock",
        "Indie Folk", "Alternative Rock", "Electronic", "EDM", "House", "Deep House", "Techno",
        "Trance", "Drum and Bass", "Dubstep", "Synthwave", "Synthpop", "Lo-Fi Hip-Hop", "Trap",
        "Jazz", "Blues", "Funk", "Disco", "Gospel", "Reggae", "Reggaeton", "Latin Pop",
        "Afrobeats", "K-Pop", "Metal", "Punk Rock", "Pop Punk", "Emo", "Grunge", "Classic Rock",
        "Ambient", "Cinematic", "Classical", "Dream Pop", "Trip-Hop", "Neo-Soul", "Americana",
        "Phonk", "Epic Orchestral",
    ],
    "era": ["1960s", "1970s", "1980s", "1990s", "2000s"],
    "instrument": [
        "Piano", "Acoustic Guitar", "Electric Guitar", "Distorted Guitar", "Bass Guitar",
        "Synth Bass", "808 Bass", "Sub-Bass", "Synth Pads", "Synth Lead", "Analog Synth",
        "Strings", "Cello", "Violin", "Orchestral", "Brass Section", "Saxophone", "Organ",
        "Electric Piano", "Drum Kit", "Drum Machine", "808 Drums", "Hand Percussion", "Harp",
        "Flute", "Banjo", "Pedal Steel", "Felt Piano", "Fingerpicked Guitar",
    ],
    "vocal": [
        "Male Vocals", "Female Vocals", "Duet", "Rap Vocals", "Soft Vocals", "Powerful Vocals",
        "Breathy Vocals", "Falsetto Vocals", "Raspy Vocals", "Choir", "Vocal Harmonies",
        "Spoken Word", "Instrumental", "Vocal Chops", "Screamed Vocals", "Whispered Vocals",
        "Soulful Vocals",
    ],
    "mood": [
        "Melancholic", "Sad", "Happy", "Uplifting", "Hopeful", "Dark", "Aggressive", "Energetic",
        "Relaxed", "Romantic", "Nostalgic", "Dreamy", "Epic", "Dramatic", "Peaceful", "Euphoric",
        "Bittersweet", "Haunting", "Playful", "Intimate", "Sensual", "Anthemic", "Mysterious",
        "Groovy", "Danceable", "Atmospheric", "Warm",
    ],
    "rhythm": [
        "Slow Tempo", "Midtempo", "Fast Tempo", "Driving Rhythm", "Four-on-the-Floor",
        "Half-Time Groove", "Laid-Back Groove", "Syncopated", "Swing Rhythm", "Waltz Rhythm",
        "Backbeat",
    ],
    "harmony": ["Major Key", "Minor Key"],
    "production": [
        "Lo-Fi", "Polished Production", "Vintage Production", "Tape Saturation", "Reverb-Heavy",
        "Dry Mix", "Wide Stereo", "Distortion", "Sidechain Compression", "Live Room",
        "Vinyl Crackle",
    ],
    "structure": [
        "Slow Build", "Build and Drop", "Anthemic Chorus", "Sparse Arrangement", "Crescendo",
        "Dynamic Contrast", "Fade Out", "Quiet-Loud Contrast",
    ],
    "texture": ["Bright", "Punchy", "Gritty", "Shimmering", "Airy"],
}

# Added after the catalog arrived: terms the catalog marks "source_observed"
# (seen in Suno community/official sources), so likely what people actually type.
OBSERVED_ADDITIONS = [
    "Pop Rock", "Hard Rock", "Heavy Metal", "Shoegaze", "Bedroom Pop", "Bossa Nova",
    "Amapiano", "Dance Pop", "Electropop", "J-Pop", "Progressive House",
    "Belted Vocals", "Baritone Vocals", "Tenor Vocals", "Gritty Vocals", "Soaring Vocals",
    "Dry Vocals", "Gated Reverb", "Tape Delay", "Hi-Fi", "Catchy", "Emotional", "Ethereal",
    "Hypnotic",
]

LAUNCH_SET = {s for styles in LAUNCH.values() for s in styles} | set(OBSERVED_ADDITIONS)
