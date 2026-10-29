import { describe, expect, it } from "vitest";
import { redirectWith, safeNext } from "./server";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/#build")).toBe("/#build");
    expect(safeNext("/privacy")).toBe("/privacy");
  });

  it("refuses anything that could leave the site", () => {
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext(null)).toBe("/");
    expect(safeNext("")).toBe("/");
  });
});

describe("redirectWith", () => {
  it("carries cookies and never caches", () => {
    const h = new Headers();
    h.append("set-cookie", "a=1; Path=/");
    h.append("set-cookie", "b=2; Path=/");
    const res = redirectWith("/#build", h);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/#build");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.getSetCookie()).toEqual(["a=1; Path=/", "b=2; Path=/"]);
  });
});
