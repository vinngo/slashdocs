export default function Navbar() {
  return (
    <div className="z-20 bg-background border-b w-full">
      <div className="flex h-16 items-center justify-between px-6">
        <span className="text-xl font-bold flex-shrink-0">
          /{<span className="text-accent">docs</span>}
        </span>
        <span>Share</span>
      </div>
    </div>
  );
}
