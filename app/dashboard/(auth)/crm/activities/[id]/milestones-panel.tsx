"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";

export interface MilestoneItem {
  id: string;
  name: string;
  date: string | null;
  status: string;
}

const STATUS_OPTIONS = ["Pending", "InProgress", "Done"] as const;

const STATUS_VARIANT: Record<string, "outline" | "info" | "success"> = {
  Pending: "outline",
  InProgress: "info",
  Done: "success"
};

export function MilestonesPanel({
  activityId,
  milestones
}: {
  activityId: string;
  milestones: MilestoneItem[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function addMilestone() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/activities/${activityId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, date: date || null })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Failed to add milestone");
      return;
    }
    setName("");
    setDate("");
    toast.success("Milestone added");
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/activities/${activityId}/milestones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      toast.error("Failed to update milestone");
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/activities/${activityId}/milestones/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete milestone");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {milestones.length === 0 && (
          <li className="text-muted-foreground text-sm">No milestones yet.</li>
        )}
        {milestones.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-md border p-2">
            <Badge variant={STATUS_VARIANT[m.status] ?? "outline"}>{m.status}</Badge>
            <div className="flex-1">
              <div className="text-sm font-medium">{m.name}</div>
              <div className="text-muted-foreground text-xs">{formatDate(m.date)}</div>
            </div>
            <Select value={m.status} onValueChange={(v) => setStatus(m.id, v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${m.name}`} onClick={() => remove(m.id)}>
              <Trash2Icon className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input placeholder="New milestone…" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DatePicker value={date} onChange={setDate} placeholder="Date (optional)" className="w-44" />
        <Button onClick={addMilestone} disabled={busy || !name.trim()}>
          <PlusIcon /> Add
        </Button>
      </div>
    </div>
  );
}
