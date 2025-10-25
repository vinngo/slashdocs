import ContentPanel from "./docs/content-panel";
import DocsSidebar from "./docs/docs-sidebar";
import Navbar from "./docs/navbar";
import TabBar from "./docs/tabbar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export default function DocsViewer() {
  const panel_content = `# Project Overview

This is a modern web application built with Next.js and TypeScript, designed to provide a seamless user experience with server-side rendering and static site generation capabilities.

## Key Features

- **Fast Performance**: Optimized builds with automatic code splitting
- **Type Safety**: Full TypeScript support throughout the application
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **SEO Friendly**: Server-side rendering for optimal search engine visibility

## Technology Stack

- Next.js 14+
- React 18
- TypeScript 5
- Tailwind CSS
- Shadcn/ui components`;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <div className="flex-shrink-0 z-30">
        <Navbar />
        <TabBar />
      </div>
      <div className="flex-1 overflow-hidden">
        <SidebarProvider>
          <div className="flex h-full w-full">
            <DocsSidebar />
            <main className="flex-1 overflow-y-auto p-8">
              <SidebarTrigger />
              {/* Main content area - documentation will go here */}
              <ContentPanel
                title="Overview"
                content={panel_content}
                viewMode="docs"
              />
            </main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
