import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/engine";
import { ideaToBrief, parseIdea, tokenize } from "./index";

describe("idea: tokenizer", () => {
  it("splits hyphens, keeps offsets, and treats & as 'and'", () => {
    const text = "Lo-Fi R&B, drum & bass";
    const t = tokenize(text);
    expect(t.map((x) => x.norm)).toEqual(["lo", "fi", "r&b", ",", "drum", "and", "bass"]);
    for (const x of t) expect(text.slice(x.start, x.end)).toBe(x.raw);
  });
});

describe("idea: matching", () => {
  it("prefers the longest phrase", () => {
    const p = parseIdea("chill lofi hip hop");
    expect(p.tags).toContain("Lo-Fi Hip-Hop");
    expect(p.tags).not.toContain("Lo-Fi");
  });

  it("accepts hyphenated, spaced and collapsed spellings", () => {
    for (const idea of ["hip-hop", "hip hop", "hiphop", "Hip-Hop"]) {
      expect(parseIdea(idea).tags, idea).toEqual(["Hip-Hop"]);
    }
  });

  it("matches plurals and comparatives, but only safe comparatives", () => {
    expect(parseIdea("female vocal").tags).toEqual(["Female Vocals"]);
    expect(parseIdea("something darker").tags).toEqual(["Dark"]);
    expect(parseIdea("dreamier").tags).toEqual(["Dreamy"]);
    expect(parseIdea("never forever").tags).toEqual([]);
  });

  it("gives offsets that point at the matched words", () => {
    const idea = "Moody 80s synthwave, female vocals";
    for (const m of parseIdea(idea).matches) expect(idea.slice(m.start, m.end)).toBe(m.text);
  });

  it("dedupes repeated styles and keeps mention order", () => {
    expect(parseIdea("piano, sad, more piano").tags).toEqual(["Piano", "Sad"]);
  });
});

describe("idea: negation", () => {
  it("sends 'no X' to excludes, every candidate of a generic word", () => {
    const p = parseIdea("synthwave, no drums");
    expect(p.tags).toEqual(["Synthwave"]);
    expect(p.exclude).toEqual(expect.arrayContaining(["Drum Kit", "Programmed Drums"]));
  });

  it("covers a list joined by 'or' and stops at 'but' and 'and'", () => {
    const p = parseIdea("shoegaze without autotune or piano but with strings and no saxophone");
    expect(p.exclude).toEqual(expect.arrayContaining(["Hard-Tuned Vocals", "Piano", "Saxophone"]));
    expect(p.tags).toEqual(expect.arrayContaining(["Shoegaze", "Strings"]));
    expect(p.exclude).not.toContain("Strings");
  });

  it("lets an alias that includes the negator win ('no vocals' = Instrumental)", () => {
    const p = parseIdea("lofi beat, no vocals");
    expect(p.tags).toContain("Instrumental");
    expect(p.exclude).toEqual([]);
  });

  it("lets a positive mention win over a negated one", () => {
    const p = parseIdea("no piano in the intro, piano later");
    expect(p.tags).toContain("Piano");
    expect(p.exclude).not.toContain("Piano");
  });
});

describe("idea: theme (what the song is about)", () => {
  it("sets the subject aside and doesn't read it as sound", () => {
    const p = parseIdea("a song about crossing a bridge with my piano teacher, acoustic folk");
    expect(p.theme).toBe("crossing a bridge");
    expect(p.tags).not.toContain("Bridge");
    expect(p.tags).toEqual(expect.arrayContaining(["Piano", "Acoustic Folk"]));
  });

  it("still reads mood words in the subject, as moods only", () => {
    const p = parseIdea("synthwave about driving at night in the rain");
    expect(p.tags).toEqual(expect.arrayContaining(["Nocturnal", "Rainy"]));
    expect(p.tags).not.toContain("Atmospheric");
    expect(p.tags).not.toContain("Driving Rhythm");
  });

  it("treats a negation inside the subject as story, not an instruction", () => {
    const p = parseIdea("a song about not being sad anymore, pop punk");
    expect(p.tags).toEqual(["Pop Punk"]);
    expect(p.exclude).toEqual([]);
  });

  it("doesn't count subject words as unrecognized", () => {
    const p = parseIdea("folk about my grandmother's garden");
    expect(p.unmatched).toEqual([]);
  });
});

describe("idea: references, tempo and the model fallback", () => {
  it("catches artist names and drops style words inside them", () => {
    const p = parseIdea("something like Daft Punk but darker");
    expect(p.references).toEqual(["Daft Punk"]);
    expect(p.tags).toEqual(["Dark"]);
    expect(p.needsModel).toBe(true);
  });

  it("handles 'in the style of the X'", () => {
    expect(parseIdea("in the style of the Beatles, jangly guitars").references).toEqual(["Beatles"]);
  });

  it("doesn't treat capitalized style names after 'like' as an artist", () => {
    const p = parseIdea("I'd like Piano and Strings");
    expect(p.references).toEqual([]);
    expect(p.tags).toEqual(["Piano", "Strings"]);
  });

  it("reads a plausible BPM", () => {
    expect(parseIdea("house at 124 bpm").bpm).toBe(124);
    expect(parseIdea("house at 124bpm").bpm).toBe(124);
    expect(parseIdea("999 bpm").bpm).toBeNull();
  });

  it("asks for the model when nothing or too little was understood", () => {
    expect(parseIdea("write me something").needsModel).toBe(true);
    expect(parseIdea("Taylor Swift vibes but sadder").needsModel).toBe(true);
    expect(parseIdea("sad piano, cinematic strings").needsModel).toBe(false);
  });
});

describe("idea: ambiguous words", () => {
  it("lets the genre pick the instrument, not the mood", () => {
    const p = parseIdea("dreamy shoegaze with guitars");
    expect(p.tags).toContain("Electric Guitar");
    expect(p.alternatives).toEqual([{ pick: "Electric Guitar", options: ["Acoustic Guitar"] }]);
  });
});

describe("idea -> brief", () => {
  it("passes the idea's excludes to the engine, first and marked as the user's", () => {
    const { parsed, brief } = ideaToBrief("dark synthwave, female vocals, no guitar");
    expect(brief.styles.map((s) => s.name)).toEqual(parsed.tags);
    const user = brief.exclude.filter((e) => e.reason === "user").map((e) => e.name);
    expect(user).toEqual(parsed.exclude);
    expect(brief.exclude.slice(0, user.length).every((e) => e.reason === "user")).toBe(true);
    for (const s of brief.suggestions) expect(parsed.exclude).not.toContain(s.name);
  });
});

describe("engine: user excludes", () => {
  it("lets an explicit exclude win over the same style in the tags", () => {
    const b = analyze(["Synthwave", "Electric Guitar"], { exclude: ["Electric Guitar"] });
    expect(b.styles.map((s) => s.name)).toEqual(["Synthwave"]);
    expect(b.exclude[0]).toMatchObject({ name: "Electric Guitar", reason: "user", clashesWith: [] });
  });

  it("keeps every user exclude even past the cap, and never suggests one", () => {
    const exclude = ["Piano", "Strings", "Saxophone"];
    const b = analyze(["Synthwave"], { exclude, maxExcludes: 2 });
    expect(b.exclude.map((e) => e.name)).toEqual(exclude);
    for (const s of b.suggestions) expect(exclude).not.toContain(s.name);
  });

  it("reports exclude terms it can't resolve", () => {
    expect(analyze(["Synthwave"], { exclude: ["zzzz"] }).unresolved).toContain("zzzz");
  });
});
