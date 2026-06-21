"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { SCOPE_RULES } from "@/lib/activity-status";
import { createActivitySchema, type CreateActivityInput } from "@/lib/validation/activity";

export interface FactoryOption {
  id: string;
  name: string;
  region: string;
  country: string;
}

export interface TypeOption {
  value: string;
  label: string;
}

const SCOPE_LABELS: Record<string, string> = {
  all: "All factories",
  regions: "Selected regions",
  countries: "Selected countries",
  factories: "Specific factories"
};

export function ActivityForm({
  factories,
  types,
  regions
}: {
  factories: FactoryOption[];
  types: TypeOption[];
  regions: string[];
}) {
  const router = useRouter();
  const countries = Array.from(new Set(factories.map((f) => f.country))).sort();

  const form = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      name: "",
      type: types[0]?.value ?? "",
      description: "",
      globalOwner: "",
      startDate: "",
      targetEndDate: "",
      scope: { rule: "all", regions: [], countries: [], factoryIds: [] }
    }
  });

  const scopeRule = form.watch("scope.rule");

  async function onSubmit(values: CreateActivityInput) {
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to create activity");
      return;
    }
    const { activity } = await res.json();
    toast.success(`Created ${activity.activityId} with ${activity.lines.length} tracking line(s)`);
    router.push(`/dashboard/crm/activities/${activity.id}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Endpoint Security Rollout" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
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
          name="globalOwner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Global owner</FormLabel>
              <FormControl>
                <Input placeholder="Responsible person" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <DatePicker value={field.value ?? ""} onChange={field.onChange} placeholder="Start date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target end date</FormLabel>
                <FormControl>
                  <DatePicker value={field.value ?? ""} onChange={field.onChange} placeholder="Target end date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scope.rule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SCOPE_RULES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {SCOPE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>One tracking line is created per in-scope factory.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <ScopeSelector rule={scopeRule} form={form} factories={factories} countries={countries} regions={regions} />

        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating…" : "Create activity"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ScopeSelector({
  rule,
  form,
  factories,
  countries,
  regions
}: {
  rule: CreateActivityInput["scope"]["rule"];
  form: ReturnType<typeof useForm<CreateActivityInput>>;
  factories: FactoryOption[];
  countries: string[];
  regions: string[];
}) {
  if (rule === "all") {
    return <p className="text-muted-foreground text-sm">All {factories.length} factories will be tracked.</p>;
  }
  if (rule === "regions") {
    return (
      <CheckboxGroup
        label="Regions"
        name="scope.regions"
        form={form}
        options={regions.map((r) => ({ value: r, label: r }))}
      />
    );
  }
  if (rule === "countries") {
    return (
      <CheckboxGroup
        label="Countries"
        name="scope.countries"
        form={form}
        options={countries.map((c) => ({ value: c, label: c }))}
      />
    );
  }
  return (
    <CheckboxGroup
      label="Factories"
      name="scope.factoryIds"
      form={form}
      options={factories.map((f) => ({ value: f.id, label: `${f.name} (${f.country})` }))}
    />
  );
}

function CheckboxGroup({
  label,
  name,
  form,
  options
}: {
  label: string;
  name: "scope.regions" | "scope.countries" | "scope.factoryIds";
  form: ReturnType<typeof useForm<CreateActivityInput>>;
  options: { value: string; label: string }[];
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selected = new Set((field.value as string[] | undefined) ?? []);
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-auto rounded-md border p-3 sm:grid-cols-2">
              {options.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.has(opt.value)}
                    onCheckedChange={(checked) => {
                      const next = new Set(selected);
                      if (checked) next.add(opt.value);
                      else next.delete(opt.value);
                      field.onChange(Array.from(next));
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
