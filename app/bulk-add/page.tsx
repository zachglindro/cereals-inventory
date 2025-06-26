import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { FileSpreadsheet } from "lucide-react";

export default function BulkAdd() {
  return (
    <>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        <Button variant="outline">
          <FileSpreadsheet/>
          Import
        </Button>
      </main>
    </>
  );
}
