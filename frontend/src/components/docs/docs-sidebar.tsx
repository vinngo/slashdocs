"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { fakeDocsData } from "@/lib/fake-data";

export default function DocsSidebar() {
  return (
    <Sidebar className="py-30 bg-background" collapsible="offcanvas">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fakeDocsData.sections.map((section) => (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton asChild>
                    <a href={`#${section.id}`}>
                      <span>{section.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
