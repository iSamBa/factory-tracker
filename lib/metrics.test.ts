import { describe, it, expect } from "vitest";
import {
  activityLifecycle,
  activityRowMetrics,
  computeCounters,
  isLineOverdue,
  type MetricActivity
} from "./metrics";
import { ActivityStatus } from "./activity-status";

const NOW = new Date("2026-06-14T00:00:00.000Z");
const PAST = "2026-01-01";
const FUTURE = "2026-12-31";

describe("activityLifecycle", () => {
  it("prioritizes archived, then completed, else active", () => {
    expect(activityLifecycle({ archivedAt: new Date(), completedAt: null })).toBe("Archived");
    expect(activityLifecycle({ archivedAt: new Date(), completedAt: new Date() })).toBe("Archived");
    expect(activityLifecycle({ archivedAt: null, completedAt: new Date() })).toBe("Completed");
    expect(activityLifecycle({ archivedAt: null, completedAt: null })).toBe("Active");
  });
});

describe("isLineOverdue", () => {
  it("is true for a past due date on a non-terminal line", () => {
    expect(isLineOverdue({ status: ActivityStatus.InProgress, dueDate: PAST }, NOW)).toBe(true);
  });
  it("is false when there is no due date", () => {
    expect(isLineOverdue({ status: ActivityStatus.InProgress, dueDate: null }, NOW)).toBe(false);
  });
  it("is false for a future due date", () => {
    expect(isLineOverdue({ status: ActivityStatus.InProgress, dueDate: FUTURE }, NOW)).toBe(false);
  });
  it("is false when due exactly today (not yet past)", () => {
    expect(isLineOverdue({ status: ActivityStatus.InProgress, dueDate: "2026-06-14" }, NOW)).toBe(false);
  });
  it("is true the day after the due date", () => {
    expect(isLineOverdue({ status: ActivityStatus.InProgress, dueDate: "2026-06-13" }, NOW)).toBe(true);
  });
  it("is false when the line is Finished or NotApplicable even if past due", () => {
    expect(isLineOverdue({ status: ActivityStatus.Finished, dueDate: PAST }, NOW)).toBe(false);
    expect(isLineOverdue({ status: ActivityStatus.NotApplicable, dueDate: PAST }, NOW)).toBe(false);
  });
  it("is false for an invalid date", () => {
    expect(isLineOverdue({ status: ActivityStatus.InProgress, dueDate: "not-a-date" }, NOW)).toBe(false);
  });
});

describe("activityRowMetrics", () => {
  it("counts in-scope (excluding No), blocked, and overdue", () => {
    const lines = [
      { status: ActivityStatus.InProgress, dueDate: PAST, blockerFlag: true, inScope: "Yes" },
      { status: ActivityStatus.NotApplicable, dueDate: null, blockerFlag: false, inScope: "No" },
      { status: ActivityStatus.Planned, dueDate: FUTURE, blockerFlag: false, inScope: "Yes" }
    ];
    expect(activityRowMetrics(lines, NOW)).toEqual({
      inScopeCount: 2,
      blockedCount: 1,
      overdueCount: 1
    });
  });

  it("handles no lines", () => {
    expect(activityRowMetrics([], NOW)).toEqual({ inScopeCount: 0, blockedCount: 0, overdueCount: 0 });
  });
});

describe("computeCounters (FR-13)", () => {
  const activities: MetricActivity[] = [
    {
      completedAt: null,
      archivedAt: null,
      lines: [
        { status: ActivityStatus.InProgress, dueDate: PAST, blockerFlag: true },
        { status: ActivityStatus.Blocked, dueDate: FUTURE, blockerFlag: true }
      ]
    },
    {
      completedAt: new Date(),
      archivedAt: null,
      lines: [{ status: ActivityStatus.Finished, dueDate: PAST, blockerFlag: false }]
    },
    {
      completedAt: null,
      archivedAt: new Date(),
      lines: [{ status: ActivityStatus.InProgress, dueDate: PAST, blockerFlag: false }]
    }
  ];

  it("counts total/active/completed activities and blocked/overdue lines", () => {
    expect(computeCounters(activities, NOW)).toEqual({
      totalActivities: 3,
      activeActivities: 1, // only the first (not completed, not archived)
      completedActivities: 1, // the second
      blockedLines: 2, // two blockerFlag lines in the first activity
      overdueLines: 2 // first activity's past InProgress + archived activity's past InProgress
    });
  });

  it("returns zeros for no activities", () => {
    expect(computeCounters([], NOW)).toEqual({
      totalActivities: 0,
      activeActivities: 0,
      completedActivities: 0,
      blockedLines: 0,
      overdueLines: 0
    });
  });
});
