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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDownload, IconChevronDown } from "@tabler/icons-react";

import { TableContent } from "./table-content";
import { TablePagination } from "./table-pagination";
import { FilterField, TableFilters } from "./table-filters";
import { globalFilterFn, updateFilterState } from "./utils"; // Import from utils

interface DataTableProps<TData extends InventoryFormValues> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  loading?: boolean;
  filterableFields?: FilterField[];
  /** Callback invoked after a row is updated */
  onRowUpdate?: (updated: TData) => void;
  /** Whether to show export functionality */
  showExport?: boolean;
}

export function DataTable<TData extends InventoryFormValues>({
  data,
  columns,
  loading = false,
  filterableFields,
  onRowUpdate,
  showExport = true,
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

  const handleExport = (format: 'csv' | 'xlsx' | 'txt') => {
    // TODO: Implement actual export functionality
    console.log(`Exporting as ${format}...`);
    // You can access the filtered data with: table.getFilteredRowModel().rows.map(row => row.original)
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

  const exportActions = showExport ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconDownload className="mr-2 h-4 w-4" />
          Export
          <IconChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('txt')}>
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="relative flex flex-col gap-4 overflow-auto">
        <TableContent table={table} columns={columns} loading={loading} onRowUpdate={onRowUpdate} />
        <TablePagination table={table} actions={exportActions}>
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
