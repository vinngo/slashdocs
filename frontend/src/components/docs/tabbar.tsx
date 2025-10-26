import { SidebarTrigger } from "../ui/sidebar";

interface TabBarProps {
  activeTab: "docs" | "chat";
  onTabChange: (tab: "docs" | "chat") => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b w-full">
      <div className="flex flex-row items-center gap-8 px-6 py-3 bg-background border-b">
        <button
          onClick={() => onTabChange("docs")}
          className={`font-semibold text-sm hover:text-foreground/80 pb-2 ${
            activeTab === "docs"
              ? "border-b-2 border-foreground"
              : "text-foreground/60"
          }`}
        >
          docs
        </button>
        <button
          onClick={() => onTabChange("chat")}
          className={`font-semibold text-sm hover:text-foreground/80 pb-2 ${
            activeTab === "chat"
              ? "border-b-2 border-foreground"
              : "text-foreground/60"
          }`}
        >
          chat
        </button>
      </div>
    </div>
  );
}
