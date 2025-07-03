"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DataTable } from "@/components/data-table/index";
import { columns } from "@/lib/schemas/columns";
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
        return {
          ...(doc.data() as InventoryFormValues),
          id: doc.id,
        };
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
        filterableFields={[
          { label: "Type", fieldName: "type" },
          { label: "Location Planted", fieldName: "location_planted" },
          { label: "Year", fieldName: "year" },
          { label: "Season", fieldName: "season" },
          { label: "Location", fieldName: "location" },
          { label: "Description", fieldName: "description" },
          { label: "Pedigree", fieldName: "pedigree" },
          { label: "Weight", fieldName: "weight" },
        ]}
      />
    </div>
  );
}
