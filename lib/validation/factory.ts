import { z } from "zod";

export const createFactorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  region: z.string().trim().min(1, "Region is required").max(100),
  country: z.string().trim().min(1, "Country is required").max(100)
});

export type CreateFactoryInput = z.infer<typeof createFactorySchema>;

export const updateFactorySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    region: z.string().trim().min(1).max(100).optional(),
    country: z.string().trim().min(1).max(100).optional()
  })
  .refine((value) => Object.keys(value).length > 0, { message: "No fields to update" });

export type UpdateFactoryInput = z.infer<typeof updateFactorySchema>;
