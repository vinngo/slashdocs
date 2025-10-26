import NavBar from "@/components/landing/navbar";
import Hero from "@/components/landing/Hero";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <>
      {/* Grain Background */}
      <div className="absolute inset-0 z-0 bg-background overflow-hidden">
        <div
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-5 animate-[grain_8s_steps(10)_infinite]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>
      <div className="flex flex-col min-h-screen items-center bg-zinc-50 font-sans dark:bg-black">
        <NavBar />
        <Separator />
        <Hero />
      </div>
    </>
  );
}
