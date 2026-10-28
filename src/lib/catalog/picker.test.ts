import { describe, expect, it } from "vitest";
import { getStyle } from "./index";
import { INSTRUMENTAL, PICKER_GROUP_IDS, pickerGroups } from "./picker";

describe("pickerGroups", () => {
  const groups = pickerGroups();

  it("has the five builder groups in order", () => {
    expect(groups.map((g) => g.id)).toEqual(PICKER_GROUP_IDS);
  });

  it("only offers launch styles that exist in the catalog", () => {
    for (const g of groups) {
      expect(g.options.length).toBeGreaterThan(0);
      for (const name of g.options) {
        const s = getStyle(name);
        expect(s, name).toBeDefined();
        expect(s!.launch, name).toBe(true);
      }
    }
  });

  it("never lists a style twice", () => {
    const all = groups.flatMap((g) => g.options);
    expect(new Set(all).size).toBe(all.length);
  });

  it("puts Instrumental under vocals only", () => {
    expect(groups.find((g) => g.id === "vocals")!.options).toContain(INSTRUMENTAL);
    expect(groups.find((g) => g.id === "production")!.options).not.toContain(INSTRUMENTAL);
  });

  it("stays small enough to send to the browser", () => {
    expect(JSON.stringify(groups).length).toBeLessThan(12_000);
  });
});
