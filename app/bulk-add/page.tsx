"use client";

import { DataTable } from "@/app/bulk-add/data-table";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";
import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

export default function BulkAdd() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [tableColumns, setTableColumns] = useState<
    ColumnDef<Record<string, unknown>, unknown>[]
  >([]);
  const [importedFileName, setImportedFileName] = useState<string>("");

  const [displayCount, setDisplayCount] = useState(10);
  useEffect(() => {
    setDisplayCount(10);
  }, [data]);
  const displayedData = data.slice(0, displayCount);

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 10, data.length));
  };
  const handleLoadAll = () => {
    setDisplayCount(data.length);
  };

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
          <div className="mt-4">
            <DataTable columns={tableColumns} data={displayedData} />
          </div>
        )}
        {data.length > 10 && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="default"
              onClick={handleLoadMore}
              disabled={displayCount >= data.length}
            >
              Load More
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadAll}
              disabled={displayCount === data.length}
            >
              Load All
            </Button>
          </div>
        )}
        <Button variant="default" className="mt-6">
          Submit
        </Button>
      </main>
    </>
  );
}
