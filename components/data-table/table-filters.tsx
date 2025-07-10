// components/data-table/table-filters.tsx
import { Funnel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterControl, FilterState, FilterValue } from "@/components/filter";
import { InventoryFormValues } from "@/lib/schemas/inventory";

export interface FilterField {
  label: string;
  fieldName: keyof InventoryFormValues;
}

interface TableFiltersProps {
  filterState: FilterState;
  onFilterChange: (fieldName: string, value: FilterValue | null) => void;
  onClearAllFilters: () => void;
  data: InventoryFormValues[];
  filterFields: FilterField[];
}

export function TableFilters({
  filterState,
  onFilterChange,
  onClearAllFilters,
  data,
  filterFields,
}: TableFiltersProps) {
  const activeFiltersCount = Object.keys(filterState).length;

  return (
    <div className="flex items-center space-x-2">
      {/* Inline box number input filter */}
      <Input
        type="number"
        placeholder="Box #"
        className="w-20 sm:w-28 md:w-36 lg:w-48 appearance-none [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [&::-moz-appearance-textfield]:appearance-none"
        value={filterState["box_number"]?.numericValue ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          const num = parseFloat(val);
          if (val === "" || isNaN(num)) {
            onFilterChange("box_number", null);
          } else {
            onFilterChange("box_number", {
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
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 hidden sm:inline bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader className="border-b">
            <SheetTitle>Filter Data</SheetTitle>
            <SheetDescription>
              Set filters to narrow down the data shown in the table.
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto">
            {filterFields.map((field) => (
              <FilterControl
                key={String(field.fieldName)}
                label={field.label}
                fieldName={field.fieldName}
                filterState={filterState}
                onFilterChange={onFilterChange}
                data={data}
              />
            ))}
          </div>
          <SheetFooter className="border-t">
            <Button variant="outline" onClick={onClearAllFilters}>
              Clear All
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}