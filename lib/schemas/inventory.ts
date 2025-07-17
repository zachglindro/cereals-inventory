import { z } from "zod";

// Shared options for inventory form
export const typeOptions = [
  "white",
  "yellow",
  "sorghum",
  "special maize",
] as const;
export const areaPlantedOptions = ["LBTR", "LBPD", "CMU"] as const;
export const seasonOptions = ["wet", "dry"] as const;

// Zod schema for the inventory form
export const inventoryFormSchema = z.object({
  type: z.enum(typeOptions),
  area_planted: z.enum(areaPlantedOptions),
  year: z.string().min(1, "Required"),
  season: z.enum(seasonOptions),
  box_number: z.number().int().gte(0, { message: "Required" }),
  location: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  pedigree: z.string().min(1, "Required"),
  weight: z.number().gte(0, { message: "Required" }),
  remarks: z.string().optional(),
  id: z.string().optional(),
  addedAt: z
    .object({
      seconds: z.number(),
      nanoseconds: z.number(),
    })
    .optional(),
  addedBy: z.string().optional(),
  creatorId: z.string().optional(),
});

// Type alias for form values
export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
