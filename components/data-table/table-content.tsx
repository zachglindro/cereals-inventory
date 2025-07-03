// components/data-table/table-content.tsx
import { flexRender, Table as RTTable } from "@tanstack/react-table";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table"; // Import ColumnDef here

interface TableContentProps<TData> {
  table: RTTable<TData>;
  columns: ColumnDef<TData, unknown>[]; // Use ColumnDef from tanstack
  loading?: boolean;
}

export function TableContent<TData>({
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
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          canSort
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
                        {canSort && (
                          <span className="ml-1">
                            {isSorted === "asc" ? (
                              <IconChevronUp className="h-4 w-4" />
                            ) : isSorted === "desc" ? (
                              <IconChevronDown className="h-4 w-4" />
                            ) : (
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
              <Dialog key={row.id}>
                <DialogTrigger asChild>
                  <TableRow className="cursor-pointer relative z-0">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-lg font-medium">
                      Row Details
                    </DialogTitle>
                  </DialogHeader>
                  {/* Drawer body content */}
                  <div className="p-4 text-sm whitespace-pre-wrap">
                    <pre>{JSON.stringify(row.original, null, 2)}</pre>
                  </div>
                  <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
