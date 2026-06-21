"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export interface TypeRow {
  id: string;
  value: string;
  label: string;
}

export function ActivityTypesPanel({ types }: { types: TypeRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function add() {
    if (!draft.trim()) return;
    setBusy(true);
    const res = await fetch("/api/settings/activity-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: draft })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to add type");
      return;
    }
    setDraft("");
    toast.success("Activity type added");
    router.refresh();
  }

  async function saveEdit(id: string) {
    if (!editValue.trim()) return;
    const res = await fetch(`/api/settings/activity-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editValue })
    });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to rename type");
      return;
    }
    setEditId(null);
    toast.success("Activity type updated");
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/settings/activity-types/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to delete type");
      return;
    }
    toast.success("Activity type deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Used when creating an activity. A type still used by an activity can&apos;t be deleted.
      </p>

      <div className="flex items-end gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New type label…"
          className="max-w-xs"
        />
        <Button onClick={add} disabled={busy || !draft.trim()}>
          <PlusIcon /> Add
        </Button>
      </div>

      <ul className="divide-y rounded-md border">
        {types.length === 0 && <li className="text-muted-foreground p-3 text-sm">No activity types yet.</li>}
        {types.map((t) => (
          <li key={t.id} className="flex items-center gap-2 p-2">
            {editId === t.id ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(t.id)}
                  className="max-w-xs"
                  autoFocus
                />
                <Button variant="ghost" size="icon-sm" aria-label="Save" onClick={() => saveEdit(t.id)}>
                  <CheckIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => setEditId(null)}>
                  <XIcon className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">
                  {t.label}
                  <span className="text-muted-foreground ml-2 font-mono text-xs">{t.value}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${t.label}`}
                  onClick={() => {
                    setEditId(t.id);
                    setEditValue(t.label);
                  }}>
                  <PencilIcon className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${t.label}`}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete type “{t.label}”?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(t.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
