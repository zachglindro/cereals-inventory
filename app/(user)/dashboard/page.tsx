"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DataTable } from "@/components/data-table";
import { columns } from "../import/columns";
import type { InventoryFormValues } from "@/lib/schemas/inventory";
import type { ColumnDef } from "@tanstack/react-table";

// Type for rows excluding audit fields
type InventoryRow = Omit<
  InventoryFormValues,
  "created_at" | "created_by" | "modified_at" | "modified_by"
>;

export default function Home() {
  const [data, setData] = useState<InventoryRow[]>([]);
  const tableColumns = columns as ColumnDef<InventoryRow, unknown>[];

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, "inventory"));
      const rows = snapshot.docs.map((doc) => {
        return doc.data() as InventoryRow;
      });
      setData(rows);
    }

    fetchData();
  }, []);

  return <DataTable<InventoryRow> data={data} columns={tableColumns} />;
}