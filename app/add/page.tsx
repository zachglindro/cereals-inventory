import { InventoryForm } from "@/components/inventory-form";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Add() {
  return (
    <>
      <main>
        <SidebarInset></SidebarInset>
        <InventoryForm />
      </main>
    </>
  );
}
