"use client";

import Link from "next/link";
import Logo from "./Logo";
import { useSiteLayout } from "@/lib/site-layout-context";

type SiteHeaderProps = {
  variant?: "landing" | "white";
};

export default function SiteHeader({ variant = "landing" }: SiteHeaderProps) {
  const { showLogoInHeader, stickyHeader } = useSiteLayout();
  const navBg = "bg-transparent";

  return (
    <nav
      className={`px-6 py-4 flex items-center justify-between border-b border-slate-900/10 ${navBg} ${stickyHeader ? "sticky top-0" : ""} z-[100] transition-colors`}
    >
      <Link href="/" className="flex items-center gap-2" aria-label="ThinkUp home">
        {showLogoInHeader && <Logo size="sm" />}
        <span className="text-2xl font-black tracking-tighter">ThinkUp</span>
      </Link>
    </nav>
  );
}
