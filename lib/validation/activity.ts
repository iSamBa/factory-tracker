import { z } from "zod";
import { SCOPE_RULES } from "@/lib/activity-status";

// Scope selection: the rule plus the parameters it needs. Validated as a
// discriminated-ish union via superRefine so the right field is required.
// Not exported — consumers use `ScopeInput` (its inferred type) and the parent
// `createActivitySchema`.
const scopeSchema = z
  .object({
    rule: z.enum(SCOPE_RULES),
    regions: z.array(z.string().min(1)).optional(),
    countries: z.array(z.string().min(1)).optional(),
    factoryIds: z.array(z.string().min(1)).optional()
  })
  .superRefine((value, ctx) => {
    if (value.rule === "regions" && (!value.regions || value.regions.length === 0)) {
      ctx.addIssue({ code: "custom", message: "Select at least one region", path: ["regions"] });
    }
    if (value.rule === "countries" && (!value.countries || value.countries.length === 0)) {
      ctx.addIssue({ code: "custom", message: "Select at least one country", path: ["countries"] });
    }
    if (value.rule === "factories" && (!value.factoryIds || value.factoryIds.length === 0)) {
      ctx.addIssue({ code: "custom", message: "Select at least one factory", path: ["factoryIds"] });
    }
  });

export type ScopeInput = z.infer<typeof scopeSchema>;

// Accepts ISO datetimes, plain YYYY-MM-DD (from <input type="date">), or "" (an
// empty date field). Empty/absent values become null server-side via toDate().
const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date"))
  .or(z.literal(""))
  .optional()
  .nullable();

export const createActivitySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.string().min(1, "Type is required").max(100),
  description: z.string().max(2000).optional().nullable(),
  globalOwner: z.string().max(200).optional().nullable(),
  startDate: isoDate,
  targetEndDate: isoDate,
  scope: scopeSchema
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

// Metadata-only edits; scope is fixed once lines are generated.
export const updateActivitySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    type: z.string().min(1).max(100).optional(),
    description: z.string().max(2000).optional().nullable(),
    globalOwner: z.string().max(200).optional().nullable(),
    startDate: isoDate,
    targetEndDate: isoDate,
    overallStatus: z.string().max(50).optional().nullable()
  })
  .refine((value) => Object.keys(value).length > 0, { message: "No fields to update" });

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export const activityActionSchema = z.object({
  action: z.enum(["archive", "unarchive", "complete"])
});
