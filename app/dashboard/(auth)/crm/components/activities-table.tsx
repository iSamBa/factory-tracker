"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ArrowUpDownIcon } from "lucide-react";
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
import { formatDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";
import type { ActivityLifecycle } from "@/lib/metrics";

export interface ActivityRow {
  id: string;
  activityId: string;
  name: string;
  type: string;
  lifecycle: ActivityLifecycle;
  overallStatus: string | null;
  overallProgress: number;
  inScopeCount: number;
  blockedCount: number;
  targetEndDate: string | null;
  lastUpdate: string | null;
}

function sortableHeader(label: string) {
  // eslint-disable-next-line react/display-name
  return ({ column }: { column: { toggleSorting: (d?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => (
    <Button
      variant="ghost"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      {label}
      <ArrowUpDownIcon className="ml-1 size-3.5" />
    </Button>
  );
}

const columns: ColumnDef<ActivityRow>[] = [
  {
    accessorKey: "name",
    header: sortableHeader("Activity"),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-muted-foreground text-xs">{row.original.activityId}</div>
      </div>
    )
  },
  { accessorKey: "type", header: "Type", cell: ({ getValue }) => <span className="capitalize">{String(getValue())}</span> },
  {
    accessorKey: "overallStatus",
    header: "Status",
    cell: ({ row }) =>
      row.original.overallStatus ? (
        <StatusBadge status={row.original.overallStatus} />
      ) : (
        <Badge variant="outline">{row.original.lifecycle}</Badge>
      )
  },
  {
    accessorKey: "overallProgress",
    header: sortableHeader("Progress"),
    cell: ({ getValue }) => {
      const value = Number(getValue());
      return (
        <div className="flex items-center gap-2">
          <Progress value={value} className="h-2 w-20" />
          <span className="text-muted-foreground text-xs tabular-nums">{value}%</span>
        </div>
      );
    }
  },
  { accessorKey: "inScopeCount", header: "In scope", cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span> },
  {
    accessorKey: "blockedCount",
    header: "Blocked",
    cell: ({ getValue }) => {
      const n = Number(getValue());
      return n > 0 ? <Badge variant="destructive">{n}</Badge> : <span className="text-muted-foreground">0</span>;
    }
  },
  { accessorKey: "targetEndDate", header: sortableHeader("Due"), cell: ({ getValue }) => formatDate(getValue() as string | null) },
  { accessorKey: "lastUpdate", header: "Last update", cell: ({ getValue }) => formatDate(getValue() as string | null) }
];

export function ActivitiesTable({ rows }: { rows: ActivityRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesText =
        !q || r.name.toLowerCase().includes(q) || r.activityId.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Active" || statusFilter === "Completed" || statusFilter === "Archived"
          ? r.lifecycle === statusFilter
          : r.overallStatus === statusFilter);
      return matchesText && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search activities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                  No activities yet. Create one to start tracking.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const open = () => router.push(`/dashboard/crm/activities/${row.original.id}`);
                return (
                <TableRow
                  key={row.id}
                  className="focus-visible:bg-muted/50 cursor-pointer outline-none"
                  role="link"
                  tabIndex={0}
                  aria-label={`Open ${row.original.name}`}
                  onClick={open}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open();
                    }
                  }}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
