"use client";

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  Table as RTTable,
  Row,
} from "@tanstack/react-table";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";  // for inline box number filter
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Funnel } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  FilterControl,
  type FilterState,
  type FilterValue,
} from "@/components/filter";
import { type InventoryFormValues } from "@/lib/schemas/inventory";

// --- Sub-component: TableContent ---
// Handles rendering the table header and body.
interface TableContentProps<TData> {
  table: RTTable<TData>;
  columns: ColumnDef<TData, unknown>[];
  loading?: boolean;
}

function TableContent<TData>({
  table,
  columns,
  loading,
}: TableContentProps<TData>) {
  return (
    <div className="rounded-lg border">
      <Table className="table-auto overflow-scroll">
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none hover:bg-muted-foreground/10 rounded p-1 -m-1"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {{
                              asc: <IconChevronUp className="h-4 w-4" />,
                              desc: <IconChevronDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <div className="flex flex-col">
                                <IconChevronUp className="h-3 w-3 opacity-40" />
                                <IconChevronDown className="h-3 w-3 opacity-40 -mt-1" />
                              </div>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
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
              <TableCell colSpan={columns.length} className="h-24 text-center">
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
// Handles pagination controls and filter trigger
interface TablePaginationProps<TData> {
  table: RTTable<TData>;
  enableFilters?: boolean;
  data?: TData[];
  filterState?: FilterState;
  onFilterChange?: (fieldName: string, value: FilterValue | null) => void;
  onClearAllFilters?: () => void;
}

function TablePagination<TData>({
  table,
  enableFilters = false,
  data = [],
  filterState = {},
  onFilterChange,
  onClearAllFilters,
}: TablePaginationProps<TData>) {
  const activeFiltersCount = Object.keys(filterState).length;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-8">
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
              <SelectValue placeholder={table.getState().pagination.pageSize} />
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
        <div className="flex items-center gap-2">
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
      {enableFilters && onFilterChange && (
        <div className="flex items-center space-x-2">
          {/* Inline box number input filter */}
          <Input
            type="number"
            placeholder="Box #"
            value={filterState["box_number"]?.numericValue ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              const num = parseFloat(val);
              if (val === "" || isNaN(num)) {
                onFilterChange!("box_number", null);
              } else {
                onFilterChange!("box_number", {
                  type: "numeric",
                  numericOperator: "=",
                  numericValue: num,
                });
              }
            }}
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Funnel className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Data</SheetTitle>
                <SheetDescription>
                  Set filters to narrow down the data shown in the table.
                </SheetDescription>
              </SheetHeader>
              <div className="overflow-y-auto">
                <FilterControl
                  label="Type"
                  fieldName="type"
                  filterState={filterState}
                  onFilterChange={onFilterChange}
                  data={data as InventoryFormValues[]}
                />
                <FilterControl
                  label="Location Planted"
                  fieldName="location_planted"
                  filterState={filterState}
                  onFilterChange={onFilterChange}
                  data={data as InventoryFormValues[]}
                />
                <FilterControl
                  label="Year"
                  fieldName="year"
                  filterState={filterState}
                  onFilterChange={onFilterChange}
                  data={data as InventoryFormValues[]}
                />
                <FilterControl
                  label="Season"
                  fieldName="season"
                  filterState={filterState}
                  onFilterChange={onFilterChange}
                  data={data as InventoryFormValues[]}
                />
                <FilterControl
                  label="Location"
                  fieldName="location"
                  filterState={filterState}
                  onFilterChange={onFilterChange}
                  data={data as InventoryFormValues[]}
                />
                <FilterControl
                  label="Description"
                  fieldName="description"
                  filterState={filterState}
                  onFilterChange={onFilterChange}
                  data={data as InventoryFormValues[]}
                />
                <FilterControl
                  label="Pedigree"
                  fieldName="pedigree"
                  filterState={filterState}
                  onFilterChange={onFilterChange}
                  data={data as InventoryFormValues[]}
                />
                <FilterControl
                  label="Weight (g)"
                  fieldName="weight"
                  filterState={filterState}
                  onFilterChange={onFilterChange}
                  data={data as InventoryFormValues[]}
                />
              </div>
              <SheetFooter>
                <Button variant="outline" onClick={onClearAllFilters}>
                  Clear All
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}

// --- Main DataTable Component ---
interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  loading?: boolean;
  enableFilters?: boolean;
}

export function DataTable<TData>({
  data,
  columns,
  loading = false,
  enableFilters = false,
}: DataTableProps<TData>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterState, setFilterState] = useState<FilterState>({});

  const globalFilterFn = (row: Row<TData>) => {
    for (const [fieldName, filter] of Object.entries(filterState)) {
      const cellValue = row.getValue(fieldName);

      if (filter.type === "multi" && filter.values) {
        if (!filter.values.includes(String(cellValue))) {
          return false;
        }
      } else if (
        filter.type === "numeric" &&
        filter.numericOperator &&
        filter.numericValue !== undefined
      ) {
        const numValue = Number(cellValue);
        const filterValue = filter.numericValue;

        switch (filter.numericOperator) {
          case ">":
            if (!(numValue > filterValue)) return false;
            break;
          case ">=":
            if (!(numValue >= filterValue)) return false;
            break;
          case "<=":
            if (!(numValue <= filterValue)) return false;
            break;
          case "=":
            if (numValue !== filterValue) return false;
            break;
          case "range":
            if (filter.numericValue2 !== undefined) {
              if (
                !(numValue >= filterValue && numValue <= filter.numericValue2)
              )
                return false;
            }
            break;
        }
      } else if (filter.type === "text" && filter.textValue) {
        if (
          !String(cellValue)
            .toLowerCase()
            .includes(filter.textValue.toLowerCase())
        ) {
          return false;
        }
      }
    }
    return true;
  };

  const handleFilterChange = (fieldName: string, value: FilterValue | null) => {
    setFilterState((prev) => {
      const newState = { ...prev };
      if (value === null) {
        delete newState[fieldName];
      } else {
        newState[fieldName] = value;
      }
      return newState;
    });
  };

  const handleClearAllFilters = () => {
    setFilterState({});
  };

  const table = useReactTable({
    data,
    columns: columns,
    state: {
      pagination,
      sorting,
      globalFilter: filterState,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getRowId: (_row, index) => index.toString(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn,
  });

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="relative flex flex-col gap-4 overflow-auto">
        <TableContent table={table} columns={columns} loading={loading} />
        <TablePagination
          table={table}
          enableFilters={enableFilters}
          data={data}
          filterState={filterState}
          onFilterChange={handleFilterChange}
          onClearAllFilters={handleClearAllFilters}
        />
      </div>
    </div>
  );
}
