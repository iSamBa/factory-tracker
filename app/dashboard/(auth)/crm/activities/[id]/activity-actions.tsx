"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ActivityActions({
  activityId,
  archived,
  completed
}: {
  activityId: string;
  archived: boolean;
  completed: boolean;
}) {
  const router = useRouter();

  async function act(action: "archive" | "unarchive" | "complete") {
    const res = await fetch(`/api/activities/${activityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Action failed");
      return;
    }
    toast.success(`Activity ${action}d`);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {!completed && (
        <Button variant="outline" onClick={() => act("complete")}>
          Mark completed
        </Button>
      )}
      <Button variant="outline" onClick={() => act(archived ? "unarchive" : "archive")}>
        {archived ? "Unarchive" : "Archive"}
      </Button>
    </div>
  );
}
