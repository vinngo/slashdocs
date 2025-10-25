"use client";
import { Github } from "lucide-react";
import Link from "next/link";

export default function NavBar() {
  return (
    <div className="container mx-auto px-4">
      <div className="flex h-16 items-center justify-between">
        <span className="text-xl font-bold flex-shrink-0">/docs</span>

        <Link href="https://github.com/vinngo/slashdocs">
          <Github />
        </Link>
      </div>
    </div>
  );
}
