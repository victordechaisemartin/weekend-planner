"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/announcements",
    label: "News",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" />
      </svg>
    ),
  },
  {
    href: "/planning",
    label: "Planning",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M9 18V5l12-2v13" stroke="currentColor" />
        <circle cx="6" cy="18" r="3" stroke="currentColor" />
        <circle cx="18" cy="16" r="3" stroke="currentColor" />
      </svg>
    ),
  },
  {
    href: "/scores",
    label: "Scores",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M8 21h8M12 17v4" stroke="currentColor" />
        <path d="M7 4H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h.5" stroke="currentColor" />
        <path d="M17 4h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-.5" stroke="currentColor" />
        <path d="M7 4h10v9a5 5 0 0 1-10 0V4z" stroke="currentColor" />
      </svg>
    ),
  },
  {
    href: "/cars",
    label: "Cars",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" stroke="currentColor" />
        <circle cx="7.5" cy="17.5" r="2.5" stroke="currentColor" />
        <circle cx="16.5" cy="17.5" r="2.5" stroke="currentColor" />
      </svg>
    ),
  },
  {
    href: "/tents",
    label: "Tents",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 20 L12 4 L21 20" stroke="currentColor" />
        <path d="M3 20 H21" stroke="currentColor" />
        <path d="M10 20 L12 14 L14 20" stroke="currentColor" />
      </svg>
    ),
  },
  {
    href: "/map",
    label: "Map",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke="currentColor" />
        <line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" />
        <line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" stroke="currentColor" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-pink/20">
      <ul className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`
                  flex flex-col items-center gap-0.5 py-1.5 mx-0.5 rounded-2xl
                  text-[10px] font-semibold tracking-wide transition-all duration-150
                  ${active
                    ? "text-pink bg-pink/10"
                    : "text-charcoal/45 hover:text-charcoal/70"}
                `}
              >
                {icon}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
