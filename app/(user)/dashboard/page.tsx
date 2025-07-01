"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DataTable } from "@/components/data-table";
import { columns } from "../import/columns";
import type { InventoryFormValues } from "@/lib/schemas/inventory";
import type { ColumnDef } from "@tanstack/react-table";

export default function Home() {
  const [data, setData] = useState<InventoryFormValues[]>([]);
  const [loading, setLoading] = useState(true);
  const tableColumns = columns as ColumnDef<InventoryFormValues, unknown>[];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "inventory"));
      const rows = snapshot.docs.map((doc) => {
        return doc.data() as InventoryFormValues;
      });
      setData(rows);
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <DataTable<InventoryFormValues>
        data={data}
        columns={tableColumns}
        loading={loading}
      />
    </div>
  );
}
