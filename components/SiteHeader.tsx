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
      <Link href="/" className="flex items-center gap-2">
        {showLogoInHeader && <Logo size="sm" />}
        <span className="text-2xl font-black tracking-tighter">usethinkup</span>
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-4 sm:gap-6">
        <Link
          href="/our-story"
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          Our story
        </Link>
        <Link
          href="/membership"
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          Membership
        </Link>
        <Link
          href="/admin"
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          Write
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition shrink-0"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
