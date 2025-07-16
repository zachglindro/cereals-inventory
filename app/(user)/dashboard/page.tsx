"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DataTable } from "@/components/data-table/index";
import { columns } from "@/lib/schemas/columns";
import { DashboardAnalytics } from "@/components/dashboard";
import type { InventoryFormValues } from "@/lib/schemas/inventory";
import type { ColumnDef } from "@tanstack/react-table";
import { useUser } from "@/context/UserContext";
import { InventoryForm } from "@/components/inventory-form";

export default function Home() {
  const { profile } = useUser();
  const [data, setData] = useState<InventoryFormValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [selectedChart, setSelectedChart] = useState<string>("type");
  const [chartWeightMode, setChartWeightMode] = useState<boolean>(false);
  const tableColumns = columns as ColumnDef<InventoryFormValues, unknown>[];

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
  }, [searchInput]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInput);
    }
  }, [searchInput]);

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
      // Sort by box_number field
      const sortedRows = rows.sort((a, b) => {
        return Number(a.box_number ?? 0) - Number(b.box_number ?? 0);
      });
      setData(sortedRows);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Prepare filtered data by search query
  const filteredData = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return data;
    // Match numeric comparison e.g. weight>10 or year<=2020
    const match = q.match(/^([a-zA-Z_]+)(<=|>=|<|>|=)(\d+(?:\.\d+)?$)/);
    if (match) {
      const [, field, op, valStr] = match;
      const val = parseFloat(valStr);
      return data.filter((row) => {
        const num = Number((row as any)[field]);
        if (isNaN(num)) return false;
        switch (op) {
          case "<": return num < val;
          case "<=": return num <= val;
          case ">": return num > val;
          case ">=": return num >= val;
          case "=": return num === val;
          default: return false;
        }
      });
    }
    // Generic text search across all fields
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q.toLowerCase())
      )
    );
  }, [data, searchQuery]);
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
        <p className="text-gray-600">
          Complete view of inventory data and analytics
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex gap-2 items-center">
        <Input
          type="text"
          placeholder="Search any field or use e.g. weight>10, year<=2020"
          value={searchInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full max-w-md"
        />
        <Button onClick={handleSearch}>
          Search
        </Button>
      </div>
      {/* Data Table */}
      <div className="mb-8">
        <DataTable<InventoryFormValues>
          data={filteredData}
          columns={tableColumns}
          loading={loading}
          filterableFields={[
            { label: "Type", fieldName: "type" },
            { label: "Area Planted", fieldName: "area_planted" },
            { label: "Year", fieldName: "year" },
            { label: "Season", fieldName: "season" },
            { label: "Location", fieldName: "location" },
            { label: "Description", fieldName: "description" },
            { label: "Pedigree", fieldName: "pedigree" },
            { label: "Weight", fieldName: "weight" },
          ]}
          onRowUpdate={async (updated: InventoryFormValues) => {
            if (!updated) return;
            // Handle deletion locally
            if ((updated as any).deleted) {
              setData((prev) => prev.filter((item) => item.id !== updated.id));
            } else {
              // Optimistically update UI
              setData((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item)),
              );
              try {
                // Update main document
                const { id, ...fields } = updated;
                const docRef = doc(db, "inventory", id!);
                // Get previous data for diff
                const prev = data.find((item) => item.id === id);
                await updateDoc(docRef, fields as any);
                // Compute changed fields
                let changes: Record<string, { from: any; to: any }> = {};
                if (prev) {
                  Object.keys(fields).forEach((key) => {
                    if ((prev as any)[key] !== (fields as any)[key]) {
                      changes[key] = {
                        from: (prev as any)[key],
                        to: (fields as any)[key],
                      };
                    }
                  });
                }
                // Add history entry
                const histCol = collection(db, "inventory", id!, "history");
                await addDoc(histCol, {
                  editedBy: profile?.displayName || profile?.email || "Unknown",
                  editedAt: serverTimestamp(),
                  creatorId: profile?.uid,
                  changes,
                });
              } catch (error) {
                console.error("Error updating document or writing history:", error);
              }
            }
          }}
        />
      </div>

      {/* Add Inventory Form */}
      <div className="mb-8 rounded-lg border-2 border-gray-300 overflow-hidden">
        <div className="m-4">
          <h2 className="text-xl font-semibold">Add Inventory</h2>
          <p className="text-gray-600">Use this form to add a new inventory item.</p>
        </div>
        <InventoryForm />
      </div>

      {/* Analytics */}
      <div className="hidden md:block">
        <DashboardAnalytics
          data={data}
          selectedChart={selectedChart}
          onChartChange={setSelectedChart}
          chartWeightMode={chartWeightMode}
          onWeightModeChange={setChartWeightMode}
        />
      </div>
    </div>
  );
}
