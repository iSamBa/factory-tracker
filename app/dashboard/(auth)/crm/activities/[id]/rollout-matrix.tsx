"use client";

import { useMemo, useState } from "react";
import { PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ACTIVITY_STATUSES } from "@/lib/activity-status";
import { formatDate } from "@/lib/format";
import { useStatusDisplay } from "@/components/status-display-provider";
import { StatusBadge } from "../../components/status-badge";
import { UpdateLineDialog } from "./update-line-dialog";

export interface MatrixLine {
  id: string;
  factoryName: string;
  region: string;
  country: string;
  inScope: string;
  status: string;
  progress: number;
  responsibles: string[];
  blockerFlag: boolean;
  dueDate: string | null;
  nextAction: string | null;
  comment: string | null;
  currentPhase: string | null;
  lastUpdate: string;
  overdue: boolean;
}

interface Filters {
  region: string;
  country: string;
  status: string;
  blocker: string;
  responsible: string;
  minProgress: string;
  maxProgress: string;
  overdueOnly: boolean;
}

function lineMatchesFilters(line: MatrixLine, f: Filters): boolean {
  const min = f.minProgress === "" ? 0 : Number(f.minProgress);
  const max = f.maxProgress === "" ? 100 : Number(f.maxProgress);
  const q = f.responsible.trim().toLowerCase();
  const checks = [
    f.region === "all" || line.region === f.region,
    f.country === "all" || line.country === f.country,
    f.status === "all" || line.status === f.status,
    f.blocker !== "blocked" || line.blockerFlag,
    f.blocker !== "clear" || !line.blockerFlag,
    !f.overdueOnly || line.overdue,
    !q || line.responsibles.some((name) => name.toLowerCase().includes(q)),
    line.progress >= min && line.progress <= max
  ];
  return checks.every(Boolean);
}

function MatrixRow({ line, onEdit }: { line: MatrixLine; onEdit: (line: MatrixLine) => void }) {
  return (
    <TableRow className={line.overdue ? "bg-red-50 dark:bg-red-950/30" : ""}>
      <TableCell>
        <div className="font-medium">{line.factoryName}</div>
        <div className="text-muted-foreground text-xs">{line.country}</div>
      </TableCell>
      <TableCell>{line.region}</TableCell>
      <TableCell>
        {line.inScope === "No" ? <span className="text-muted-foreground">No</span> : line.inScope}
      </TableCell>
      <TableCell className="space-x-1 whitespace-nowrap">
        <StatusBadge status={line.status} />
        {line.blockerFlag && <Badge variant="destructive">Blocked</Badge>}
        {line.overdue && <Badge variant="warning">Overdue</Badge>}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={line.progress} className="h-2 w-16" />
          <span className="text-muted-foreground text-xs tabular-nums">{line.progress}%</span>
        </div>
      </TableCell>
      <TableCell>
        {line.responsibles.length === 0 ? (
          "—"
        ) : (
          <div className="flex flex-wrap gap-1">
            {line.responsibles.map((name) => (
              <Badge key={name} variant="secondary" className="font-normal">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </TableCell>
      <TableCell>{formatDate(line.dueDate)}</TableCell>
      <TableCell className="max-w-40 truncate">{line.nextAction ?? "—"}</TableCell>
      <TableCell>
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${line.factoryName}`} onClick={() => onEdit(line)}>
          <PencilIcon className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MatrixToolbar({
  filters,
  set,
  regions,
  countries
}: {
  filters: Filters;
  set: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  regions: string[];
  countries: string[];
}) {
  const statusDisplay = useStatusDisplay();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <FilterSelect label="Region" value={filters.region} onChange={(v) => set("region", v)} options={regions.map((r) => ({ value: r, label: r }))} />
      <FilterSelect label="Country" value={filters.country} onChange={(v) => set("country", v)} options={countries.map((c) => ({ value: c, label: c }))} />
      <FilterSelect
        label="Status"
        value={filters.status}
        onChange={(v) => set("status", v)}
        options={ACTIVITY_STATUSES.map((s) => ({ value: s, label: statusDisplay[s]?.label ?? s }))}
      />
      <FilterSelect
        label="Blocker"
        value={filters.blocker}
        onChange={(v) => set("blocker", v)}
        options={[
          { value: "blocked", label: "Blocked" },
          { value: "clear", label: "Not blocked" }
        ]}
      />
      <div className="space-y-1">
        <span className="text-muted-foreground text-xs">Responsible</span>
        <Input value={filters.responsible} onChange={(e) => set("responsible", e.target.value)} className="w-40" placeholder="Search…" />
      </div>
      <div className="space-y-1">
        <span className="text-muted-foreground text-xs">Progress %</span>
        <div className="flex items-center gap-1">
          <Input type="number" min={0} max={100} value={filters.minProgress} onChange={(e) => set("minProgress", e.target.value)} className="w-16" placeholder="min" />
          <span className="text-muted-foreground">–</span>
          <Input type="number" min={0} max={100} value={filters.maxProgress} onChange={(e) => set("maxProgress", e.target.value)} className="w-16" placeholder="max" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={filters.overdueOnly} onCheckedChange={(c) => set("overdueOnly", !!c)} />
        Overdue only
      </label>
    </div>
  );
}

const INITIAL_FILTERS: Filters = {
  region: "all",
  country: "all",
  status: "all",
  blocker: "all",
  responsible: "",
  minProgress: "",
  maxProgress: "",
  overdueOnly: false
};

export function RolloutMatrix({ activityId, lines }: { activityId: string; lines: MatrixLine[] }) {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selected, setSelected] = useState<MatrixLine | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const regions = useMemo(() => Array.from(new Set(lines.map((l) => l.region))).sort(), [lines]);
  const countries = useMemo(() => Array.from(new Set(lines.map((l) => l.country))).sort(), [lines]);
  const filtered = useMemo(() => lines.filter((l) => lineMatchesFilters(l, filters)), [lines, filters]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const openEditor = (line: MatrixLine) => {
    setSelected(line);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <MatrixToolbar filters={filters} set={set} regions={regions} countries={countries} />

      <div className="text-muted-foreground text-xs">
        Showing {filtered.length} of {lines.length} factories
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factory</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>In scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Responsible</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Next action</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground h-24 text-center">
                  No factories match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((line) => <MatrixRow key={line.id} line={line} onEdit={openEditor} />)
            )}
          </TableBody>
        </Table>
      </div>

      <UpdateLineDialog activityId={activityId} line={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
