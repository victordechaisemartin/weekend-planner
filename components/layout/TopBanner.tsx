"use client";

import { usePathname } from "next/navigation";

export default function TopBanner() {
  const pathname = usePathname();
  if (pathname === "/lineup") return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-11 flex items-center px-4 max-w-lg mx-auto">
      <span className="text-lg leading-none" aria-hidden>🌸</span>
      <span className="flex-1 text-center text-sm font-bold text-charcoal tracking-wide -ml-5">
        Lolapabouillet
      </span>
    </header>
  );
}
