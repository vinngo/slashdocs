import NavBar from "@/components/landing/navbar";
import Hero from "@/components/landing/Hero";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center bg-zinc-50 font-sans dark:bg-black">
      <NavBar />
      <Separator />
      <Hero />
    </div>
  );
}
