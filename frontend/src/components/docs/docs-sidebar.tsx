"use client";

import { useEffect, useState, MouseEvent } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { fakeDocsData } from "@/lib/fake-data";

export default function DocsSidebar() {
  const [activeSection, setActiveSection] = useState<string>("");

  // Highlight visible section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    fakeDocsData.sections.forEach((section) => {
      const el = document.getElementById(section.id.toString());
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll to section when clicked
  const handleClick = (e: MouseEvent<HTMLAnchorElement>, id: number) => {
    e.preventDefault();
    const el = document.getElementById(id.toString());
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
  };

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
                    <a
                      href={`#${section.id}`}
                      onClick={(e) => handleClick(e, section.id)}
                      className={`block px-2 py-1 rounded-md transition-colors ${
                        activeSection === section.id.toString()
                          ? "bg-blue-100 text-blue-600 font-semibold"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {section.title}
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