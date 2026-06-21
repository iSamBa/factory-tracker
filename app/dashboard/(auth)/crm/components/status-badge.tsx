"use client";

import { Badge } from "@/components/ui/badge";
import { isValidStatus } from "@/lib/activity-status";
import { useStatusDisplay } from "@/components/status-display-provider";

/** Renders an activity/line status as a styled badge, with a fallback for unknown values. */
export function StatusBadge({ status }: { status: string | null }) {
  const display = useStatusDisplay();
  if (status && isValidStatus(status)) {
    const { label, badgeVariant } = display[status];
    return <Badge variant={badgeVariant}>{label}</Badge>;
  }
  return <Badge variant="outline">{status ?? "—"}</Badge>;
}
