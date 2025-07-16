"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DataTable } from "@/components/data-table/index";
import { columns } from "@/lib/schemas/columns";
import type { InventoryFormValues } from "@/lib/schemas/inventory";
import type { ColumnDef } from "@tanstack/react-table";

export default function Entry() {
  const params = useParams();
  const uuid = params.uuid;
  const [data, setData] = useState<InventoryFormValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boxNumber, setBoxNumber] = useState<number | null>(null);
  const tableColumns = columns as ColumnDef<InventoryFormValues, unknown>[];

  useEffect(() => {
    async function fetchData() {
      if (!uuid) {
        setError("No QR code provided");
        setLoading(false);
        return;
      }
      setError(null);

      setLoading(true);
      try {
        // lookup box number from qrcodes collection
        const qrQuery = query(
          collection(db, "qrcodes"),
          where("uuid", "==", uuid),
        );
        const qrSnapshot = await getDocs(qrQuery);
        if (qrSnapshot.empty) {
          setError("Invalid QR code");
          return;
        }
        const qrData = qrSnapshot.docs[0].data() as {
          box_number: number;
          uuid: string;
        };
        const foundBox = qrData.box_number;
        setBoxNumber(foundBox);
        // now fetch inventory for that box
        const invQuery = query(
          collection(db, "inventory"),
          where("box_number", "==", foundBox),
        );
        const snapshot = await getDocs(invQuery);

        const rows = snapshot.docs.map((doc) => {
          return {
            ...(doc.data() as InventoryFormValues),
            id: doc.id,
          };
        });
        setData(rows);
      } catch (error) {
        console.error("Error fetching box inventory: ", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [uuid]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Box {boxNumber} Inventory</h1>
        <p className="text-gray-600">
          Showing all inventory items in box {boxNumber}
        </p>
      </div>
      {error ? (
        <div className="mb-4 text-red-600">Error: {error}</div>
      ) : (
        <DataTable<InventoryFormValues>
          data={data}
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
          onRowUpdate={(updated: InventoryFormValues) => {
            if (updated && (updated as any).deleted) {
              // Remove the deleted row
              setData((prev) => prev.filter((item) => item.id !== updated.id));
            } else if (updated) {
              // Update the row
              setData((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item)),
              );
            }
          }}
        />
      )}
    </div>
  );
}
