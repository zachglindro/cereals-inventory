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
import { useState } from "react";
import { db } from "@/lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";

interface TableContentProps<TData extends Record<string, unknown>> {
  table: RTTable<TData>;
  columns: ColumnDef<TData, unknown>[]; // Use ColumnDef from tanstack
  loading?: boolean;
  /** Callback invoked after a row is updated */
  onRowUpdate?: (updated: TData) => void;
}

export function TableContent<TData extends Record<string, unknown>>({
  table,
  columns,
  loading,
  onRowUpdate,
}: TableContentProps<TData>) {
  const renderRows =
    table.getRowModel().rows?.length > 0 ? (
      table
        .getRowModel()
        .rows.map((row) => (
          <RowDialog key={row.id} row={row} onRowUpdate={onRowUpdate} />
        ))
    ) : (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-24 text-center">
          No results.
        </TableCell>
      </TableRow>
    );

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
              <TableHead key="actions">Actions</TableHead>
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
          ) : (
            renderRows
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Component to handle row editing
function RowDialog<TData extends Record<string, any>>({
  row,
  onRowUpdate,
}: {
  row: Row<TData>;
  onRowUpdate?: (updated: TData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editValues, setEditValues] = useState({ ...row.original });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justEdited, setJustEdited] = useState(false);
  const handleChange = (key: string, value: any) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "inventory", String(editValues.id));
      await updateDoc(docRef, editValues);
      toast.success("Inventory updated successfully!");
      setOpen(false);
      setJustEdited(true);
      setTimeout(() => setJustEdited(false), 1200);
      onRowUpdate?.(editValues as TData);
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Error updating inventory");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TableRow className={`relative z-0 transition-all ${justEdited ? 'animate-pulse bg-green-100' : ''}`}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
        <TableCell>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </DialogTrigger>
        </TableCell>
      </TableRow>
      <DialogContent className="m-4 max-h-[70vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Edit Row</DialogTitle>
        </DialogHeader>
        <div className="text-sm space-y-2">
          {Object.entries(editValues).map(([key, value]) =>
            key === "id" ? null : (
              <div key={key} className="flex flex-col">
                <span className="font-medium">{key}</span>
                <Input
                  value={String(value)}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              </div>
            ),
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" /> Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
          <div className="justify-start">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
