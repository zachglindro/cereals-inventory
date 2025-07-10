import { InventoryForm } from "@/components/inventory-form";

export default function Add() {
  return (
    <>
      <main className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Add Inventory</h1>
          <p className="text-gray-600">Use this form to add a new inventory item.</p>
        </div>
        <div className="rounded-lg border-2 border-gray-300 overflow-hidden">
          <InventoryForm />
        </div>
      </main>
    </>
  );
}
