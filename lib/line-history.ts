// Pure helpers for line updates — diffing changed fields (for UpdateHistory) and
// resolving the effective progress for a status. No DB; unit tested.
import { ActivityStatus } from "./activity-status";
import { normalizeResponsibles } from "./responsibles";
import type { UpdateLineInput } from "./validation/line";

export interface LineSnapshot {
  status: string;
  progress: number;
  responsibles: string[];
  blockerFlag: boolean;
  inScope: string;
  currentPhase: string | null;
  dueDate: Date | string | null;
  nextAction: string | null;
  comment: string | null;
}

export interface LineFieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

const TRACKED_FIELDS: (keyof LineSnapshot)[] = [
  "status",
  "progress",
  "responsibles",
  "blockerFlag",
  "inScope",
  "currentPhase",
  "dueDate",
  "nextAction",
  "comment"
];

/** Normalize a value to a comparable/storable string (date-only for dates). */
function normalize(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  // Lists (e.g. responsibles) are a set with no inherent order, so compare by a
  // canonical sorted form — reordering the same names is not a change. An empty
  // list reads as null. (Storage keeps the user's order; only the diff sorts.)
  if (Array.isArray(value)) {
    const names = normalizeResponsibles(value);
    if (names.length === 0) return null;
    return [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).join(", ");
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return String(value);
}

/**
 * Compare an existing line against a partial update and return one change record
 * per field that actually changed. Fields absent from `update` are ignored.
 */
export function diffLineFields(existing: LineSnapshot, update: UpdateLineInput): LineFieldChange[] {
  const changes: LineFieldChange[] = [];
  for (const field of TRACKED_FIELDS) {
    if (!(field in update) || (update as Record<string, unknown>)[field] === undefined) continue;
    const oldValue = normalize(existing[field]);
    const newValue = normalize((update as Record<string, unknown>)[field]);
    if (oldValue !== newValue) changes.push({ field, oldValue, newValue });
  }
  return changes;
}

/**
 * Effective progress for a (possibly changed) status: Finished pins to 100 and
 * NotStarted to 0; otherwise the requested value wins, falling back to current.
 */
export function resolveLineProgress(
  status: string | undefined,
  requested: number | undefined,
  current: number
): number {
  if (status === ActivityStatus.Finished) return 100;
  if (status === ActivityStatus.NotStarted) return 0;
  if (requested !== undefined) return requested;
  return current;
}
