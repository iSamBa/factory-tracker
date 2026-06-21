// Shared status → progress model (requirements §6).
// SQLite has no native enums, so these string unions are the source of truth for
// the enum-like fields stored on Activity / ActivityFactoryStatus / etc.

export const ActivityStatus = {
  NotStarted: "NotStarted",
  Assessment: "Assessment",
  Planned: "Planned",
  InProgress: "InProgress",
  Blocked: "Blocked",
  Finished: "Finished",
  NotApplicable: "NotApplicable"
} as const;
export type ActivityStatus = (typeof ActivityStatus)[keyof typeof ActivityStatus];
export const ACTIVITY_STATUSES = Object.values(ActivityStatus) as ActivityStatus[];

export const Region = {
  EU: "EU",
  CN: "CN",
  US: "US",
  Other: "Other"
} as const;
export type Region = (typeof Region)[keyof typeof Region];
export const REGIONS = Object.values(Region) as Region[];

export const ACTIVITY_TYPES = [
  "migration",
  "onboarding",
  "rollout",
  "compliance",
  "maintenance",
  "service-enablement"
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const SCOPE_RULES = ["all", "regions", "countries", "factories"] as const;
export type ScopeRule = (typeof SCOPE_RULES)[number];

export const IN_SCOPE_VALUES = ["Yes", "No", "TBC"] as const;
export type InScope = (typeof IN_SCOPE_VALUES)[number];

/** Inclusive progress band (0–100) allowed for a given status. */
export interface ProgressBand {
  min: number;
  max: number;
}

// §6 bands. Blocked may sit at any progress; NotApplicable is excluded from the
// overall calculation entirely (see computeOverallProgress).
export const PROGRESS_BANDS: Record<ActivityStatus, ProgressBand> = {
  NotStarted: { min: 0, max: 0 },
  Assessment: { min: 5, max: 25 },
  Planned: { min: 25, max: 40 },
  InProgress: { min: 40, max: 90 },
  Blocked: { min: 0, max: 100 },
  Finished: { min: 100, max: 100 },
  NotApplicable: { min: 0, max: 0 }
};

export function isValidStatus(value: string): value is ActivityStatus {
  return (ACTIVITY_STATUSES as string[]).includes(value);
}

export const BADGE_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "warning",
  "info",
  "success"
] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

/** Maps a status to a shadcn Badge variant for consistent display across screens. */
export const STATUS_BADGE_VARIANT: Record<ActivityStatus, BadgeVariant> = {
  NotStarted: "outline",
  Assessment: "info",
  Planned: "info",
  InProgress: "default",
  Blocked: "destructive",
  Finished: "success",
  NotApplicable: "secondary"
};

/** Human-friendly status label (spaces inserted). */
export const STATUS_LABEL: Record<ActivityStatus, string> = {
  NotStarted: "Not Started",
  Assessment: "Assessment",
  Planned: "Planned",
  InProgress: "In Progress",
  Blocked: "Blocked",
  Finished: "Finished",
  NotApplicable: "Not Applicable"
};

export function progressBandFor(status: ActivityStatus): ProgressBand {
  return PROGRESS_BANDS[status];
}

/** Suggested default progress when a line transitions to `status`. */
export function defaultProgressFor(status: ActivityStatus): number {
  return status === ActivityStatus.Finished ? 100 : PROGRESS_BANDS[status].min;
}

/** True when `progress` is within [0,100] and inside the status' band. */
export function isProgressValidForStatus(status: ActivityStatus, progress: number): boolean {
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) return false;
  const band = PROGRESS_BANDS[status];
  return progress >= band.min && progress <= band.max;
}

/** A tracking line as far as the overall-progress calc is concerned. */
export interface ProgressLine {
  status: string;
  progress: number;
}

/**
 * Overall activity progress = mean of in-scope line progress, excluding
 * NotApplicable lines, rounded to the nearest integer. Returns 0 when there are
 * no counted lines (empty list or all NotApplicable) — defined behavior.
 */
export function computeOverallProgress(lines: ProgressLine[]): number {
  const counted = lines.filter((line) => line.status !== ActivityStatus.NotApplicable);
  if (counted.length === 0) return 0;
  const sum = counted.reduce((total, line) => total + line.progress, 0);
  return Math.round(sum / counted.length);
}
