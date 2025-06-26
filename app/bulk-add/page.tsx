"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { FileSpreadsheet } from "lucide-react";
import React, { useRef } from "react";

export default function BulkAdd() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Do work here
    }
  };

  return (
    <>
      <AppSidebar />
      <input
        type="file"
        accept=".csv, .xlsx, .xls"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <main>
        <SidebarTrigger />

        <Button variant="outline" onClick={handleImportClick}>
          <FileSpreadsheet />
          Import
        </Button>
      </main>
    </>
  );
}
