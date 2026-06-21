import { describe, it, expect } from "vitest";
import {
  ActivityStatus,
  PROGRESS_BANDS,
  computeOverallProgress,
  defaultProgressFor,
  isProgressValidForStatus,
  isValidStatus,
  progressBandFor
} from "./activity-status";

describe("progress bands (§6)", () => {
  it("exposes a band for every status", () => {
    for (const status of Object.values(ActivityStatus)) {
      expect(progressBandFor(status)).toEqual(PROGRESS_BANDS[status]);
    }
  });

  it("NotStarted is pinned to 0 and Finished to 100", () => {
    expect(PROGRESS_BANDS.NotStarted).toEqual({ min: 0, max: 0 });
    expect(PROGRESS_BANDS.Finished).toEqual({ min: 100, max: 100 });
  });

  it("Blocked allows the full range", () => {
    expect(isProgressValidForStatus(ActivityStatus.Blocked, 0)).toBe(true);
    expect(isProgressValidForStatus(ActivityStatus.Blocked, 73)).toBe(true);
    expect(isProgressValidForStatus(ActivityStatus.Blocked, 100)).toBe(true);
  });
});

describe("isProgressValidForStatus", () => {
  it("accepts progress inside the band", () => {
    expect(isProgressValidForStatus(ActivityStatus.Assessment, 5)).toBe(true);
    expect(isProgressValidForStatus(ActivityStatus.Assessment, 25)).toBe(true);
    expect(isProgressValidForStatus(ActivityStatus.InProgress, 40)).toBe(true);
    expect(isProgressValidForStatus(ActivityStatus.InProgress, 90)).toBe(true);
  });

  it("rejects progress outside the band", () => {
    expect(isProgressValidForStatus(ActivityStatus.Assessment, 4)).toBe(false);
    expect(isProgressValidForStatus(ActivityStatus.Assessment, 26)).toBe(false);
    expect(isProgressValidForStatus(ActivityStatus.NotStarted, 10)).toBe(false);
    expect(isProgressValidForStatus(ActivityStatus.Finished, 99)).toBe(false);
  });

  it("rejects out-of-range and non-finite values", () => {
    expect(isProgressValidForStatus(ActivityStatus.InProgress, -1)).toBe(false);
    expect(isProgressValidForStatus(ActivityStatus.InProgress, 101)).toBe(false);
    expect(isProgressValidForStatus(ActivityStatus.InProgress, Number.NaN)).toBe(false);
  });
});

describe("defaultProgressFor", () => {
  it("uses the band minimum, except Finished which is 100", () => {
    expect(defaultProgressFor(ActivityStatus.NotStarted)).toBe(0);
    expect(defaultProgressFor(ActivityStatus.Assessment)).toBe(5);
    expect(defaultProgressFor(ActivityStatus.Planned)).toBe(25);
    expect(defaultProgressFor(ActivityStatus.InProgress)).toBe(40);
    expect(defaultProgressFor(ActivityStatus.Finished)).toBe(100);
  });
});

describe("isValidStatus", () => {
  it("recognizes known statuses and rejects unknown ones", () => {
    expect(isValidStatus("InProgress")).toBe(true);
    expect(isValidStatus("NotApplicable")).toBe(true);
    expect(isValidStatus("Bogus")).toBe(false);
    expect(isValidStatus("")).toBe(false);
  });
});

describe("computeOverallProgress (excludes NotApplicable)", () => {
  it("averages a mix of statuses and rounds to nearest integer", () => {
    const lines = [
      { status: ActivityStatus.Finished, progress: 100 },
      { status: ActivityStatus.InProgress, progress: 50 },
      { status: ActivityStatus.NotStarted, progress: 0 }
    ];
    // (100 + 50 + 0) / 3 = 50
    expect(computeOverallProgress(lines)).toBe(50);
  });

  it("excludes NotApplicable lines from the denominator", () => {
    const lines = [
      { status: ActivityStatus.Finished, progress: 100 },
      { status: ActivityStatus.NotApplicable, progress: 0 },
      { status: ActivityStatus.NotApplicable, progress: 0 }
    ];
    // only the Finished line counts → 100, not 33
    expect(computeOverallProgress(lines)).toBe(100);
  });

  it("rounds to the nearest integer", () => {
    const lines = [
      { status: ActivityStatus.InProgress, progress: 50 },
      { status: ActivityStatus.InProgress, progress: 51 }
    ];
    // 50.5 → 51
    expect(computeOverallProgress(lines)).toBe(51);
  });

  it("returns 0 for an empty list", () => {
    expect(computeOverallProgress([])).toBe(0);
  });

  it("returns 0 when every line is NotApplicable", () => {
    const lines = [
      { status: ActivityStatus.NotApplicable, progress: 0 },
      { status: ActivityStatus.NotApplicable, progress: 100 }
    ];
    expect(computeOverallProgress(lines)).toBe(0);
  });

  it("handles a single counted line", () => {
    expect(computeOverallProgress([{ status: ActivityStatus.InProgress, progress: 73 }])).toBe(73);
  });
});
