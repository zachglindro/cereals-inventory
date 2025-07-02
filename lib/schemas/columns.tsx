"use client";

import { InventoryFormValues } from "@/lib/schemas/inventory";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<InventoryFormValues>[] = [
  {
    id: "type",
    accessorKey: "type",
    header: "Type",
    enableSorting: true,
  },
  {
    id: "location_planted",
    accessorKey: "location_planted",
    header: "Location Planted",
    enableSorting: true,
  },
  {
    id: "year",
    accessorKey: "year",
    header: "Year(s)",
    enableSorting: true,
  },
  {
    id: "season",
    accessorKey: "season",
    header: "Season",
    enableSorting: true,
  },
  {
    id: "box_number",
    accessorKey: "box_number",
    header: "Box Number",
    enableSorting: true,
  },
  {
    id: "location",
    accessorKey: "location",
    header: "Location",
    enableSorting: true,
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    enableSorting: true,
  },
  {
    id: "pedigree",
    accessorKey: "pedigree",
    header: "Pedigree",
    enableSorting: true,
  },
  {
    id: "weight",
    accessorKey: "weight",
    header: "Weight (g)",
    enableSorting: true,
  },
  {
    id: "comment",
    accessorKey: "comment",
    header: "Comment",
    enableSorting: true,
  },
];
