"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
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

  const handleImportClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportedFileName(file.name);
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as unknown[][];
            const headers = rows[0] as string[];
            setTableColumns(
              headers.map((h) => ({ accessorKey: h, header: h }))
            );

            const records = rows.slice(1).map((row) => {
              const obj: Record<string, unknown> = {};
              headers.forEach((h, i) => {
                obj[h] = row[i];
              });
              return obj;
            });
            setData(records);
          },
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const bytes = evt.target?.result;
        if (bytes) {
          const wb = XLSX.read(bytes, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

          const headers = rows[0] as string[];
          setTableColumns(headers.map((h) => ({ accessorKey: h, header: h })));

          const records = rows.slice(1).map((row) => {
            const obj: Record<string, unknown> = {};
            headers.forEach((h, i) => {
              obj[h] = row[i as number];
            });
            return obj;
          });
          setData(records);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        data.map((row) => addDoc(collection(db, "inventory"), row))
      );

      setData([]);
      setTableColumns([]);
      setImportedFileName("");
      toast("Data successfully imported!");
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
        {importedFileName && (
          <div className="mt-2 text-sm text-gray-600">
            Imported {importedFileName}
          </div>
        )}
        {tableColumns.length > 0 && (
          <div className="mt-4 w-full">
            <DataTable data={data} />
          </div>
        )}
        <Button
          variant="default"
          className="mt-6"
          onClick={handleSubmit}
          disabled={isSubmitting}
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
      </main>
    </>
  );
}
