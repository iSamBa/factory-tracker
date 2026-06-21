import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { generateMeta } from "@/lib/utils";
import { getActivityTypeLabelMap } from "@/lib/settings";
import { activityLifecycle, activityRowMetrics, computeCounters } from "@/lib/metrics";
import { OverviewCounters } from "./components/overview-counters";
import { ActivitiesTable, type ActivityRow } from "./components/activities-table";

export async function generateMetadata() {
  return generateMeta({
    title: "Activity Overview",
    description: "Track the status of every activity across all factories at a glance.",
    canonical: "/dashboard/crm"
  });
}

export default async function OverviewPage() {
  const now = new Date();
  const activities = await db.activity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lines: {
        select: { status: true, dueDate: true, blockerFlag: true, inScope: true, lastUpdate: true }
      }
    }
  });

  const counters = computeCounters(activities, now);
  const typeLabels = await getActivityTypeLabelMap();

  const rows: ActivityRow[] = activities.map((activity) => {
    const { inScopeCount, blockedCount } = activityRowMetrics(activity.lines, now);
    const lastLineUpdate = activity.lines.reduce<number>(
      (max, line) => Math.max(max, new Date(line.lastUpdate).getTime()),
      activity.updatedAt.getTime()
    );
    return {
      id: activity.id,
      activityId: activity.activityId,
      name: activity.name,
      type: typeLabels[activity.type] ?? activity.type,
      lifecycle: activityLifecycle(activity),
      overallStatus: activity.overallStatus,
      overallProgress: activity.overallProgress,
      inScopeCount,
      blockedCount,
      // Date-only (YYYY-MM-DD) to avoid a timezone day-shift when displayed.
      targetEndDate: activity.targetEndDate
        ? activity.targetEndDate.toISOString().slice(0, 10)
        : null,
      lastUpdate: new Date(lastLineUpdate).toISOString()
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Activity overview</h1>
          <p className="text-muted-foreground text-sm">
            Where are we across all factories, for every activity?
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/activities/new">
            <PlusIcon /> New activity
          </Link>
        </Button>
      </div>

      <OverviewCounters counters={counters} />
      <ActivitiesTable rows={rows} />
    </div>
  );
}
