"use client";

import ContentPanel from "./docs/content-panel";
import DocsSidebar from "./docs/docs-sidebar";
import Navbar from "./docs/navbar";
import { useState } from "react";
import TabBar from "./docs/tabbar";
import ChatContent from "./docs/chat-content";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { DocsData } from "@/lib/fake-data";

interface DocsViewerProps {
  docs: DocsData;
  repoId?: string;
}

export default function DocsViewer({ docs, repoId }: DocsViewerProps) {
  const [activeTab, setActiveTab] = useState<"docs" | "chat">("docs");

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Navbar + Tabs */}
      <div className="flex-shrink-0 z-30">
        <Navbar />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Sidebar + Docs area */}
      <SidebarProvider>
        <div className="flex flex-1 w-full">
          {/* Sidebar */}
          {activeTab === "docs" && <DocsSidebar />}

          {/* Main content area (scrollable) */}
          <main className="flex-1 overflow-y-auto scroll-smooth bg-background">
            {activeTab === "docs" && <SidebarTrigger />}

            {activeTab === "docs" ? (
              <div className="flex flex-col space-y-24 p-8 rounded-xl border border-border">
                {docs &&
                  docs.sections.map((section) => (
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
            ) : (
              <ChatContent repoId={repoId || "unknown"} />
            )}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
