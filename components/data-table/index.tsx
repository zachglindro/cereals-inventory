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
import * as XLSX from "xlsx";

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

  const handleExport = (
    format: "csv" | "xlsx" | "xlsx-per-box" | "xlsx-per-year",
  ) => {
    if (format === "csv") {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      if (filteredData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Build column info with both header and accessor key
      const columnInfo = columns.map((col) => ({
        header: (typeof col.header === "string"
          ? col.header
          : "accessorKey" in col && col.accessorKey
            ? (col.accessorKey as string)
            : col.id || "Unknown") as string,
        accessorKey: ("accessorKey" in col && col.accessorKey
          ? (col.accessorKey as string)
          : col.id || "unknown") as string,
      }));

      const csvHeaders = columnInfo.map((info) => info.header);
      const accessorKeys = columnInfo.map((info) => info.accessorKey);

      // Convert data to CSV format
      const csvContent = [
        csvHeaders.join(","), // Header row
        ...filteredData.map((row) =>
          accessorKeys
            .map((key) => {
              const value = (row as any)[key] ?? "";
              // Escape quotes and wrap in quotes if contains comma, quote, or newline
              const stringValue = String(value);
              if (
                stringValue.includes(",") ||
                stringValue.includes('"') ||
                stringValue.includes("\n")
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(","),
        ),
      ].join("\n");

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `inventory-export-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "xlsx") {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      if (filteredData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Build column info with both header and accessor key
      const columnInfo = columns.map((col) => ({
        header: (typeof col.header === "string"
          ? col.header
          : "accessorKey" in col && col.accessorKey
            ? (col.accessorKey as string)
            : col.id || "Unknown") as string,
        accessorKey: ("accessorKey" in col && col.accessorKey
          ? (col.accessorKey as string)
          : col.id || "unknown") as string,
      }));

      const accessorKeys = columnInfo.map((info) => info.accessorKey);

      // Convert data to format suitable for xlsx
      const worksheetData = [
        columnInfo.map((info) => info.header), // Header row
        ...filteredData.map((row) =>
          accessorKeys.map((key) => (row as any)[key] ?? ""),
        ),
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Auto-size columns
      const columnWidths = columnInfo.map((_, colIndex) => {
        const maxLength = Math.max(
          columnInfo[colIndex].header.length,
          ...filteredData.map(
            (row) => String((row as any)[accessorKeys[colIndex]] ?? "").length,
          ),
        );
        return { width: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      worksheet["!cols"] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

      // Generate and download the file
      const fileName = `inventory-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else if (format === "xlsx-per-box") {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      if (filteredData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Build column info with both header and accessor key
      const columnInfo = columns.map((col) => ({
        header: (typeof col.header === "string"
          ? col.header
          : "accessorKey" in col && col.accessorKey
            ? (col.accessorKey as string)
            : col.id || "Unknown") as string,
        accessorKey: ("accessorKey" in col && col.accessorKey
          ? (col.accessorKey as string)
          : col.id || "unknown") as string,
      }));

      const accessorKeys = columnInfo.map((info) => info.accessorKey);

      // Group data by box number
      const dataByBox = filteredData.reduce(
        (acc, row) => {
          const boxNumber = (row as any).box_number ?? "Unknown";
          if (!acc[boxNumber]) {
            acc[boxNumber] = [];
          }
          acc[boxNumber].push(row);
          return acc;
        },
        {} as Record<string | number, typeof filteredData>,
      );

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sort box numbers for consistent ordering
      const sortedBoxNumbers = Object.keys(dataByBox).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
      });

      // Create a worksheet for each box number
      sortedBoxNumbers.forEach((boxNumber) => {
        const boxData = dataByBox[boxNumber];

        // Convert data to format suitable for xlsx
        const worksheetData = [
          columnInfo.map((info) => info.header), // Header row
          ...boxData.map((row) =>
            accessorKeys.map((key) => (row as any)[key] ?? ""),
          ),
        ];

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Auto-size columns
        const columnWidths = columnInfo.map((_, colIndex) => {
          const maxLength = Math.max(
            columnInfo[colIndex].header.length,
            ...boxData.map(
              (row) =>
                String((row as any)[accessorKeys[colIndex]] ?? "").length,
            ),
          );
          return { width: Math.min(Math.max(maxLength + 2, 10), 50) };
        });
        worksheet["!cols"] = columnWidths;

        // Add worksheet to workbook with sanitized sheet name
        const sheetName = `Box ${boxNumber}`.substring(0, 31); // Excel sheet names max 31 chars
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Generate and download the file
      const fileName = `inventory-by-box-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else if (format === "xlsx-per-year") {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      if (filteredData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Build column info with both header and accessor key
      const columnInfo = columns.map((col) => ({
        header: (typeof col.header === "string"
          ? col.header
          : "accessorKey" in col && col.accessorKey
            ? (col.accessorKey as string)
            : col.id || "Unknown") as string,
        accessorKey: ("accessorKey" in col && col.accessorKey
          ? (col.accessorKey as string)
          : col.id || "unknown") as string,
      }));

      const accessorKeys = columnInfo.map((info) => info.accessorKey);

      // Group data by year
      const dataByYear = filteredData.reduce(
        (acc, row) => {
          const year = (row as any).year ?? "Unknown";
          if (!acc[year]) {
            acc[year] = [];
          }
          acc[year].push(row);
          return acc;
        },
        {} as Record<string | number, typeof filteredData>,
      );

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sort years for consistent ordering (most recent first)
      const sortedYears = Object.keys(dataByYear).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numB - numA; // Descending order (most recent first)
      });

      // Create a worksheet for each year
      sortedYears.forEach((year) => {
        const yearData = dataByYear[year];

        // Convert data to format suitable for xlsx
        const worksheetData = [
          columnInfo.map((info) => info.header), // Header row
          ...yearData.map((row) =>
            accessorKeys.map((key) => (row as any)[key] ?? ""),
          ),
        ];

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Auto-size columns
        const columnWidths = columnInfo.map((_, colIndex) => {
          const maxLength = Math.max(
            columnInfo[colIndex].header.length,
            ...yearData.map(
              (row) =>
                String((row as any)[accessorKeys[colIndex]] ?? "").length,
            ),
          );
          return { width: Math.min(Math.max(maxLength + 2, 10), 50) };
        });
        worksheet["!cols"] = columnWidths;

        // Add worksheet to workbook with sanitized sheet name
        const sheetName = `${year}`.substring(0, 31); // Excel sheet names max 31 chars
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Generate and download the file
      const fileName = `inventory-by-year-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    }
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
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx-per-box")}>
          Excel, per Box Number
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx-per-year")}>
          Excel, per Year
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="relative flex flex-col gap-4 overflow-auto">
        <TableContent
          table={table}
          columns={columns}
          loading={loading}
          onRowUpdate={onRowUpdate}
        />
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
