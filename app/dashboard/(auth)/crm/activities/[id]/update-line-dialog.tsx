"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  ACTIVITY_STATUSES,
  ActivityStatus,
  IN_SCOPE_VALUES,
  defaultProgressFor,
  isValidStatus
} from "@/lib/activity-status";
import { updateLineSchema, type UpdateLineInput } from "@/lib/validation/line";
import { normalizeResponsibles } from "@/lib/responsibles";
import { useStatusDisplay } from "@/components/status-display-provider";
import type { MatrixLine } from "./rollout-matrix";

/**
 * Chip-style input for the free-text responsibles list: type a name and press
 * Enter or comma to add it; click a chip's × (or Backspace on empty) to remove.
 */
function ResponsiblesInput({
  value,
  onChange
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const next = normalizeResponsibles([...value, raw]);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  const remove = (name: string) => onChange(value.filter((n) => n !== name));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (draft.trim()) commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="border-input flex min-h-9 flex-wrap items-center gap-1 rounded-md border bg-transparent px-2 py-1">
      {value.map((name) => (
        <Badge key={name} variant="secondary" className="gap-1 font-normal">
          {name}
          <button
            type="button"
            aria-label={`Remove ${name}`}
            onClick={() => remove(name)}
            className="hover:text-foreground/70">
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={value.length === 0 ? "Add name…" : ""}
        className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  );
}

export function UpdateLineDialog({
  activityId,
  line,
  open,
  onOpenChange
}: {
  activityId: string;
  line: MatrixLine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const statusDisplay = useStatusDisplay();
  const form = useForm<UpdateLineInput>({ resolver: zodResolver(updateLineSchema) });
  const [history, setHistory] = useState<
    { id: string; field: string; oldValue: string | null; newValue: string | null; changedAt: string }[]
  >([]);

  useEffect(() => {
    if (open && line) {
      fetch(`/api/activities/${activityId}/lines/${line.id}`)
        .then((r) => (r.ok ? r.json() : { history: [] }))
        .then((d) => setHistory(d.history ?? []))
        .catch(() => setHistory([]));
    }
  }, [open, line, activityId]);

  useEffect(() => {
    if (line) {
      form.reset({
        status: isValidStatus(line.status) ? line.status : undefined,
        progress: line.progress,
        responsibles: line.responsibles ?? [],
        blockerFlag: line.blockerFlag,
        inScope: IN_SCOPE_VALUES.includes(line.inScope as never) ? (line.inScope as never) : "Yes",
        currentPhase: line.currentPhase ?? "",
        dueDate: line.dueDate ?? "",
        nextAction: line.nextAction ?? "",
        comment: line.comment ?? ""
      });
    }
  }, [line, form]);

  async function onSubmit(values: UpdateLineInput) {
    if (!line) return;
    const res = await fetch(`/api/activities/${activityId}/lines/${line.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to update line");
      return;
    }
    toast.success("Tracking line updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update {line?.factoryName}</DialogTitle>
          <DialogDescription>
            Changing status suggests a progress value; you can override it (Blocked allows any).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Suggest a band-appropriate progress, except for Blocked
                        // which may sit at any value (don't clobber the current %).
                        if (isValidStatus(value) && value !== ActivityStatus.Blocked) {
                          form.setValue("progress", defaultProgressFor(value));
                        }
                      }}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusDisplay[s]?.label ?? s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsibles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsibles</FormLabel>
                    <FormControl>
                      <ResponsiblesInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value ?? ""} onChange={field.onChange} placeholder="Due date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="inScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>In scope</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {IN_SCOPE_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="blockerFlag"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="mb-0">Blocked</FormLabel>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next action</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {history.length > 0 && (
          <div className="mt-2 border-t pt-3">
            <div className="text-muted-foreground mb-2 text-xs font-medium uppercase">Recent changes</div>
            <ul className="max-h-40 space-y-1 overflow-auto text-xs">
              {history.slice(0, 20).map((h) => (
                <li key={h.id} className="text-muted-foreground">
                  <span className="text-foreground font-medium">{h.field}</span>: {h.oldValue ?? "—"} →{" "}
                  {h.newValue ?? "—"}{" "}
                  <span className="opacity-60">({new Date(h.changedAt).toLocaleString()})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
