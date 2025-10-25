import { SidebarTrigger } from "../ui/sidebar";

export default function TabBar() {
  return (
    <div className="sticky top-0 z-10 bg-background border-b w-full">
      <div className="flex flex-row items-center gap-8 px-6 py-3 bg-background border-b">
        <button className="font-semibold text-sm hover:text-foreground/80 border-b-2 border-foreground pb-2">
          docs
        </button>
        <button className="font-semibold text-sm text-foreground/60 hover:text-foreground/80 pb-2">
          chat
        </button>
      </div>
    </div>
  );
}
