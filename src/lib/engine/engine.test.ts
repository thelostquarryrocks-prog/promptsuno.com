import { describe, expect, it } from "vitest";
import { getEdge, getStyle } from "@/lib/catalog";
import {
  analyze,
  clampToLimit,
  excludeText,
  fallbackStyleText,
  lyricsSectionTags,
  STYLE_MAX_CHARS,
  toWriterContext,
} from "./index";

const roleOf = (brief: ReturnType<typeof analyze>, name: string) =>
  brief.styles.find((s) => s.name === name)?.role;

describe("engine: reference examples", () => {
  it("piano + cinematic + melancholic is cohesive with nothing to reconcile", () => {
    const b = analyze(["Piano", "Cinematic", "Melancholic"]);
    expect(roleOf(b, "Cinematic")).toBe("anchor");
    expect(b.tensions).toEqual([]);
    expect(b.clashes).toEqual([]);
    expect(b.styles.every((s) => s.role === "anchor" || s.role === "core")).toBe(true);
  });

  it("piano + cinematic + driving rhythm surfaces the tension and how to resolve it", () => {
    const b = analyze(["Piano", "Cinematic", "Driving Rhythm"]);
    const pianoDrive = b.tensions.find(
      (t) => [t.a, t.b].includes("Piano") && [t.a, t.b].includes("Driving Rhythm"),
    );
    expect(pianoDrive).toBeDefined();
    expect(pianoDrive!.hint).toMatch(/ostinato|pulse/i);
  });

  it("the two examples produce different writer briefs", () => {
    const a = toWriterContext(analyze(["Piano", "Cinematic", "Melancholic"]));
    const b = toWriterContext(analyze(["Piano", "Cinematic", "Driving Rhythm"]));
    expect(a).not.toContain("Tensions to reconcile");
    expect(b).toContain("Tensions to reconcile");
  });
});

describe("engine: resolving input", () => {
  it("resolves aliases and reports what it can't place", () => {
    const b = analyze(["80s", "Synthwave", "something unknown", "  "]);
    expect(b.styles.map((s) => s.name)).toEqual(["1980s", "Synthwave"]);
    expect(b.unresolved).toEqual(["something unknown"]);
  });

  it("de-duplicates styles reached through different terms", () => {
    const b = analyze(["Relaxed", "chill"]);
    expect(b.styles.filter((s) => s.name === "Relaxed")).toHaveLength(1);
  });

  it("handles empty input", () => {
    const b = analyze([]);
    expect(b.styles).toEqual([]);
    expect(b.suggestions).toEqual([]);
    expect(fallbackStyleText(b)).toBe("");
  });

  it("is deterministic", () => {
    const tags = ["Folk", "Melancholic", "Acoustic Guitar", "Male Vocals"];
    expect(analyze(tags)).toEqual(analyze(tags));
  });
});

describe("engine: clashes, conflicts and contrast", () => {
  it("drops one side of a clash and flags the tempo conflict", () => {
    const b = analyze(["Slow Tempo", "Fast Tempo", "EDM"]);
    expect(b.clashes).toHaveLength(1);
    expect(b.conflicts[0]?.group).toBe("tempo");
    const dropped = b.styles.filter((s) => s.role === "outlier").map((s) => s.name);
    expect(dropped).toHaveLength(1);
    expect(dropped[0]).toBe(b.clashes[0].suggestDrop);
    expect(fallbackStyleText(b)).not.toContain(dropped[0]);
    // no tension may involve the dropped style
    expect(b.tensions.some((t) => t.a === dropped[0] || t.b === dropped[0])).toBe(false);
  });

  it("does not build suggestions on a dropped style", () => {
    const b = analyze(["Slow Tempo", "Fast Tempo", "EDM"]);
    const dropped = b.styles.find((s) => s.role === "outlier")!.name;
    expect(b.suggestions.every((s) => !s.because.includes(dropped))).toBe(true);
  });

  it("treats a tension as a deliberate contrast, not a clash", () => {
    const b = analyze(["Trap", "Peaceful", "808 Bass"]);
    expect(b.clashes).toEqual([]);
    expect(roleOf(b, "Peaceful")).toBe("contrast");
    expect(b.tensions.length).toBeGreaterThan(0);
  });

  it("never treats an unknown pair as a clash", () => {
    expect(getEdge("Melancholic", "Male Vocals")).toBeUndefined();
    const b = analyze(["Melancholic", "Male Vocals"]);
    expect(b.clashes).toEqual([]);
    expect(b.pairs[0].kind).toBe("unknown");
    expect(b.confidence).toEqual({ pairsTotal: 1, pairsKnown: 0, pairsTested: 0 });
  });
});

describe("engine: suggestions", () => {
  const tags = ["Lo-Fi Hip-Hop", "Relaxed"];
  const b = analyze(tags);

  it("never suggests something already selected or that clashes", () => {
    for (const s of b.suggestions) {
      expect(tags).not.toContain(s.name);
      for (const t of b.styles.map((x) => x.name)) {
        expect(getEdge(s.name, t)?.kind).not.toBe("clash");
      }
    }
  });

  it("limits the free library to launch styles and at most two per category", () => {
    expect(b.suggestions.length).toBeGreaterThan(0);
    expect(b.suggestions.every((s) => getStyle(s.name)!.launch)).toBe(true);
    const counts = new Map<string, number>();
    for (const s of b.suggestions) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
  });

  it("flags suggestions that fill a missing category", () => {
    const gap = b.suggestions.find((s) => s.category === "vocal" || s.category === "instrument");
    expect(gap?.fillsGap).toBe(true);
  });

  it("the full library can reach beyond the launch set", () => {
    const full = analyze(["Black Metal"], { library: "full", maxSuggestions: 20 });
    expect(full.suggestions.some((s) => !getStyle(s.name)!.launch)).toBe(true);
  });

  it("does not suggest a second tempo", () => {
    const t = analyze(["Slow Tempo", "Ambient"], { library: "full", maxSuggestions: 30 });
    expect(t.suggestions.map((s) => s.name)).not.toContain("Midtempo");
    expect(t.suggestions.map((s) => s.name)).not.toContain("Adagio");
  });
});

describe("engine: exclude list", () => {
  it("excludes clashing styles that don't also fit the selection", () => {
    const b = analyze(["Lo-Fi Hip-Hop", "Relaxed"]);
    expect(b.exclude.length).toBeGreaterThan(0);
    for (const e of b.exclude) {
      expect(["Lo-Fi Hip-Hop", "Relaxed"]).not.toContain(e.name);
      for (const t of ["Lo-Fi Hip-Hop", "Relaxed"]) {
        const edge = getEdge(e.name, t);
        expect(edge?.kind === "affinity" && edge.weight >= 0.6).toBe(false);
      }
    }
    expect(excludeText(b)).toBe(b.exclude.map((e) => e.name).join(", "));
  });

  it("ranks concrete sound sources above moods when both clash", () => {
    const b = analyze(["Relaxed"]);
    const cats = b.exclude.map((e) => e.category);
    expect(cats).toContain("energy");
    expect(["genre", "instrument", "vocal", "production"]).toContain(cats[0]);
  });
});

describe("engine: placement and budget", () => {
  it("routes section tags to the lyrics, not the style field", () => {
    const b = analyze(["EDM", "Drop", "Intro", "Euphoric"]);
    expect(lyricsSectionTags(b)).toEqual(["Drop", "Intro"]);
    const text = fallbackStyleText(b);
    expect(text).not.toContain("Drop");
    expect(text.startsWith("EDM")).toBe(true);
  });

  it("keeps fallback text within the target and the hard limit", () => {
    const many = analyze(
      ["Pop", "Rock", "Synthwave", "Melancholic", "Piano", "Strings", "Female Vocals", "Lo-Fi",
       "Driving Rhythm", "Wide Stereo", "Shimmering", "Anthemic Chorus"],
      { targetChars: 60 },
    );
    expect(fallbackStyleText(many).length).toBeLessThanOrEqual(60);
    expect(analyze(["Pop"], { targetChars: 5000 }).budget.targetChars).toBe(STYLE_MAX_CHARS);
  });

  it("clamps long text at a phrase boundary under the limit", () => {
    const long = Array.from({ length: 200 }, (_, i) => `element ${i}`).join(", ");
    const out = clampToLimit(long);
    expect(out.length).toBeLessThanOrEqual(STYLE_MAX_CHARS);
    expect(out.endsWith(",")).toBe(false);
    expect(long.startsWith(out)).toBe(true);
    expect(clampToLimit("short")).toBe("short");
  });

  it("passes catalog cautions through to the writer", () => {
    const b = analyze(["Progressive Rock", "7/8 Time"], { library: "full" });
    expect(toWriterContext(b)).toMatch(/7\/8 Time: Fine-grained execution is unverified/);
  });
});
