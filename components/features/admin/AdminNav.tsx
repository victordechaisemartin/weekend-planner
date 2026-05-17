"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Dashboard",  href: "/admin/dashboard"      },
  { label: "News",       href: "/admin/announcements"  },
  { label: "Guests",     href: "/admin/guests"         },
  { label: "Présence", href: "/admin/presence"      },
  { label: "DJs",        href: "/admin/djs"            },
  { label: "Planning",  href: "/admin/planning"       },
  { label: "Scores", href: "/admin/scores"         },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="overflow-x-auto border-b border-[#2D2D2D]/10"
      style={{ background: "#FFF8F0" }}
    >
      <div className="flex gap-1 px-4 py-2 min-w-max">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "text-[#2D2D2D]"
                  : "text-[#2D2D2D]/50 hover:text-[#2D2D2D]/80"
              }`}
              style={isActive ? { background: "#F4A7B9" } : {}}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
