import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getActivity } from "@/lib/activities";
import { getActivityTypeLabelMap } from "@/lib/settings";
import { parseResponsibles } from "@/lib/responsibles";
import { computeOverallProgress } from "@/lib/activity-status";
import { activityLifecycle, isLineOverdue } from "@/lib/metrics";
import { generateMeta } from "@/lib/utils";
import { RolloutMatrix, type MatrixLine } from "./rollout-matrix";
import { MilestonesPanel, type MilestoneItem } from "./milestones-panel";
import { ActivityActions } from "./activity-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await getActivity(id);
  return generateMeta({
    title: activity ? `${activity.activityId} — ${activity.name}` : "Activity",
    description: "Factory rollout matrix and per-line updates for one activity.",
    canonical: `/dashboard/crm/activities/${id}`
  });
}

function dateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await getActivity(id);
  if (!activity) notFound();

  const now = new Date();
  const overall = computeOverallProgress(activity.lines);
  const lifecycle = activityLifecycle(activity);
  const typeLabels = await getActivityTypeLabelMap();
  const typeLabel = typeLabels[activity.type] ?? activity.type;

  const matrixLines: MatrixLine[] = activity.lines.map((line) => ({
    id: line.id,
    factoryName: line.factory.name,
    region: line.factory.region,
    country: line.factory.country,
    inScope: line.inScope,
    status: line.status,
    progress: line.progress,
    responsibles: parseResponsibles(line.responsibles),
    blockerFlag: line.blockerFlag,
    dueDate: dateOnly(line.dueDate),
    nextAction: line.nextAction,
    comment: line.comment,
    currentPhase: line.currentPhase,
    lastUpdate: line.lastUpdate.toISOString(),
    overdue: isLineOverdue(line, now)
  }));

  const milestones: MilestoneItem[] = activity.milestones.map((m) => ({
    id: m.id,
    name: m.name,
    date: dateOnly(m.date),
    status: m.status
  }));

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/dashboard/crm">
            <ChevronLeftIcon /> Back to overview
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{activity.name}</h1>
              <Badge variant="outline">{lifecycle}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {activity.activityId} · <span>{typeLabel}</span>
              {activity.globalOwner ? ` · Owner: ${activity.globalOwner}` : ""}
            </p>
          </div>
          <ActivityActions
            activityId={activity.id}
            archived={!!activity.archivedAt}
            completed={!!activity.completedAt}
          />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-8 p-4">
          <div className="min-w-48 flex-1">
            <div className="text-muted-foreground mb-1 text-xs">Overall progress (NA excluded)</div>
            <div className="flex items-center gap-3">
              <Progress value={overall} className="h-2.5" />
              <span className="text-lg font-semibold tabular-nums">{overall}%</span>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Factories</div>
            <div className="text-lg font-semibold">{activity.lines.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Target end</div>
            <div className="text-lg font-semibold">
              {activity.targetEndDate ? activity.targetEndDate.toLocaleDateString() : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Factory rollout matrix</h2>
        <RolloutMatrix activityId={activity.id} lines={matrixLines} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestonesPanel activityId={activity.id} milestones={milestones} />
        </CardContent>
      </Card>
    </div>
  );
}
