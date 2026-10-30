import { describe, expect, it } from "vitest";
import { learnModule, learnModules, parseFrontMatter, slugify } from "./content";
import { convertLyrics, countSyllables, lineFit, syllablesInWord } from "./lyrics";

describe("countSyllables", () => {
  it("counts common words closely", () => {
    expect(syllablesInWord("walked")).toBe(1);
    expect(syllablesInWord("wanted")).toBe(2);
    expect(syllablesInWord("table")).toBe(2);
    expect(syllablesInWord("made")).toBe(1);
    expect([2, 3]).toContain(syllablesInWord("every"));
  });

  it("matches the module's example lines within one", () => {
    expect(Math.abs(countSyllables("I walked alone down gravel roads") - 8)).toBeLessThanOrEqual(1);
    expect(Math.abs(countSyllables("And thought of all the things we lost") - 8)).toBeLessThanOrEqual(1);
  });

  it("ignores section tags and backing parts", () => {
    expect(countSyllables("[Chorus]")).toBe(0);
    expect(countSyllables("Stay with me (stay with me)")).toBe(3);
  });

  it("flags long lines", () => {
    expect(lineFit(countSyllables("Thinking about every single mistake that we ever made back in July"))).not.toBe("comfortable");
  });
});

describe("convertLyrics", () => {
  it("relaxes -ing and 'going to' but leaves short stems alone", () => {
    expect(convertLyrics("I'm going to keep on running", "relaxed")).toBe("I'm gonna keep on runnin'");
    expect(convertLyrics("pull the string, sing a thing", "relaxed")).toBe("pull the string, sing a thing");
    expect(convertLyrics("Going to the evening", "relaxed")).toBe("Gonna the evenin'");
  });

  it("never touches section tags or blank lines", () => {
    const src = "[Verse 1]\n\nWe were falling";
    expect(convertLyrics(src, "relaxed")).toBe("[Verse 1]\n\nWe were fallin'");
    expect(convertLyrics("[Chorus]", "run")).toBe("[Chorus]");
  });

  it("adds a run to the last word, keeping punctuation", () => {
    expect(convertLyrics("Stay with me tonight!", "run")).toBe("Stay with me toni-i-ight!");
    expect(convertLyrics("Just the city fire", "run")).toBe("Just the city fi-i-ire");
    expect(convertLyrics("Please stay", "run")).toBe("Please sta-a-ay");
    expect(convertLyrics("Till the morning", "run")).toBe("Till the mo-o-orning");
  });

  it("adds an echo once, and only to longer lines", () => {
    expect(convertLyrics("We were falling through the light.", "echo")).toBe("We were falling through the light. (through the light)");
    expect(convertLyrics("Stay here", "echo")).toBe("Stay here");
    expect(convertLyrics("We never learned (never learned)", "echo")).toBe("We never learned (never learned)");
  });
});

describe("learn content", () => {
  const modules = learnModules();

  it("has five modules in order with unique slugs", () => {
    expect(modules.map((m) => m.number)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(modules.map((m) => m.slug)).size).toBe(5);
    expect(learnModule("the-black-book")?.title).toBe("The Black Book");
  });

  it("publishes no invented reliability numbers", () => {
    for (const m of modules) {
      const text = JSON.stringify(m.tokens);
      expect(text, m.slug).not.toMatch(/\d+%\s*(verified|reliab)/i);
      expect(text, m.slug).not.toMatch(/verified/i);
    }
  });

  it("only uses widgets the renderer knows", () => {
    const known = new Set(["style", "lyrics", "widget:syllables", "widget:phonetic", "widget:library"]);
    for (const m of modules) {
      for (const t of m.tokens) if (t.type === "code") expect(known.has((t as { lang?: string }).lang ?? ""), `${m.slug}: ${(t as { lang?: string }).lang}`).toBe(true);
    }
  });

  it("parses front matter and makes stable anchors", () => {
    expect(parseFrontMatter("---\na: 1\nb: two words\n---\nbody").meta).toEqual({ a: "1", b: "two words" });
    expect(slugify("The style box and the `lyrics` box")).toBe("the-style-box-and-the-lyrics-box");
  });
});
