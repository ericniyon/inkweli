"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart2,
  Bookmark,
  Home,
  LayoutList,
  UserRound,
} from "lucide-react";

interface Writer {
  id: string;
  name: string;
  image?: string;
}

interface DetailSidebarProps {
  writers: Writer[];
}

type NavDef = {
  label: string;
  href: string;
  /** match dashboard ?view= for active state */
  dashboardView?: "home" | "library" | "stories" | "stats" | "profile";
  Icon: typeof Home;
};

const NAV_ITEMS: NavDef[] = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Library", href: "/dashboard?view=library", dashboardView: "library", Icon: Bookmark },
  { label: "Stories", href: "/dashboard?view=stories", dashboardView: "stories", Icon: LayoutList },
  { label: "Stats", href: "/dashboard?view=stats", dashboardView: "stats", Icon: BarChart2 },
  { label: "Profile", href: "/dashboard?view=profile", dashboardView: "profile", Icon: UserRound },
];

export default function DetailSidebar({ writers: _writers }: DetailSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dashboardView =
    pathname.startsWith("/dashboard")
      ? (searchParams.get("view") || "home") as NavDef["dashboardView"]
      : null;

  return (
    <aside className="w-56 border-r border-slate-200/80 h-screen fixed left-0 top-0 hidden md:flex z-40 flex-col bg-[#FDFCFB] pt-20 pb-6 px-3 font-charter">
      <nav className="flex-1 space-y-1 px-1" aria-label="Site">
        {NAV_ITEMS.map(({ label, href, dashboardView: itemView, Icon }) => {
          const onMarketingHome = pathname === "/";
          const onDashboard = pathname.startsWith("/dashboard");

          let active = false;
          if (href === "/") {
            active = onMarketingHome;
          } else if (itemView) {
            const effective = dashboardView ?? "home";
            active = onDashboard && effective === itemView;
          }

          return (
            <Link
              key={label}
              href={href}
              className={[
                "flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors text-medium-meta font-semibold tracking-tight",
                active
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                  : "text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200/80 hover:shadow-sm",
              ].join(" ")}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.75}
                className={active ? "text-white shrink-0" : "text-slate-500 shrink-0"}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
