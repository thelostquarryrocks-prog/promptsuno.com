"""Curated relationships (source = "claude-curated").

The ChatGPT matrix covers only ~7% of pairs among the launch styles, and its
biggest blind spot is mood x genre / mood x instrument, which is exactly what
the engine leans on hardest ("piano + melancholic" vs "piano + driving rhythm").

These are judgment calls, not Suno-tested facts. They fill gaps only: an
existing source edge is never overwritten, and disagreements are written to
the conflict report for James to settle. Testing promotes them to "tested".

MOOD_PROFILES: for each launch mood
  fit     -> affinity 0.75 (this mood is natural in that genre / on that instrument)
  tension -> 0.35 (workable, but the prompt must reconcile them)
  clash   -> 0.10 (works against the mood; the engine should warn or exclude)
"""

MOOD_PROFILES = {
    "Melancholic": dict(
        fit="Cinematic|Indie Folk|Folk|Dream Pop|Trip-Hop|Ambient|Classical|Americana|Country|Emo|Grunge|Neo-Soul|Blues|Indie Rock|Lo-Fi Hip-Hop|Synthwave|Piano|Felt Piano|Cello|Violin|Strings|Acoustic Guitar|Fingerpicked Guitar|Pedal Steel|Harp|Electric Piano|Synth Pads",
        tension="EDM|House|Trance|Reggaeton|K-Pop|Pop Punk|Disco|Afrobeats|Fast Tempo",
        clash="Happy|Playful|Euphoric",
    ),
    "Sad": dict(
        fit="Indie Folk|Folk|Country|Americana|Blues|Emo|Ambient|Cinematic|Classical|Lo-Fi Hip-Hop|Neo-Soul|Trap|Piano|Felt Piano|Cello|Violin|Acoustic Guitar|Pedal Steel|Strings",
        tension="EDM|Disco|Funk|Reggaeton|Afrobeats|K-Pop|Punk Rock",
        clash="Happy|Playful|Euphoric|Danceable",
    ),
    "Happy": dict(
        fit="Pop|Indie Pop|K-Pop|Disco|Funk|Reggae|Latin Pop|Afrobeats|Reggaeton|Pop Punk|Country|Gospel|Ska|Synthpop|Ukulele|Banjo|Brass Section|Hand Percussion|Major Key",
        tension="Metal|Grunge|Trip-Hop|Dark|Minor Key|Slow Tempo",
        clash="Haunting|Sad|Melancholic",
    ),
    "Uplifting": dict(
        fit="Pop|Gospel|Trance|EDM|House|Cinematic|Epic Orchestral|Indie Pop|Indie Folk|Country|Soul|Synthpop|Choir|Strings|Piano|Synth Lead|Brass Section|Major Key|Anthemic Chorus|Crescendo|Slow Build",
        tension="Trip-Hop|Grunge|Metal|Phonk|Minor Key",
        clash="Haunting|Dark",
    ),
    "Hopeful": dict(
        fit="Indie Folk|Folk|Pop|Indie Pop|Cinematic|Gospel|Americana|Country|Soul|Ambient|Piano|Acoustic Guitar|Strings|Synth Pads|Major Key|Slow Build|Crescendo",
        tension="Metal|Phonk|Trap|Minor Key",
        clash="Dark|Haunting",
    ),
    "Dark": dict(
        fit="Trap|Phonk|Metal|Trip-Hop|Techno|Dubstep|Drum and Bass|Cinematic|Synthwave|Grunge|Ambient|Hip-Hop|808 Bass|808 Drums|Sub-Bass|Distorted Guitar|Cello|Analog Synth|Synth Bass|Organ|Minor Key|Distortion",
        tension="Pop|Disco|Country|Reggae|Bright|Major Key",
        clash="Happy|Playful|Uplifting|Hopeful",
    ),
    "Aggressive": dict(
        fit="Metal|Punk Rock|Grunge|Dubstep|Phonk|Trap|Drum and Bass|Techno|Hip-Hop|Distorted Guitar|808 Bass|Drum Kit|Distortion|Screamed Vocals|Rap Vocals|Fast Tempo|Driving Rhythm|Gritty|Punchy",
        tension="Pop|Classical|Ambient|Piano|Soft Vocals|Breathy Vocals",
        clash="Peaceful|Relaxed|Intimate|Dreamy|Sensual|Whispered Vocals",
    ),
    "Energetic": dict(
        fit="EDM|House|Techno|Trance|Drum and Bass|Dubstep|Pop Punk|Punk Rock|Rock|Pop|K-Pop|Reggaeton|Afrobeats|Disco|Funk|Metal|Drum Kit|Brass Section|Synth Lead|Fast Tempo|Driving Rhythm|Four-on-the-Floor|Punchy",
        tension="Ambient|Lo-Fi Hip-Hop|Trip-Hop|Slow Tempo",
        clash="Peaceful|Relaxed",
    ),
    "Relaxed": dict(
        fit="Lo-Fi Hip-Hop|Reggae|Neo-Soul|Jazz|Ambient|Deep House|Trip-Hop|Folk|Indie Folk|R&B|Bossa Nova|Electric Piano|Acoustic Guitar|Felt Piano|Saxophone|Synth Pads|Laid-Back Groove|Slow Tempo|Midtempo|Vinyl Crackle|Warm",
        tension="EDM|Drum and Bass|Fast Tempo|Distorted Guitar",
        clash="Metal|Punk Rock|Aggressive|Screamed Vocals|Dubstep",
    ),
    "Romantic": dict(
        fit="R&B|Soul|Neo-Soul|Jazz|Latin Pop|Reggaeton|Pop|Country|Classical|Cinematic|Bossa Nova|Piano|Strings|Violin|Saxophone|Acoustic Guitar|Electric Piano|Duet|Soft Vocals|Breathy Vocals|Slow Tempo",
        tension="Punk Rock|Techno|Phonk|Dubstep",
        clash="Metal|Aggressive|Screamed Vocals",
    ),
    "Nostalgic": dict(
        fit="Synthwave|Synthpop|Lo-Fi Hip-Hop|Indie Folk|Folk|Americana|Country|Classic Rock|Dream Pop|Soul|Disco|1960s|1970s|1980s|1990s|2000s|Analog Synth|Electric Piano|Acoustic Guitar|Tape Saturation|Vinyl Crackle|Vintage Production|Lo-Fi",
        tension="Polished Production|Dubstep|Hyperpop",
        clash="",
    ),
    "Dreamy": dict(
        fit="Dream Pop|Ambient|Synthwave|Trip-Hop|Lo-Fi Hip-Hop|Indie Pop|Neo-Soul|Synth Pads|Harp|Electric Piano|Felt Piano|Breathy Vocals|Soft Vocals|Reverb-Heavy|Airy|Shimmering",
        tension="Punk Rock|Drum and Bass|Dry Mix|Distorted Guitar",
        clash="Metal|Aggressive|Screamed Vocals",
    ),
    "Epic": dict(
        fit="Epic Orchestral|Cinematic|Metal|Trance|EDM|Classical|Orchestral|Strings|Brass Section|Choir|Drum Kit|Anthemic Chorus|Crescendo|Build and Drop|Slow Build|Powerful Vocals|Wide Stereo",
        tension="Lo-Fi Hip-Hop|Bedroom Pop|Folk|Lo-Fi|Dry Mix",
        clash="Intimate|Whispered Vocals",
    ),
    "Dramatic": dict(
        fit="Cinematic|Epic Orchestral|Classical|Metal|Musical Theatre|Gospel|Orchestral|Strings|Piano|Cello|Choir|Brass Section|Powerful Vocals|Dynamic Contrast|Crescendo|Quiet-Loud Contrast|Minor Key",
        tension="Lo-Fi Hip-Hop|Deep House|Reggae",
        clash="Relaxed",
    ),
    "Peaceful": dict(
        fit="Ambient|Classical|Folk|Indie Folk|Lo-Fi Hip-Hop|Jazz|Piano|Felt Piano|Harp|Flute|Acoustic Guitar|Fingerpicked Guitar|Synth Pads|Strings|Soft Vocals|Slow Tempo|Sparse Arrangement",
        tension="Rock|Hip-Hop|Trap|Drum Kit|808 Bass|808 Drums",
        clash="Metal|Punk Rock|Dubstep|Phonk|Aggressive|Distorted Guitar|Screamed Vocals|Fast Tempo|Distortion",
    ),
    "Euphoric": dict(
        fit="Trance|EDM|House|Techno|Drum and Bass|Pop|K-Pop|Gospel|Disco|Synth Lead|Synth Pads|Choir|Four-on-the-Floor|Build and Drop|Sidechain Compression|Anthemic Chorus|Major Key",
        tension="Folk|Blues|Lo-Fi Hip-Hop|Slow Tempo",
        clash="Sad|Haunting",
    ),
    "Bittersweet": dict(
        fit="Indie Pop|Indie Folk|Indie Rock|Dream Pop|Folk|Country|Americana|Synthpop|Synthwave|Emo|Soul|Piano|Acoustic Guitar|Pedal Steel|Strings|Major Key|Minor Key",
        tension="Metal|Phonk|Dubstep",
        clash="",
    ),
    "Haunting": dict(
        fit="Ambient|Cinematic|Trip-Hop|Dream Pop|Classical|Folk|Cello|Violin|Piano|Choir|Synth Pads|Organ|Whispered Vocals|Breathy Vocals|Reverb-Heavy|Minor Key|Sparse Arrangement",
        tension="EDM|Disco|Funk",
        clash="Happy|Playful|Euphoric",
    ),
    "Playful": dict(
        fit="Pop|Indie Pop|K-Pop|Funk|Disco|Ska|Reggae|Afrobeats|Latin Pop|Ukulele|Banjo|Brass Section|Hand Percussion|Synth Lead|Bright|Major Key|Syncopated|Bouncy",
        tension="Metal|Doom Metal|Ambient|Classical",
        clash="Haunting|Dark|Sad|Melancholic",
    ),
    "Intimate": dict(
        fit="Indie Folk|Folk|Neo-Soul|R&B|Jazz|Lo-Fi Hip-Hop|Bedroom Pop|Acoustic Guitar|Fingerpicked Guitar|Felt Piano|Piano|Electric Piano|Soft Vocals|Breathy Vocals|Whispered Vocals|Dry Mix|Sparse Arrangement|Live Room",
        tension="EDM|Trance|Wide Stereo|Reverb-Heavy",
        clash="Epic Orchestral|Metal|Aggressive|Screamed Vocals|Anthemic Chorus",
    ),
    "Sensual": dict(
        fit="R&B|Neo-Soul|Jazz|Latin Pop|Reggaeton|Trip-Hop|Deep House|Saxophone|Electric Piano|Synth Bass|Breathy Vocals|Soft Vocals|Laid-Back Groove|Slow Tempo|Midtempo",
        tension="Punk Rock|Country|Folk",
        clash="Metal|Aggressive|Screamed Vocals",
    ),
    "Anthemic": dict(
        fit="Rock|Pop|Pop Punk|Alternative Rock|Classic Rock|EDM|Trance|Gospel|Country|Metal|K-Pop|Drum Kit|Electric Guitar|Choir|Anthemic Chorus|Powerful Vocals|Crescendo|Build and Drop|Wide Stereo",
        tension="Lo-Fi Hip-Hop|Ambient|Trip-Hop",
        clash="Intimate|Whispered Vocals",
    ),
    "Mysterious": dict(
        fit="Cinematic|Trip-Hop|Ambient|Jazz|Synthwave|Techno|Dream Pop|Cello|Harp|Synth Pads|Analog Synth|Flute|Organ|Minor Key|Sparse Arrangement|Reverb-Heavy",
        tension="Pop Punk|Disco|Country",
        clash="",
    ),
    "Groovy": dict(
        fit="Funk|Disco|Soul|Neo-Soul|R&B|House|Deep House|Hip-Hop|Afrobeats|Reggae|Jazz|Bass Guitar|Synth Bass|Electric Piano|Organ|Drum Kit|Hand Percussion|Brass Section|Syncopated|Laid-Back Groove|Backbeat|Four-on-the-Floor",
        tension="Ambient|Classical|Metal",
        clash="",
    ),
    "Danceable": dict(
        fit="House|Deep House|Techno|EDM|Disco|Funk|Pop|K-Pop|Reggaeton|Latin Pop|Afrobeats|Synthpop|Trance|Drum and Bass|Four-on-the-Floor|Syncopated|Sidechain Compression|Synth Bass|Drum Machine",
        tension="Folk|Classical|Cinematic|Slow Tempo",
        clash="Ambient",
    ),
    "Atmospheric": dict(
        fit="Ambient|Cinematic|Dream Pop|Trip-Hop|Synthwave|Techno|Deep House|Lo-Fi Hip-Hop|Synth Pads|Harp|Felt Piano|Strings|Reverb-Heavy|Wide Stereo|Slow Build",
        tension="Punk Rock|Dry Mix|Pop Punk",
        clash="",
    ),
    "Warm": dict(
        fit="Soul|Neo-Soul|Folk|Indie Folk|Jazz|R&B|Lo-Fi Hip-Hop|Americana|Country|Electric Piano|Organ|Acoustic Guitar|Felt Piano|Upright Bass|Tape Saturation|Vintage Production|Live Room",
        tension="Techno|Dubstep|Distortion",
        clash="",
    ),
}

# Physical / logical opposites. These are impossible or near-impossible to
# satisfy at once, so they become clashes even where the source said nothing.
CLASH_POLES = [
    # (pole A, pole B, weight)
    ("Slow Tempo", "Fast Tempo|Very Fast Tempo", 0.05),
    ("Midtempo", "Very Fast Tempo", 0.15),
    ("Beatless", "Four-on-the-Floor|Driving Rhythm|Backbeat|Half-Time Groove|Drum Kit|Drum Machine|808 Drums", 0.05),
    ("Sparse Arrangement|Minimal", "Dense|Maximalist|Wall of Sound", 0.05),
    ("Dry Mix|Dry Vocals", "Reverb-Heavy|Long Reverb|Cathedral Reverb|Hall Reverb|Shimmer Reverb", 0.08),
    ("Lo-Fi|Cassette Hiss|Vinyl Crackle", "Hi-Fi|Polished Production|Clear Separation", 0.2),
    ("Instrumental", "Male Vocals|Female Vocals|Duet|Rap Vocals|Solo Vocal|Soft Vocals|Powerful Vocals|Breathy Vocals|Falsetto Vocals|Raspy Vocals|Screamed Vocals|Whispered Vocals|Soulful Vocals|Spoken Word", 0.05),
    ("Whispered Vocals|Soft Vocals", "Screamed Vocals|Shouted Vocals|Belted Vocals|Powerful Vocals", 0.1),
    ("Peaceful|Calm|Serene|Gentle", "Aggressive|Frenetic|Explosive|Chaotic|Menacing", 0.08),
    ("Low Energy", "High Energy|Energetic|Explosive", 0.08),
]

# Opposites that songs deliberately combine ("happy-sounding sad song").
# Kept as tension, not clash, so the writer reconciles rather than refuses.
TENSION_POLES = [
    ("Happy|Joyful|Playful|Euphoric", "Sad|Melancholic|Mournful", 0.3),
    ("Major Key", "Sad|Melancholic|Dark", 0.4),
    ("Minor Key", "Happy|Uplifting|Euphoric", 0.4),
    ("Bright", "Dark|Haunting", 0.35),
    ("Lo-Fi Hip-Hop|Bedroom Pop", "Polished Production|Hi-Fi", 0.35),
]

# Near-duplicate names. Not merged automatically; listed for James to decide.
MERGE_CANDIDATES = [
    ("Bass-Heavy", "Bass-Heavy Mix", "same meaning; recommend merge"),
    ("Breakbeat", "Breakbeats", "genre vs drum-break rhythm; recommend keep both"),
    ("Boom Bap", "Boom Bap Beat", "genre vs beat; recommend merge"),
    ("Bossa Nova", "Bossa Groove", "Bossa Groove adds little; recommend merge"),
    ("Baroque", "Baroque Era", "genre vs era; recommend merge"),
    ("Classical", "Classical Era", "Classical Era is too narrow for most users; keep, long-tail"),
    ("Romantic Classical", "Romantic Era", "same meaning; recommend merge"),
    ("Laid-Back", "Laid-Back Groove", "mood vs rhythm; recommend merge into Laid-Back Groove"),
    ("Legato", "Legato Phrasing", "near-identical; recommend merge"),
    ("Delay", "Delay Guitar", "effect vs instrument; keep both"),
    ("Dreamy", "Dreamy Ambient", "mood vs genre-ish; keep both"),
    ("Ethereal", "Ethereal Vocals", "mood vs vocal; keep both"),
    ("Soulful", "Soulful Vocals", "mood vs vocal; keep both"),
    ("Twangy", "Twangy Guitar", "texture vs instrument; keep both"),
    ("Long Reverb", "Reverb-Heavy", "near-identical in a prompt; recommend merge"),
    ("Reverb", "Reverb-Heavy", "plain 'Reverb' is vague; recommend merge"),
    ("Restrained", "Restrained Verse", "mood vs structure; keep both"),
    ("Chorus", "Chorus Effect", "song section vs guitar effect; keep both, rename 'Chorus' to 'Chorus Section'"),
    ("Tremolo Guitar", "Tremolo Picking", "near-identical; recommend merge"),
    ("Orchestral", "Epic Orchestral", "instrumentation vs genre; keep both"),
]

# Words users type that have no style of their own. For the idea -> tags step.
USER_ALIASES = {
    "chill": ["Relaxed", "Laid-Back Groove"],
    "chilled": ["Relaxed", "Laid-Back Groove"],
    "lofi": ["Lo-Fi", "Lo-Fi Hip-Hop"],
    "upbeat": ["Energetic", "Upbeat Energy"],
    "emotional": ["Emotional", "Melancholic"],
    "heartbreak": ["Sad", "Melancholic"],
    "breakup": ["Sad", "Bittersweet"],
    "summer": ["Bright", "Happy"],
    "night": ["Nocturnal", "Atmospheric"],
    "late night": ["Nocturnal", "Atmospheric"],
    "rap": ["Hip-Hop", "Rap Vocals"],
    "acoustic": ["Acoustic Guitar", "Acoustic Production"],
    "orchestra": ["Orchestral"],
    "epic": ["Epic"],
    "movie": ["Cinematic"],
    "film": ["Cinematic"],
    "edm": ["EDM"],
    "rnb": ["R&B"],
    "r and b": ["R&B"],
    "80s": ["1980s"],
    "90s": ["1990s"],
    "70s": ["1970s"],
    "60s": ["1960s"],
    "2000s": ["2000s"],
    "y2k": ["Y2K Pop", "2000s"],
    "girl": ["Female Vocals"],
    "woman": ["Female Vocals"],
    "guy": ["Male Vocals"],
    "man": ["Male Vocals"],
    "no vocals": ["Instrumental"],
    "no singing": ["Instrumental"],
    "angry": ["Aggressive"],
    "hype": ["Energetic", "High Energy"],
    "spooky": ["Haunting", "Eerie"],
    "creepy": ["Eerie", "Unsettling"],
    "sexy": ["Sensual", "Sultry"],
    "love song": ["Romantic"],
    "road trip": ["Driving Rhythm", "Uplifting"],
    "workout": ["Energetic", "Driving Rhythm"],
    "study": ["Lo-Fi Hip-Hop", "Relaxed"],
}
