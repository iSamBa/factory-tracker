import { describe, it, expect } from "vitest";
import { parseResponsibles, serializeResponsibles, normalizeResponsibles } from "./responsibles";

describe("parseResponsibles", () => {
  it("parses a valid JSON array of names", () => {
    expect(parseResponsibles('["Alice","Bob"]')).toEqual(["Alice", "Bob"]);
  });

  it("returns [] for null, empty, or malformed input", () => {
    expect(parseResponsibles(null)).toEqual([]);
    expect(parseResponsibles("")).toEqual([]);
    expect(parseResponsibles("not json")).toEqual([]);
  });

  it("returns [] for non-array JSON", () => {
    expect(parseResponsibles('{"a":1}')).toEqual([]);
    expect(parseResponsibles('"Alice"')).toEqual([]);
  });

  it("trims, drops empties, and dedupes on the way out", () => {
    expect(parseResponsibles('[" Alice ","","Alice","Bob"]')).toEqual(["Alice", "Bob"]);
  });
});

describe("serializeResponsibles round trip", () => {
  it("normalizes then is recovered by parse", () => {
    const stored = serializeResponsibles([" Alice ", "Bob", "alice"]);
    expect(parseResponsibles(stored)).toEqual(["Alice", "Bob"]);
  });
});

describe("normalizeResponsibles", () => {
  it("ignores non-string entries", () => {
    expect(normalizeResponsibles(["Alice", 1, null, "Bob"] as unknown[])).toEqual(["Alice", "Bob"]);
  });
});
