"use client";

import { InventoryFormValues } from "@/lib/schemas/inventory";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<InventoryFormValues>[] = [
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "location_planted",
    header: "Location Planted",
  },
  {
    accessorKey: "year",
    header: "Year",
  },
  {
    accessorKey: "season",
    header: "Season",
  },
  {
    accessorKey: "box_number",
    header: "Box Number",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "pedigree",
    header: "Pedigree",
  },
  {
    accessorKey: "weight",
    header: "Weight (g)",
  },
  {
    accessorKey: "year_harvested",
    header: "Year Harvested",
  },
  {
    accessorKey: "comment",
    header: "Comment",
  },
];
