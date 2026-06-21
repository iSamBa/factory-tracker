"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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

export interface FactoryRow {
  id: string;
  name: string;
  region: string;
  country: string;
  lineCount: number;
}

const EMPTY = { name: "", region: "", country: "" };

export function FactoriesPanel({
  factories,
  regionNames
}: {
  factories: FactoryRow[];
  regionNames: string[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState({ ...EMPTY, region: regionNames[0] ?? "" });
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<FactoryRow | null>(null);

  async function add() {
    if (!draft.name.trim() || !draft.region || !draft.country.trim()) return;
    setBusy(true);
    const res = await fetch("/api/factories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    setBusy(false);
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to add factory");
      return;
    }
    setDraft({ ...EMPTY, region: regionNames[0] ?? "" });
    toast.success("Factory added");
    router.refresh();
  }

  async function remove(row: FactoryRow) {
    const res = await fetch(`/api/factories/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to delete factory");
      return;
    }
    toast.success("Factory deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_10rem_1fr_auto] sm:items-end">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Nuremberg" />
        </div>
        <div className="space-y-1">
          <Label>Region</Label>
          <Select value={draft.region} onValueChange={(v) => setDraft((d) => ({ ...d, region: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {regionNames.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Country</Label>
          <Input value={draft.country} onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))} placeholder="e.g. Germany" />
        </div>
        <Button onClick={add} disabled={busy || !draft.name.trim() || !draft.region || !draft.country.trim()}>
          <PlusIcon /> Add
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-20 text-center">
                  No factories yet.
                </TableCell>
              </TableRow>
            ) : (
              factories.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{f.region}</TableCell>
                  <TableCell>{f.country}</TableCell>
                  <TableCell className="text-right tabular-nums">{f.lineCount}</TableCell>
                  <TableCell className="space-x-1 whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${f.name}`} onClick={() => setEditing(f)}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <DeleteFactoryButton factory={f} onConfirm={() => remove(f)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditFactoryDialog
        factory={editing}
        regionNames={regionNames}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function DeleteFactoryButton({ factory, onConfirm }: { factory: FactoryRow; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${factory.name}`}>
          <Trash2Icon className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {factory.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {factory.lineCount > 0
              ? `This will also delete ${factory.lineCount} tracking line(s) across activities. This cannot be undone.`
              : "This cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditFactoryDialog({
  factory,
  regionNames,
  onClose,
  onSaved
}: {
  factory: FactoryRow | null;
  regionNames: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={!!factory} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* key resets the form's internal state each time a new factory opens */}
        {factory && (
          <EditFactoryForm key={factory.id} factory={factory} regionNames={regionNames} onSaved={onSaved} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditFactoryForm({
  factory,
  regionNames,
  onSaved
}: {
  factory: FactoryRow;
  regionNames: string[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: factory.name,
    region: factory.region,
    country: factory.country
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/factories/${factory.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setBusy(false);
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to update factory");
      return;
    }
    toast.success("Factory updated");
    onSaved();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit factory</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Region</Label>
          <Select value={form.region} onValueChange={(v) => setForm((f) => ({ ...f, region: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regionNames.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Country</Label>
          <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={busy || !form.name.trim() || !form.region || !form.country.trim()}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  );
}
