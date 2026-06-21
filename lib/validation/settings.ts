import { z } from "zod";
import { BADGE_VARIANTS } from "@/lib/activity-status";

// --- Regions ---
export const createRegionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100)
});
export type CreateRegionInput = z.infer<typeof createRegionSchema>;

export const updateRegionSchema = z.object({
  name: z.string().trim().min(1).max(100)
});
export type UpdateRegionInput = z.infer<typeof updateRegionSchema>;

// --- Activity types ---
export const createActivityTypeSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(100)
});
export type CreateActivityTypeInput = z.infer<typeof createActivityTypeSchema>;

export const updateActivityTypeSchema = z.object({
  label: z.string().trim().min(1).max(100)
});
export type UpdateActivityTypeInput = z.infer<typeof updateActivityTypeSchema>;

// --- Status overlay (label + colour only; keys/math stay in code) ---
export const updateStatusOverrideSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60),
  badgeVariant: z.enum(BADGE_VARIANTS)
});
export type UpdateStatusOverrideInput = z.infer<typeof updateStatusOverrideSchema>;
