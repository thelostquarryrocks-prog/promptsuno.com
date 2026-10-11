import { describe, expect, it } from "vitest";
import { allStyles, getEdge, getNeighbors, getStyle, resolveTerm } from "./index";

describe("style catalog v2", () => {
  it("loads all 899 styles with unique ids", () => {
    const styles = allStyles();
    expect(styles).toHaveLength(899);
    expect(new Set(styles.map((s) => s.id)).size).toBe(899);
  });

  it("has the approved launch set", () => {
    expect(allStyles().filter((s) => s.launch)).toHaveLength(187);
  });

  it("looks up edges in either direction", () => {
    const ab = getEdge("Piano", "Cello");
    const ba = getEdge("Cello", "Piano");
    expect(ab).toBeDefined();
    expect(ab).toBe(ba);
    expect(ab?.kind).toBe("affinity");
  });

  it("treats a missing pair as unknown, not as a clash", () => {
    expect(getEdge("Melancholic", "Male Vocals")).toBeUndefined();
    expect(getEdge("Piano", "Piano")).toBeUndefined();
  });

  it("knows real clashes and tensions", () => {
    expect(getEdge("Slow Tempo", "Fast Tempo")?.kind).toBe("clash");
    expect(getEdge("Happy", "Melancholic")?.kind).toBe("tension");
  });

  it("separates the engine's two reference examples", () => {
    // piano + cinematic + melancholic: all strong fits
    expect(getEdge("Cinematic", "Melancholic")?.weight).toBeGreaterThanOrEqual(0.75);
    // piano + cinematic + driving rhythm: weaker links the prompt must reconcile
    expect(getEdge("Piano", "Driving Rhythm")!.weight).toBeLessThan(
      getEdge("Piano", "Melancholic")!.weight,
    );
  });

  it("resolves names case-insensitively and through aliases", () => {
    expect(getStyle("synthwave")?.name).toBe("Synthwave");
    expect(resolveTerm("80s").map((s) => s.name)).toEqual(["1980s"]);
    expect(resolveTerm("808s").map((s) => s.name)).toEqual(["808 Drums", "808 Bass"]);
    expect(resolveTerm("chill").map((s) => s.name)).toContain("Relaxed");
    expect(resolveTerm("not a style")).toEqual([]);
  });

  it("indexes neighbors symmetrically", () => {
    const n = getNeighbors("Trap");
    expect(n.length).toBeGreaterThan(10);
    expect(n.every((e) => e.a === "Trap" || e.b === "Trap")).toBe(true);
  });
});
