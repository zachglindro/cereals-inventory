"use client";

import { DataTable } from "@/components/data-table/index";
import { Button } from "@/components/ui/button";
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

  // Use a schema without the auto-generated id for import validation
  const importSchema = inventoryFormSchema.omit({ id: true });
  const expectedColumns = Object.keys(importSchema.shape);

  const validateColumns = (headers: string[]) => {
    const missing = expectedColumns.filter((h) => !headers.includes(h));
    const unrecognized = headers.filter((h) => !expectedColumns.includes(h));
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

  const handleImportClick = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
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
              headers.map((h, index) => ({
                id: h || `Column ${index + 1}`,
                accessorKey: h || `Column ${index + 1}`,
                header: h || `Column ${index + 1}`,
                enableSorting: true,
              })),
            );

            const records = rows.slice(1).map((row) => {
              const obj: Record<string, unknown> = {};
              headers.forEach((h, index) => {
                const key = h || `Column ${index + 1}`;
                let value = row[index];
                if (key === "box_number") {
                  const parsed = parseInt(String(value), 10);
                  value = isNaN(parsed) ? value : parsed;
                } else if (key === "weight") {
                  const parsed = parseFloat(String(value));
                  value = isNaN(parsed) ? value : parsed;
                }
                obj[key] = value;
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
          const worksheet = workbook.worksheets[0];
          const rows: unknown[][] = [];
          worksheet.eachRow((row) => {
            const values = (row.values as unknown[]).slice(1);
            rows.push(values);
          });

          const headers = rows[0] as string[];
          setTableColumns(
            headers.map((h, index) => ({
              id: h || `Column ${index + 1}`,
              accessorKey: h || `Column ${index + 1}`,
              header: h || `Column ${index + 1}`,
              enableSorting: true,
            })),
          );

          const records = rows.slice(1).map((row) => {
            const obj: Record<string, unknown> = {};
            headers.forEach((h, i) => {
              const key = h || `Column ${i + 1}`;
              const value = row[i as number];
              if (key === "year") {
                obj[key] = String(value);
              } else if (value !== undefined) {
                obj[key] = value;
              }
            });
            return obj;
          });
          setData(records as InventoryFormValues[]);
          validateColumns(headers);
          validateSchema(records);
        });
      } else {
        toast.error(`${file.name} is not a recognized file type.`);
        setData([]);
        setTableColumns([]);
        setMissingColumns([]);
        setUnrecognizedColumns([]);
        setImportedFileName("");
        setRowErrors([]);
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
      toast.success("Data successfully imported!");
    } catch (error) {
      console.error("Error adding documents: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Generate Template handler
  const handleGenerateTemplate = () => {
    const headers = expectedColumns;
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
