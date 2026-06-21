"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { BADGE_VARIANTS, type BadgeVariant } from "@/lib/activity-status";

export interface StatusRow {
  status: string;
  label: string;
  badgeVariant: BadgeVariant;
  band: { min: number; max: number };
}

export function StatusesPanel({ statuses }: { statuses: StatusRow[] }) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Rename a status or change its badge colour. The status set, progress bands, and the
        progress maths are fixed in code and can&apos;t be edited here.
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Colour</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Progress band</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((s) => (
              <StatusRowEditor key={s.status} row={s} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusRowEditor({ row }: { row: StatusRow }) {
  const router = useRouter();
  const [label, setLabel] = useState(row.label);
  const [variant, setVariant] = useState<BadgeVariant>(row.badgeVariant);
  const [busy, setBusy] = useState(false);

  const dirty = label !== row.label || variant !== row.badgeVariant;

  async function save() {
    if (!label.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/settings/statuses/${row.status}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, badgeVariant: variant })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error ?? "Failed to save status");
      return;
    }
    toast.success("Status updated");
    router.refresh();
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{row.status}</TableCell>
      <TableCell>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 w-40" />
      </TableCell>
      <TableCell>
        <Select value={variant} onValueChange={(v) => setVariant(v as BadgeVariant)}>
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BADGE_VARIANTS.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Badge variant={variant}>{label || row.status}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {row.band.min}–{row.band.max}%
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="outline" onClick={save} disabled={busy || !dirty || !label.trim()}>
          {busy ? "…" : "Save"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
