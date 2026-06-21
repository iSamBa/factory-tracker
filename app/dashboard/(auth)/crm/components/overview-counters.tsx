import { ActivityIcon, CheckCircle2Icon, CircleDashedIcon, OctagonAlertIcon, TimerOffIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardCounters } from "@/lib/metrics";

const CARDS: {
  key: keyof DashboardCounters;
  label: string;
  icon: typeof ActivityIcon;
  tone: string;
}[] = [
  { key: "totalActivities", label: "Total activities", icon: ActivityIcon, tone: "text-foreground" },
  { key: "activeActivities", label: "Active", icon: CircleDashedIcon, tone: "text-blue-600" },
  { key: "completedActivities", label: "Completed", icon: CheckCircle2Icon, tone: "text-green-600" },
  { key: "blockedLines", label: "Blocked factories", icon: OctagonAlertIcon, tone: "text-red-600" },
  { key: "overdueLines", label: "Overdue items", icon: TimerOffIcon, tone: "text-orange-600" }
];

export function OverviewCounters({ counters }: { counters: DashboardCounters }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`size-8 shrink-0 ${card.tone}`} />
              <div>
                <div className="text-2xl font-semibold">{counters[card.key]}</div>
                <div className="text-muted-foreground text-xs">{card.label}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
