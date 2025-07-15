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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table"; // Import ColumnDef here
import { useState } from "react";
import { db } from "@/lib/firebase";
import {
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  collection,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import {
  typeOptions,
  locationPlantedOptions,
  seasonOptions,
} from "@/lib/schemas/inventory";
import { useUser } from "@/context/UserContext";

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
        <TableCell
          colSpan={onRowUpdate ? columns.length + 1 : columns.length}
          className="h-24 text-center"
        >
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
              {onRowUpdate && <TableHead key="actions">Actions</TableHead>}
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [justEdited, setJustEdited] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { profile } = useUser();
  const handleChange = (key: string, value: any) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "inventory", String(editValues.id));
      await updateDoc(docRef, editValues);

      // Log activity after successful update
      if (profile) {
        // Compare original values with edited values to create a detailed message
        const changes: string[] = [];
        const originalData = row.original;

        Object.keys(editValues).forEach((key) => {
          if (key === "id") return; // Skip ID field

          const originalValue = originalData[key];
          const newValue = editValues[key];

          // Only log if the value actually changed
          if (originalValue !== newValue) {
            const fieldName = key
              .replace("_", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
            changes.push(`${fieldName}: "${originalValue}" → "${newValue}"`);
          }
        });

        const baseMessage = `Updated inventory item (Box ${editValues.box_number} - ${editValues.type})`;
        const changesMessage =
          changes.length > 0
            ? `. Changes: ${changes.join(", ")}`
            : ". No changes detected";

        await addDoc(collection(db, "activity"), {
          message: baseMessage + changesMessage,
          loggedAt: new Date(),
          loggedBy: profile.email,
        });
      }

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

  // Open confirmation dialog for delete
  const handleDelete = () => {
    setShowConfirmDelete(true);
  };
  // Perform confirmed deletion
  const handleConfirmedDelete = async () => {
    setIsDeleting(true);
    try {
      const docRef = doc(db, "inventory", String(editValues.id));
      await deleteDoc(docRef);
      toast.success("Inventory entry deleted!");
      setOpen(false);
      // Log deletion activity
      if (profile) {
        await addDoc(collection(db, "activity"), {
          message: `Deleted inventory entry:\n  • Box Number: ${editValues.box_number}\n  • Type: ${editValues.type}\n  • Location Planted: ${editValues.location_planted}\n  • Year: ${editValues.year}\n  • Season: ${editValues.season}\n  • Storage Location: ${editValues.location}\n  • Description: ${editValues.description}\n  • Pedigree: ${editValues.pedigree}\n  • Weight: ${editValues.weight} kg\n  • Remarks: ${editValues.remarks}`,
          loggedAt: new Date(),
          loggedBy: profile.email,
        });
      }
      // Notify parent to refresh data after delete, pass deleted row info
      onRowUpdate?.({ ...editValues, deleted: true } as TData);
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast.error("Error deleting inventory");
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  if (!onRowUpdate) {
    return (
      <TableRow>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  }
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <TableRow
          className={`relative z-0 transition-all ${justEdited ? "animate-pulse bg-green-100" : ""}`}
        >
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
        <DialogContent className="max-h-[70vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Edit Row</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-4">
            {[
              "box_number",
              "type",
              "location_planted",
              "year",
              "season",
              "location",
              "description",
              "pedigree",
              "weight",
              "remarks",
            ]
              .map((key) => {
                const value = editValues[key];
                if (key === "id") return null;

                // Render appropriate input based on field type
                if (key === "type") {
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium">Type</Label>
                      <Select
                        value={String(value)}
                        onValueChange={(newValue) =>
                          handleChange(key, newValue)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                if (key === "location_planted") {
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium">Location Planted</Label>
                      <Select
                        value={String(value)}
                        onValueChange={(newValue) =>
                          handleChange(key, newValue)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationPlantedOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                if (key === "season") {
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium">Season</Label>
                      <RadioGroup
                        value={String(value)}
                        onValueChange={(newValue) =>
                          handleChange(key, newValue)
                        }
                        className="flex flex-row space-x-4"
                      >
                        {seasonOptions.map((option) => (
                          <div
                            key={option}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={option}
                              id={`${key}-${option}`}
                            />
                            <Label
                              htmlFor={`${key}-${option}`}
                              className="capitalize"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  );
                }

                // For numeric fields, use number input
                if (key === "box_number" || key === "weight") {
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium capitalize">
                        {key.replace("_", " ")}
                      </Label>
                      <Input
                        type="number"
                        value={String(value)}
                        onChange={(e) =>
                          handleChange(key, parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  );
                }

                // Default to text input for other fields
                return (
                  <div key={key} className="flex flex-col space-y-2">
                    <Label className="font-medium capitalize">
                      {key.replace("_", " ")}
                    </Label>
                    <Input
                      value={String(value)}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
          <DialogFooter className="flex justify-between items-center">
            <div className="flex w-full items-center">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="mr-auto"
              >
                {isDeleting ? (
                  <>
                    <Spinner size="sm" /> Deleting
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
              <div className="flex space-x-2 ml-auto">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isDeleting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" /> Saving
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirmation dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmedDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" /> Deleting
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
