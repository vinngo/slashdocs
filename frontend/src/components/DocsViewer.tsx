"use client";

import ContentPanel from "./docs/content-panel";
import DocsSidebar from "./docs/docs-sidebar";
import Navbar from "./docs/navbar";
import TabBar from "./docs/tabbar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { fakeDocsData } from "@/lib/fake-data";

export default function DocsViewer() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Navbar + Tabs */}
      <div className="flex-shrink-0 z-30">
        <Navbar />
        <TabBar />
      </div>

      {/* Sidebar + Docs area */}
      <SidebarProvider>
        <div className="flex flex-1 w-full">
          {/* Sidebar */}
          <DocsSidebar />

          {/* Main content area (scrollable) */}
          <main className="flex-1 overflow-y-auto scroll-smooth bg-background">
            <SidebarTrigger />

            <div className="flex flex-col space-y-24 p-8">
              {fakeDocsData.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id.toString()}
                  className="scroll-mt-32"
                >
                  <ContentPanel
                    title={section.title}
                    content={section.content}
                    viewMode="docs"
                  />
                </section>
              ))}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}