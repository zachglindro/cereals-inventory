import { AppSidebar } from "@/components/app-sidebar";
import { InventoryForm } from "@/components/inventory-form";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        <SidebarInset></SidebarInset>
        <InventoryForm />
      </main>
    </SidebarProvider>
  );
}
