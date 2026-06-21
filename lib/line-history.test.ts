import { describe, it, expect } from "vitest";
import { diffLineFields, resolveLineProgress, type LineSnapshot } from "./line-history";
import { ActivityStatus } from "./activity-status";

const base: LineSnapshot = {
  status: ActivityStatus.NotStarted,
  progress: 0,
  responsibles: [],
  blockerFlag: false,
  inScope: "Yes",
  currentPhase: null,
  dueDate: null,
  nextAction: null,
  comment: null
};

describe("diffLineFields", () => {
  it("records only changed fields", () => {
    const changes = diffLineFields(base, { status: ActivityStatus.InProgress, progress: 60 });
    expect(changes).toEqual([
      { field: "status", oldValue: "NotStarted", newValue: "InProgress" },
      { field: "progress", oldValue: "0", newValue: "60" }
    ]);
  });

  it("ignores fields that did not change", () => {
    const changes = diffLineFields(
      { ...base, status: ActivityStatus.InProgress, progress: 60 },
      { status: ActivityStatus.InProgress, progress: 60 }
    );
    expect(changes).toEqual([]);
  });

  it("normalizes dates to date-only for comparison", () => {
    const existing = { ...base, dueDate: new Date("2026-07-15T00:00:00.000Z") };
    expect(diffLineFields(existing, { dueDate: "2026-07-15" })).toEqual([]);
    expect(diffLineFields(existing, { dueDate: "2026-08-01" })).toEqual([
      { field: "dueDate", oldValue: "2026-07-15", newValue: "2026-08-01" }
    ]);
  });

  it("treats empty string and null as equivalent (no change)", () => {
    expect(diffLineFields({ ...base, comment: null }, { comment: "" })).toEqual([]);
  });

  it("records boolean blocker changes", () => {
    expect(diffLineFields(base, { blockerFlag: true })).toEqual([
      { field: "blockerFlag", oldValue: "false", newValue: "true" }
    ]);
  });

  it("ignores undefined / absent fields", () => {
    expect(diffLineFields(base, { responsibles: undefined })).toEqual([]);
  });

  it("records responsibles list changes as a joined string", () => {
    expect(diffLineFields(base, { responsibles: ["Alice", "Bob"] })).toEqual([
      { field: "responsibles", oldValue: null, newValue: "Alice, Bob" }
    ]);
  });

  it("treats the same responsibles in a different representation as no change", () => {
    const existing = { ...base, responsibles: ["Bob", "Alice"] };
    // Reordered + padded whitespace + a duplicate → same set, so no change.
    expect(
      diffLineFields(existing, { responsibles: ["Alice", " Bob ", "Bob"] })
    ).toEqual([]);
  });

  it("treats an empty responsibles list as null (no change from empty)", () => {
    expect(diffLineFields(base, { responsibles: [] })).toEqual([]);
  });
});

describe("resolveLineProgress", () => {
  it("pins Finished to 100 and NotStarted to 0 regardless of requested", () => {
    expect(resolveLineProgress(ActivityStatus.Finished, 50, 10)).toBe(100);
    expect(resolveLineProgress(ActivityStatus.NotStarted, 50, 10)).toBe(0);
  });
  it("uses the requested value for other statuses", () => {
    expect(resolveLineProgress(ActivityStatus.InProgress, 65, 10)).toBe(65);
    expect(resolveLineProgress(ActivityStatus.Blocked, 33, 10)).toBe(33);
  });
  it("falls back to current when no progress requested", () => {
    expect(resolveLineProgress(ActivityStatus.InProgress, undefined, 42)).toBe(42);
    expect(resolveLineProgress(undefined, undefined, 42)).toBe(42);
  });
});
