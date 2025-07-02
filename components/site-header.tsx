"use client";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

import Image from "next/image";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button variant="ghost" onClick={toggleSidebar}>
          <Menu />
        </Button>
        <Image src="/up-banner.png" alt="UP Banner" width={120} height={32} />
        Cereals Inventory
      </div>
    </header>
  );
}
