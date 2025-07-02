"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { inventoryFormSchema } from "@/lib/schemas/inventory";
import { ColumnDef } from "@tanstack/react-table";
import { addDoc, collection } from "firebase/firestore";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import Papa from "papaparse";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function BulkAdd() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [tableColumns, setTableColumns] = useState<
    ColumnDef<Record<string, unknown>, unknown>[]
  >([]);
  const [importedFileName, setImportedFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [unrecognizedColumns, setUnrecognizedColumns] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<
    { rowIndex: number; errors: string[] }[]
  >([]);

  const expectedColumns = Object.keys(inventoryFormSchema.shape);

  const validateColumns = (headers: string[]) => {
    const missing = expectedColumns.filter((h) => !headers.includes(h));
    const unrecognized = headers.filter((h) => !expectedColumns.includes(h));
    setMissingColumns(missing);
    setUnrecognizedColumns(unrecognized);
  };

  const validateSchema = (records: Record<string, unknown>[]) => {
    const errors = records
      .map((row, idx) => {
        const parsed = inventoryFormSchema.safeParse(row);
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
              headers.forEach((h, i) => {
                const key = h || `Column ${i + 1}`;
                obj[key] = row[i];
              });
              return obj;
            });
            setData(records);
            validateColumns(headers);
            validateSchema(records);
          },
        });
      } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const bytes = evt.target?.result;
          if (bytes) {
            const wb = XLSX.read(bytes, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

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
                if (value !== undefined) {
                  obj[key] = value;
                }
              });
              return obj;
            });
            setData(records);
            validateColumns(headers);
            validateSchema(records);
          }
        };
        reader.readAsArrayBuffer(file);
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
        data.map((row) => addDoc(collection(db, "inventory"), row)),
      );

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
            <DataTable data={data} columns={tableColumns} />
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
