// Pure dashboard aggregation helpers (no DB) — unit tested in lib/metrics.test.ts.
// The overview page fetches activities + their lines and feeds them here.
import { ActivityStatus } from "./activity-status";

export type ActivityLifecycle = "Active" | "Completed" | "Archived";

export interface MetricLine {
  status: string;
  dueDate: Date | string | null;
  blockerFlag?: boolean;
  inScope?: string;
}

export interface MetricActivity {
  completedAt: Date | string | null;
  archivedAt: Date | string | null;
  lines: MetricLine[];
}

// Lines in these statuses are "done" and never count as overdue.
const TERMINAL_STATUSES = new Set<string>([ActivityStatus.Finished, ActivityStatus.NotApplicable]);

/** Display lifecycle: Archived takes visual priority, then Completed, else Active. */
export function activityLifecycle(activity: {
  completedAt: Date | string | null;
  archivedAt: Date | string | null;
}): ActivityLifecycle {
  if (activity.archivedAt) return "Archived";
  if (activity.completedAt) return "Completed";
  return "Active";
}

/** UTC day index (date-only values are stored at midnight UTC). */
function utcDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * A line is overdue when its due date's calendar day is strictly before today
 * and it is not Finished/NotApplicable. Compared at UTC day granularity so a
 * line due "today" is never overdue regardless of the server clock's time.
 */
export function isLineOverdue(line: { status: string; dueDate: Date | string | null }, now: Date): boolean {
  if (!line.dueDate) return false;
  if (TERMINAL_STATUSES.has(line.status)) return false;
  const due = line.dueDate instanceof Date ? line.dueDate : new Date(line.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  return utcDayStart(due) < utcDayStart(now);
}

export interface ActivityRowMetrics {
  inScopeCount: number;
  blockedCount: number;
  overdueCount: number;
}

/** Per-activity counts for an overview row. In-scope excludes lines marked No. */
export function activityRowMetrics(lines: MetricLine[], now: Date): ActivityRowMetrics {
  let inScopeCount = 0;
  let blockedCount = 0;
  let overdueCount = 0;
  for (const line of lines) {
    if (line.inScope !== "No") inScopeCount++;
    if (line.blockerFlag) blockedCount++;
    if (isLineOverdue(line, now)) overdueCount++;
  }
  return { inScopeCount, blockedCount, overdueCount };
}

export interface DashboardCounters {
  totalActivities: number;
  activeActivities: number;
  completedActivities: number;
  blockedLines: number;
  overdueLines: number;
}

/**
 * FR-13 counters. Active = not completed and not archived; Completed = has a
 * completedAt (independent of archive). Blocked/overdue are line-level totals.
 */
export function computeCounters(activities: MetricActivity[], now: Date): DashboardCounters {
  let activeActivities = 0;
  let completedActivities = 0;
  let blockedLines = 0;
  let overdueLines = 0;

  for (const activity of activities) {
    if (activity.completedAt) completedActivities++;
    if (!activity.completedAt && !activity.archivedAt) activeActivities++;
    for (const line of activity.lines) {
      if (line.blockerFlag) blockedLines++;
      if (isLineOverdue(line, now)) overdueLines++;
    }
  }

  return {
    totalActivities: activities.length,
    activeActivities,
    completedActivities,
    blockedLines,
    overdueLines
  };
}
