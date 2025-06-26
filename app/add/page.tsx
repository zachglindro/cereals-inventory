import { AppSidebar } from "@/components/app-sidebar";
import { InventoryForm } from "@/components/inventory-form";
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Add() {
  return (
    <>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        <SidebarInset></SidebarInset>
        <InventoryForm />
      </main>
    </>
  );
}
