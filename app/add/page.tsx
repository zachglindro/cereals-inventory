import { AppSidebar } from "@/components/app-sidebar";
import { InventoryForm } from "@/components/inventory-form";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Add() {
  return (
    <>
      <AppSidebar />
      <main>
        <SidebarInset></SidebarInset>
        <InventoryForm />
      </main>
    </>
  );
}
