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

export interface RegionRow {
  id: string;
  name: string;
}

export function RegionsPanel({ regions }: { regions: RegionRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function add() {
    if (!draft.trim()) return;
    setBusy(true);
    const res = await fetch("/api/settings/regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to add region");
      return;
    }
    setDraft("");
    toast.success("Region added");
    router.refresh();
  }

  async function saveEdit(id: string) {
    if (!editValue.trim()) return;
    const res = await fetch(`/api/settings/regions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editValue })
    });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to rename region");
      return;
    }
    setEditId(null);
    toast.success("Region renamed (factories updated)");
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/settings/regions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to delete region");
      return;
    }
    toast.success("Region deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Renaming a region updates every factory currently in it. A region in use can&apos;t be deleted.
      </p>

      <div className="flex items-end gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New region…"
          className="max-w-xs"
        />
        <Button onClick={add} disabled={busy || !draft.trim()}>
          <PlusIcon /> Add
        </Button>
      </div>

      <ul className="divide-y rounded-md border">
        {regions.length === 0 && <li className="text-muted-foreground p-3 text-sm">No regions yet.</li>}
        {regions.map((r) => (
          <li key={r.id} className="flex items-center gap-2 p-2">
            {editId === r.id ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(r.id)}
                  className="max-w-xs"
                  autoFocus
                />
                <Button variant="ghost" size="icon-sm" aria-label="Save" onClick={() => saveEdit(r.id)}>
                  <CheckIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => setEditId(null)}>
                  <XIcon className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{r.name}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${r.name}`}
                  onClick={() => {
                    setEditId(r.id);
                    setEditValue(r.name);
                  }}>
                  <PencilIcon className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${r.name}`}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete region “{r.name}”?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This only removes it from the list. Factories already using it keep their value.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(r.id)}>Delete</AlertDialogAction>
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
