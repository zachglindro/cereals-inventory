"use client";

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  Table as RTTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Sub-component: TableContent ---
// Handles rendering the table header and body.
interface TableContentProps<TData> {
  table: RTTable<TData>;
  columnsToUse: ColumnDef<TData, unknown>[];
}

function TableContent<TData>({ table, columnsToUse }: TableContentProps<TData>) {
  return (
    <div className="rounded-lg border">
      <Table className="table-auto overflow-scroll">
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="relative z-0">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columnsToUse.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// --- Sub-component: TablePagination ---
// Handles rendering the pagination controls.
interface TablePaginationProps<TData> {
  table: RTTable<TData>;
}

function TablePagination<TData>({ table }: TablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-4">
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue
                placeholder={table.getState().pagination.pageSize}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <IconChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <IconChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <IconChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <IconChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Main DataTable Component ---
// Manages table state and orchestrates sub-components.
export function DataTable({
  data,
  columns: propColumns,
}: {
  data: Record<string, unknown>[];
  columns?: ColumnDef<Record<string, unknown>, unknown>[];
}) {
  // Dynamically generate columns from keys of the first row if no columns are provided
  const dynamicColumns =
    useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(() => {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]).map((key) => ({
        accessorKey: key,
        header: () =>
          key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        cell: (info) => info.getValue()?.toString() ?? "",
      }));
    }, [data]);

  // Use provided columns if present, else fallback to dynamicColumns
  const columnsToUse = propColumns ?? dynamicColumns;

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns: columnsToUse,
    state: { pagination },
    onPaginationChange: setPagination,
    getRowId: (_row, index) => index.toString(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <TableContent table={table} columnsToUse={columnsToUse} />
        <TablePagination table={table} />
      </div>
    </div>
  );
}