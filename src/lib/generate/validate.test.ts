import { describe, expect, it } from "vitest";
import { ideaWithSettings, validateGenerateRequest } from "./validate";

describe("validateGenerateRequest", () => {
  it("accepts an idea with tags and excludes, trimming and de-duplicating", () => {
    const r = validateGenerateRequest({ idea: "  rainy night drive ", tags: ["Synthwave", "Synthwave", " Dreamy "], exclude: ["autotune"] });
    expect(r).toEqual({ ok: true, value: { idea: "rainy night drive", tags: ["Synthwave", "Dreamy"], exclude: ["autotune"] } });
  });

  it("accepts tags alone", () => {
    expect(validateGenerateRequest({ idea: "", tags: ["Jazz"] }).ok).toBe(true);
  });

  it("refuses an empty request", () => {
    expect(validateGenerateRequest({ idea: " ", tags: [] }).ok).toBe(false);
  });

  it("refuses wrong shapes", () => {
    expect(validateGenerateRequest(null).ok).toBe(false);
    expect(validateGenerateRequest({ idea: "x", tags: "Jazz" }).ok).toBe(false);
    expect(validateGenerateRequest({ idea: "x", tags: [1] }).ok).toBe(false);
  });

  it("refuses an over-long idea", () => {
    expect(validateGenerateRequest({ idea: "a".repeat(501) }).ok).toBe(false);
  });

  it("caps the number of tags and excludes", () => {
    const tags = Array.from({ length: 30 }, (_, i) => `t${i}`);
    const r = validateGenerateRequest({ idea: "x", tags, exclude: tags });
    expect(r.ok && r.value.tags.length).toBe(16);
    expect(r.ok && r.value.exclude.length).toBe(8);
  });

  it("checks tempo and key", () => {
    expect(validateGenerateRequest({ idea: "x", bpm: 120, key: "A minor" }).ok).toBe(true);
    expect(validateGenerateRequest({ idea: "x", bpm: 999 }).ok).toBe(false);
    expect(validateGenerateRequest({ idea: "x", bpm: 120.5 }).ok).toBe(false);
    expect(validateGenerateRequest({ idea: "x", key: "H minor" }).ok).toBe(false);
    expect(validateGenerateRequest({ idea: "x", key: "B♭ major" }).ok).toBe(true);
  });
});

describe("ideaWithSettings", () => {
  it("adds tempo and key to the idea", () => {
    expect(ideaWithSettings({ idea: "night drive", tags: [], exclude: [], bpm: 96, key: "A minor" })).toBe("night drive, 96 bpm, in A minor");
  });

  it("doesn't add a tempo the idea already has", () => {
    expect(ideaWithSettings({ idea: "night drive at 120 bpm", tags: [], exclude: [], bpm: 96 })).toBe("night drive at 120 bpm");
  });

  it("works with no idea text", () => {
    expect(ideaWithSettings({ idea: "", tags: ["Jazz"], exclude: [], bpm: 80 })).toBe("80 bpm");
  });

  it("leaves the idea alone without settings", () => {
    expect(ideaWithSettings({ idea: "night drive", tags: [], exclude: [] })).toBe("night drive");
  });
});
