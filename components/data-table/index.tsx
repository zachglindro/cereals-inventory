// components/data-table/index.tsx
"use client";

import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { FilterState, FilterValue } from "@/components/filter";
import { InventoryFormValues } from "@/lib/schemas/inventory"; // Assuming this type is needed for filter fields

import { TableContent } from "./table-content";
import { TablePagination } from "./table-pagination";
import { FilterField, TableFilters } from "./table-filters";
import { globalFilterFn, updateFilterState } from "./utils"; // Import from utils

interface DataTableProps<TData extends InventoryFormValues> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  loading?: boolean;
  filterableFields?: FilterField[];
}

export function DataTable<TData extends InventoryFormValues>({
  data,
  columns,
  loading = false,
  filterableFields,
}: DataTableProps<TData>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterState, setFilterState] = useState<FilterState>({});

  const handleFilterChange = (fieldName: string, value: FilterValue | null) => {
    setFilterState((prev) => updateFilterState(prev, fieldName, value));
  };

  const handleClearAllFilters = () => {
    setFilterState({});
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      sorting,
      globalFilter: filterState, // Pass filterState as globalFilter
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getRowId: (_row, index) => index.toString(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn, // Use the extracted globalFilterFn
  });

  const showFilters = filterableFields && filterableFields.length > 0;

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="relative flex flex-col gap-4 overflow-auto">
        <TableContent table={table} columns={columns} loading={loading} />
        <TablePagination table={table}>
          {showFilters && (
            <TableFilters
              filterState={filterState}
              onFilterChange={handleFilterChange}
              onClearAllFilters={handleClearAllFilters}
              data={data}
              filterFields={filterableFields!}
            />
          )}
        </TablePagination>
      </div>
    </div>
  );
}
