import { z } from "zod";
import { ACTIVITY_STATUSES, IN_SCOPE_VALUES } from "@/lib/activity-status";
import { normalizeResponsibles } from "@/lib/responsibles";

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date"))
  .or(z.literal(""))
  .nullable();

// All fields optional — a partial update of one tracking line.
export const updateLineSchema = z
  .object({
    status: z.enum(ACTIVITY_STATUSES).optional(),
    progress: z.number().int().min(0).max(100).optional(),
    responsibles: z
      .array(z.string().trim().max(200))
      .max(50)
      .transform(normalizeResponsibles)
      .optional(),
    blockerFlag: z.boolean().optional(),
    inScope: z.enum(IN_SCOPE_VALUES).optional(),
    currentPhase: z.string().max(100).nullable().optional(),
    dueDate: isoDate.optional(),
    nextAction: z.string().max(1000).nullable().optional(),
    comment: z.string().max(2000).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, { message: "No fields to update" });

export type UpdateLineInput = z.infer<typeof updateLineSchema>;

export const createMilestoneSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  date: isoDate.optional(),
  status: z.enum(["Pending", "InProgress", "Done"]).default("Pending")
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    date: isoDate.optional(),
    status: z.enum(["Pending", "InProgress", "Done"]).optional()
  })
  .refine((value) => Object.keys(value).length > 0, { message: "No fields to update" });

export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
