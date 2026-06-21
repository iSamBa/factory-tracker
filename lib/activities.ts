import { db } from "@/lib/db";
import { ActivityStatus, computeOverallProgress } from "@/lib/activity-status";
import { canCompleteActivity, resolveFactoryIdsForScope } from "@/lib/activity-scope";
import { diffLineFields, resolveLineProgress, type LineSnapshot } from "@/lib/line-history";
import { parseResponsibles, serializeResponsibles } from "@/lib/responsibles";
import type { CreateActivityInput, UpdateActivityInput } from "@/lib/validation/activity";
import type {
  CreateMilestoneInput,
  UpdateLineInput,
  UpdateMilestoneInput
} from "@/lib/validation/line";

/** Thrown when a scope resolves to zero factories (no trackable lines). */
export class EmptyScopeError extends Error {
  constructor() {
    super("Scope matched no factories");
    this.name = "EmptyScopeError";
  }
}

/** Next sequential human-friendly activity code, e.g. ACT-003. */
async function nextActivityCode(tx: { activity: { count: () => Promise<number> } }): Promise<string> {
  const count = await tx.activity.count();
  return `ACT-${String(count + 1).padStart(3, "0")}`;
}

function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

export async function listActivities(options?: { includeArchived?: boolean }) {
  return db.activity.findMany({
    where: options?.includeArchived ? undefined : { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lines: true, milestones: true } } }
  });
}

export async function getActivity(id: string) {
  return db.activity.findUnique({
    where: { id },
    include: {
      lines: { include: { factory: true }, orderBy: { factory: { name: "asc" } } },
      milestones: { orderBy: { date: "asc" } }
    }
  });
}

/**
 * Create an activity and generate one tracking line per in-scope factory at
 * NotStarted/0%. The factory read + activity + line inserts run in a single
 * transaction so a partial activity is never persisted.
 */
export async function createActivity(input: CreateActivityInput) {
  const factories = await db.factory.findMany({
    select: { id: true, region: true, country: true }
  });
  const factoryIds = resolveFactoryIdsForScope(input.scope, factories);
  if (factoryIds.length === 0) {
    throw new EmptyScopeError();
  }

  return db.$transaction(async (tx) => {
    const code = await nextActivityCode(tx);
    const activity = await tx.activity.create({
      data: {
        activityId: code,
        name: input.name,
        type: input.type,
        description: input.description ?? null,
        scopeRule: input.scope.rule,
        globalOwner: input.globalOwner ?? null,
        startDate: toDate(input.startDate),
        targetEndDate: toDate(input.targetEndDate)
      }
    });

    await tx.activityFactoryStatus.createMany({
      data: factoryIds.map((factoryId) => ({
        activityId: activity.id,
        factoryId,
        inScope: "Yes",
        status: ActivityStatus.NotStarted,
        progress: 0
      }))
    });

    return tx.activity.findUnique({
      where: { id: activity.id },
      include: { lines: true }
    });
  });
}

export async function updateActivity(id: string, input: UpdateActivityInput) {
  return db.activity.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.globalOwner !== undefined ? { globalOwner: input.globalOwner } : {}),
      ...(input.startDate !== undefined ? { startDate: toDate(input.startDate) } : {}),
      ...(input.targetEndDate !== undefined ? { targetEndDate: toDate(input.targetEndDate) } : {}),
      ...(input.overallStatus !== undefined ? { overallStatus: input.overallStatus } : {})
    }
  });
}

export async function archiveActivity(id: string, archived: boolean) {
  return db.activity.update({
    where: { id },
    data: { archivedAt: archived ? new Date() : null }
  });
}

/** Marks an activity Completed if the completion guard passes; otherwise null. */
export async function completeActivity(id: string) {
  const lines = await db.activityFactoryStatus.findMany({
    where: { activityId: id },
    select: { status: true }
  });
  if (!canCompleteActivity(lines)) return null;
  return db.activity.update({
    where: { id },
    data: { completedAt: new Date(), overallStatus: ActivityStatus.Finished }
  });
}

function toDateValue(value: string | null | undefined, current: Date | null): Date | null {
  if (value === undefined) return current;
  return value ? new Date(value) : null;
}

/** Thrown when a referenced tracking line does not exist on the activity. */
export class LineNotFoundError extends Error {
  constructor() {
    super("Tracking line not found");
    this.name = "LineNotFoundError";
  }
}

/**
 * Update one tracking line: applies the partial change, writes one UpdateHistory
 * row per changed field (FR-10), refreshes lastUpdate, and recomputes the
 * activity's cached overall progress — all in a transaction.
 */
export async function updateLine(activityId: string, lineId: string, input: UpdateLineInput) {
  const existing = await db.activityFactoryStatus.findFirst({
    where: { id: lineId, activityId }
  });
  if (!existing) throw new LineNotFoundError();

  const snapshot: LineSnapshot = {
    status: existing.status,
    progress: existing.progress,
    responsibles: parseResponsibles(existing.responsibles),
    blockerFlag: existing.blockerFlag,
    inScope: existing.inScope,
    currentPhase: existing.currentPhase,
    dueDate: existing.dueDate,
    nextAction: existing.nextAction,
    comment: existing.comment
  };

  const nextStatus = (input.status ?? existing.status) as ActivityStatus;
  const nextProgress = resolveLineProgress(input.status, input.progress, existing.progress);
  const normalizedInput: UpdateLineInput = { ...input, status: nextStatus, progress: nextProgress };
  const changes = diffLineFields(snapshot, normalizedInput);

  return db.$transaction(async (tx) => {
    const line = await tx.activityFactoryStatus.update({
      where: { id: lineId },
      data: {
        status: nextStatus,
        progress: nextProgress,
        ...(input.responsibles !== undefined ? { responsibles: serializeResponsibles(input.responsibles) } : {}),
        ...(input.blockerFlag !== undefined ? { blockerFlag: input.blockerFlag } : {}),
        ...(input.inScope !== undefined ? { inScope: input.inScope } : {}),
        ...(input.currentPhase !== undefined ? { currentPhase: input.currentPhase } : {}),
        ...(input.dueDate !== undefined ? { dueDate: toDateValue(input.dueDate, existing.dueDate) } : {}),
        ...(input.nextAction !== undefined ? { nextAction: input.nextAction } : {}),
        ...(input.comment !== undefined ? { comment: input.comment } : {}),
        lastUpdate: new Date()
      }
    });

    if (changes.length > 0) {
      await tx.updateHistory.createMany({
        data: changes.map((change) => ({
          lineId,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue
        }))
      });
    }

    const allLines = await tx.activityFactoryStatus.findMany({
      where: { activityId },
      select: { status: true, progress: true }
    });
    await tx.activity.update({
      where: { id: activityId },
      data: { overallProgress: computeOverallProgress(allLines) }
    });

    return line;
  });
}

/** Returns history for a line, scoped to its activity (throws if not on it). */
export async function getLineHistory(activityId: string, lineId: string) {
  const line = await db.activityFactoryStatus.findFirst({
    where: { id: lineId, activityId },
    select: { id: true }
  });
  if (!line) throw new LineNotFoundError();
  return db.updateHistory.findMany({ where: { lineId }, orderBy: { changedAt: "desc" } });
}

/** Thrown when a referenced milestone does not exist on the activity. */
export class MilestoneNotFoundError extends Error {
  constructor() {
    super("Milestone not found");
    this.name = "MilestoneNotFoundError";
  }
}

export async function createMilestone(activityId: string, input: CreateMilestoneInput) {
  return db.milestone.create({
    data: {
      activityId,
      name: input.name,
      date: input.date ? new Date(input.date) : null,
      status: input.status
    }
  });
}

async function assertMilestoneOnActivity(activityId: string, milestoneId: string) {
  const existing = await db.milestone.findFirst({
    where: { id: milestoneId, activityId },
    select: { id: true }
  });
  if (!existing) throw new MilestoneNotFoundError();
}

export async function updateMilestone(
  activityId: string,
  milestoneId: string,
  input: UpdateMilestoneInput
) {
  await assertMilestoneOnActivity(activityId, milestoneId);
  return db.milestone.update({
    where: { id: milestoneId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.date !== undefined ? { date: input.date ? new Date(input.date) : null } : {})
    }
  });
}

export async function deleteMilestone(activityId: string, milestoneId: string) {
  await assertMilestoneOnActivity(activityId, milestoneId);
  return db.milestone.delete({ where: { id: milestoneId } });
}
