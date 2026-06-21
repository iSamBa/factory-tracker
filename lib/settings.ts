import { db } from "@/lib/db";
import {
  ACTIVITY_STATUSES,
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
  type BadgeVariant
} from "@/lib/activity-status";
import type {
  CreateActivityTypeInput,
  CreateRegionInput,
  UpdateActivityTypeInput,
  UpdateRegionInput,
  UpdateStatusOverrideInput
} from "@/lib/validation/settings";

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = "NotFoundError";
  }
}

export class InUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InUseError";
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- Regions -------------------------------------------------------------
export function listRegions() {
  return db.region.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export function createRegion(input: CreateRegionInput) {
  return db.region.create({ data: { name: input.name } });
}

/** Rename a region and cascade the new name onto factories using the old one. */
export async function updateRegion(id: string, input: UpdateRegionInput) {
  const existing = await db.region.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Region");
  return db.$transaction(async (tx) => {
    const region = await tx.region.update({ where: { id }, data: { name: input.name } });
    if (existing.name !== input.name) {
      await tx.factory.updateMany({
        where: { region: existing.name },
        data: { region: input.name }
      });
    }
    return region;
  });
}

export async function deleteRegion(id: string) {
  const existing = await db.region.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Region");
  const inUse = await db.factory.count({ where: { region: existing.name } });
  if (inUse > 0) {
    throw new InUseError(`${inUse} factory(ies) still use region "${existing.name}"`);
  }
  return db.region.delete({ where: { id } });
}

// --- Activity types ------------------------------------------------------
export function listActivityTypes() {
  return db.activityTypeDef.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] });
}

/** value → label map for resolving a stored Activity.type to its display label. */
export async function getActivityTypeLabelMap(): Promise<Record<string, string>> {
  const types = await db.activityTypeDef.findMany({ select: { value: true, label: true } });
  return Object.fromEntries(types.map((t) => [t.value, t.label]));
}

/** Create a type; the stored `value` (used on Activity.type) is a slug of the label. */
export async function createActivityType(input: CreateActivityTypeInput) {
  const value = slugify(input.label) || `type-${Date.now()}`;
  const clash = await db.activityTypeDef.findUnique({ where: { value } });
  if (clash) throw new InUseError(`A type with value "${value}" already exists`);
  return db.activityTypeDef.create({ data: { value, label: input.label } });
}

export async function updateActivityType(id: string, input: UpdateActivityTypeInput) {
  const existing = await db.activityTypeDef.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Activity type");
  // Only the label is editable — the `value` is immutable so existing activities
  // keep their type reference.
  return db.activityTypeDef.update({ where: { id }, data: { label: input.label } });
}

export async function deleteActivityType(id: string) {
  const existing = await db.activityTypeDef.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Activity type");
  const inUse = await db.activity.count({ where: { type: existing.value } });
  if (inUse > 0) {
    throw new InUseError(`${inUse} activity(ies) still use type "${existing.label}"`);
  }
  return db.activityTypeDef.delete({ where: { id } });
}

// --- Status display overlay ---------------------------------------------
export interface StatusDisplay {
  label: string;
  badgeVariant: BadgeVariant;
}

export type StatusDisplayMap = Record<string, StatusDisplay>;

/** Fixed code defaults merged with any DB overrides. Keys stay the fixed set. */
export async function getStatusDisplayMap(): Promise<StatusDisplayMap> {
  const overrides = await db.statusOverride.findMany();
  const map: StatusDisplayMap = {};
  for (const status of ACTIVITY_STATUSES) {
    map[status] = { label: STATUS_LABEL[status], badgeVariant: STATUS_BADGE_VARIANT[status] };
  }
  for (const override of overrides) {
    if (map[override.status]) {
      map[override.status] = {
        label: override.label,
        badgeVariant: override.badgeVariant as BadgeVariant
      };
    }
  }
  return map;
}

/** Upsert one status' display overlay (label + colour). Status must be a known key. */
export async function setStatusOverride(status: string, input: UpdateStatusOverrideInput) {
  if (!(ACTIVITY_STATUSES as readonly string[]).includes(status)) {
    throw new NotFoundError("Status");
  }
  return db.statusOverride.upsert({
    where: { status },
    create: { status, label: input.label, badgeVariant: input.badgeVariant },
    update: { label: input.label, badgeVariant: input.badgeVariant }
  });
}
