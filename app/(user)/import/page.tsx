"use client";

import { DataTable } from "@/components/data-table/index";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import {
  inventoryFormSchema,
  type InventoryFormValues,
} from "@/lib/schemas/inventory";
import { ColumnDef } from "@tanstack/react-table";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useUser } from "@/context/UserContext";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import Papa from "papaparse";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import * as ExcelJS from "exceljs";

export default function BulkAdd() {
  const { user } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<InventoryFormValues[]>([]);
  const [tableColumns, setTableColumns] = useState<
    ColumnDef<InventoryFormValues, unknown>[]
  >([]);
  const [importedFileName, setImportedFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [unrecognizedColumns, setUnrecognizedColumns] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<
    { rowIndex: number; errors: string[] }[]
  >([]);
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false);
  const [availableSheets, setAvailableSheets] = useState<
    { name: string; index: number }[]
  >([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Use a schema without the auto-generated id for import validation
  const importSchema = inventoryFormSchema.omit({ id: true });
  const expectedColumns = Object.keys(importSchema.shape);

  // Mapping from user-friendly column names to schema field names
  const columnMapping: Record<string, string> = {
    Type: "type",
    "Location Planted": "location_planted",
    "Year(s)": "year",
    Season: "season",
    "Box Number": "box_number",
    Location: "location",
    Description: "description",
    Pedigree: "pedigree",
    "Weight (kg)": "weight",
    Remarks: "remarks",
  };

  // Function to normalize column names
  const normalizeColumnName = (columnName: string): string => {
    return columnMapping[columnName] || columnName;
  };

  const validateColumns = (headers: string[]) => {
    const normalizedHeaders = headers.map(normalizeColumnName);
    const missing = expectedColumns.filter(
      (h) => !normalizedHeaders.includes(h),
    );
    const unrecognized = headers.filter(
      (h) => !expectedColumns.includes(normalizeColumnName(h)),
    );
    setMissingColumns(missing);
    setUnrecognizedColumns(unrecognized);
  };

  const validateSchema = (records: Record<string, unknown>[]) => {
    const errors = records
      .map((row, idx) => {
        const parsed = importSchema.safeParse(row);
        if (!parsed.success) {
          return {
            rowIndex: idx,
            errors: parsed.error.errors.map(
              (e) => `${e.path.join(".")}: ${e.message}`,
            ),
          };
        }
        return null;
      })
      .filter((e) => e) as { rowIndex: number; errors: string[] }[];
    setRowErrors(errors);
  };

  const processExcelSheet = (worksheet: ExcelJS.Worksheet) => {
    const rows: unknown[][] = [];
    worksheet.eachRow((row) => {
      const values = (row.values as unknown[]).slice(1);
      rows.push(values);
    });

    const headers = rows[0] as string[];
    setTableColumns(
      headers.map((h, index) => {
        const originalKey = h || `Column ${index + 1}`;
        const normalizedKey = normalizeColumnName(originalKey);
        return {
          id: originalKey,
          accessorKey: normalizedKey,
          header: originalKey,
          enableSorting: true,
        };
      }),
    );

    const records = rows.slice(1).map((row) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const originalKey = h || `Column ${i + 1}`;
        const normalizedKey = normalizeColumnName(originalKey);
        const value = row[i as number];
        if (normalizedKey === "year") {
          obj[normalizedKey] = String(value);
        } else if (value !== undefined) {
          obj[normalizedKey] = value;
        }
      });
      return obj;
    });
    setData(records as InventoryFormValues[]);
    validateColumns(headers);
    validateSchema(records);
  };

  const handleSheetSelection = async (sheetIndex: number) => {
    if (!selectedFile) return;

    const buffer = await selectedFile.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[sheetIndex];

    processExcelSheet(worksheet);
    setIsSheetDialogOpen(false);
    setSelectedFile(null);
  };

  const handleImportClick = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    // Reset all state
    setData([]);
    setTableColumns([]);
    setImportedFileName("");
    setMissingColumns([]);
    setUnrecognizedColumns([]);
    setRowErrors([]);
    setIsSheetDialogOpen(false);
    setAvailableSheets([]);
    setSelectedFile(null);

    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      setImportedFileName(file.name);

      if (fileName.endsWith(".csv")) {
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as unknown[][];
            const headers = rows[0] as string[];
            setTableColumns(
              headers.map((h, index) => {
                const originalKey = h || `Column ${index + 1}`;
                const normalizedKey = normalizeColumnName(originalKey);
                return {
                  id: originalKey,
                  accessorKey: normalizedKey,
                  header: originalKey,
                  enableSorting: true,
                };
              }),
            );

            const records = rows.slice(1).map((row) => {
              const obj: Record<string, unknown> = {};
              headers.forEach((h, index) => {
                const originalKey = h || `Column ${index + 1}`;
                const normalizedKey = normalizeColumnName(originalKey);
                let value = row[index];
                if (normalizedKey === "box_number") {
                  const parsed = parseInt(String(value), 10);
                  value = isNaN(parsed) ? value : parsed;
                } else if (normalizedKey === "weight") {
                  const parsed = parseFloat(String(value));
                  value = isNaN(parsed) ? value : parsed;
                }
                obj[normalizedKey] = value;
              });
              return obj;
            });
            setData(records as InventoryFormValues[]);
            validateColumns(headers);
            validateSchema(records);
          },
        });
      } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
        file.arrayBuffer().then(async (buffer) => {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);

          // Check if there are multiple sheets
          if (workbook.worksheets.length > 1) {
            const sheets = workbook.worksheets.map((sheet, index) => ({
              name: sheet.name,
              index: index,
            }));
            setAvailableSheets(sheets);
            setSelectedFile(file);
            setIsSheetDialogOpen(true);
          } else {
            // Process the single sheet directly
            processExcelSheet(workbook.worksheets[0]);
          }
        });
      } else {
        toast.error(`${file.name} is not a recognized file type.`);
        setData([]);
        setTableColumns([]);
        setMissingColumns([]);
        setUnrecognizedColumns([]);
        setImportedFileName("");
        setRowErrors([]);
        setIsSheetDialogOpen(false);
        setAvailableSheets([]);
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        data.map((row) =>
          addDoc(collection(db, "inventory"), {
            ...row,
            creatorId: user?.uid,
          }),
        ),
      );

      // Add activity log entry
      await addDoc(collection(db, "activity"), {
        message: `Bulk imported ${data.length} inventory items from ${importedFileName}`,
        loggedAt: serverTimestamp(),
        loggedBy: user?.email || "unknown",
      });

      setData([]);
      setTableColumns([]);
      setImportedFileName("");
      setIsSheetDialogOpen(false);
      setAvailableSheets([]);
      setSelectedFile(null);
      toast.success("Data successfully imported!");
    } catch (error) {
      console.error("Error adding documents: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Generate Template handler
  const handleGenerateTemplate = () => {
    const headers = [
      "Type",
      "Location Planted",
      "Year(s)",
      "Season",
      "Box Number",
      "Location",
      "Description",
      "Pedigree",
      "Weight (kg)",
      "Remarks",
    ];
    const sampleData = [
      "white",
      "LBPD",
      "2025",
      "wet",
      1,
      "A1 East",
      "Sample description",
      "Sample pedigree",
      1.23,
      "",
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template");
    worksheet.addRow(headers);
    worksheet.addRow(sampleData);
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inventory_template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Dialog open={isSheetDialogOpen} onOpenChange={setIsSheetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Sheet to Import</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-600">
              This Excel file contains multiple sheets. Please select which
              sheet you want to import:
            </p>
            <div className="grid gap-2">
              {availableSheets.map((sheet) => (
                <Button
                  key={sheet.index}
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleSheetSelection(sheet.index)}
                >
                  {sheet.name}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="w-full flex-1 flex flex-col items-center justify-center p-8">
        <Button variant="outline" onClick={handleImportClick}>
          <FileSpreadsheet />
          Import
        </Button>
        <Button
          variant="outline"
          className="mt-2"
          onClick={handleGenerateTemplate}
        >
          Generate Template
        </Button>
        {!importedFileName && (
          <div className="mt-2 text-sm text-gray-600">
            Import data from a spreadsheet file
          </div>
        )}
        {importedFileName && (
          <div className="mt-2 text-sm text-gray-600">
            Imported {importedFileName}
          </div>
        )}
        {tableColumns.length > 0 && (
          <div className="mt-4 w-full">
            <DataTable data={data} columns={tableColumns} showExport={false} />
          </div>
        )}
        {missingColumns.length > 0 && (
          <div className="mt-2 text-sm text-red-600 text-center">
            Missing columns: {missingColumns.join(", ")}.
            <br />
            Please add these columns to your spreadsheet.
          </div>
        )}
        {unrecognizedColumns.length > 0 && (
          <div className="mt-1 text-sm text-red-600 text-center">
            Unrecognized columns: {unrecognizedColumns.join(", ")}.
            <br />
            These columns will not be imported into the database.
          </div>
        )}
        {missingColumns.length === 0 &&
          unrecognizedColumns.length === 0 &&
          rowErrors.length > 0 && (
            <div className="mt-2 text-sm text-red-600 text-center">
              {rowErrors.map((err) => (
                <div key={err.rowIndex}>
                  Row {err.rowIndex + 2} errors: {err.errors.join(", ")}
                </div>
              ))}
            </div>
          )}
        {tableColumns.length > 0 && (
          <Button
            variant="default"
            className="mt-6"
            onClick={handleSubmit}
            disabled={
              isSubmitting || missingColumns.length > 0 || rowErrors.length > 0
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        )}
      </main>
    </>
  );
}
