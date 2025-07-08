"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Camera, House, Plus, RefreshCw, Sheet, Shield } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

const items = [
  {
    title: "Home",
    url: "/dashboard",
    icon: House,
  },
  {
    title: "Add",
    url: "/add",
    icon: Plus,
  },
  {
    title: "Import",
    url: "/import",
    icon: Sheet,
  },
  {
    title: "Scan",
    url: "/scan",
    icon: Camera,
  },
];

export function AppSidebar() {
  const { profile } = useUser();
  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {profile?.role === "admin" && (
                <SidebarMenuItem key="Admin">
                  <SidebarMenuButton asChild>
                    <Link href="/admin">
                      <Shield />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
