"use client";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Image from "next/image";
import { app } from "@/lib/firebase";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    const auth = getAuth(app);
    try {
      await signOut(auth);
      toast("Signed out successfully.");
      router.push("/");
    } catch (error) {
      toast("Failed to sign out.");
    }
  };

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={toggleSidebar}>
            <Menu />
          </Button>
          <Image src="/up-banner.png" alt="UP Banner" width={120} height={32} />
          Cereals Inventory
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
