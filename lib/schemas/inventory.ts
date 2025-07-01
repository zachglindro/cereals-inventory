import { z } from "zod";

// Shared options for inventory form
export const typeOptions = [
  "white",
  "yellow",
  "sorghum",
  "special maize",
] as const;
export const locationPlantedOptions = ["LBTR", "LBPD", "CMU"] as const;
export const seasonOptions = ["wet", "dry"] as const;

// Zod schema for the inventory form
export const inventoryFormSchema = z.object({
  type: z.enum(typeOptions),
  location_planted: z.enum(locationPlantedOptions),
  year: z.number().int(),
  season: z.enum(seasonOptions),
  box_number: z.number().int().gte(0, { message: "Required" }),
  location: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  pedigree: z.string().min(1, "Required"),
  weight: z.number().gte(0, { message: "Required" }),
  year_harvested: z.number().int(),
  comment: z.string(),
  created_at: z.date(),
  created_by: z.string(),
  modified_at: z.date(),
  modified_by: z.string(),
});

// Type alias for form values
export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
