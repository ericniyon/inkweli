"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";

const ADMIN_NAV: { path: string; label: string; icon: string }[] = [
  { path: "/admin/dashboard", label: "Dashboard", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
  { path: "/admin/articles", label: "Articles", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" },
  { path: "/admin/subscribers", label: "Subscribers", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { path: "/admin/writers", label: "Writers", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { path: "/admin/site-layout", label: "Site Layout", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
];

function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditor = pathname.startsWith("/admin/editor");

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-72 bg-slate-900 text-white flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-8 border-b border-white/10">
          <Link href="/admin/dashboard" className="flex items-center gap-3 hover:opacity-90 transition">
            <Logo size="sm" variant="light" />
            <span className="font-black tracking-tighter text-xl uppercase">
              usethinkup <span className="text-[10px] text-indigo-400 align-top uppercase">CMS</span>
            </span>
          </Link>
        </div>

        <nav className="flex-grow p-6 space-y-2">
          {ADMIN_NAV.map((item) => {
            const active = !isEditor && pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black transition-all ${
                  active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}

          <div className="pt-6 mt-6 border-t border-white/10">
            <Link
              href="/admin/editor"
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-lg transition-all"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Story
            </Link>
          </div>
        </nav>

        <div className="p-6 border-t border-white/10">
          <Link
            href="/"
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to site
          </Link>
        </div>
      </aside>

      <main className="flex-grow overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isGuest) {
      const returnTo = encodeURIComponent("/admin/dashboard");
      router.replace(`/login?returnTo=${returnTo}`);
      return;
    }
    if (user.role !== UserRole.ADMIN) {
      router.replace("/");
      return;
    }
  }, [isGuest, user.role, router]);

  if (isGuest || user.role !== UserRole.ADMIN) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-slate-400 font-bold uppercase tracking-widest">
        Loading...
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-slate-400 font-bold uppercase tracking-widest">Loading...</div>}>
      <AdminSidebar>{children}</AdminSidebar>
    </Suspense>
  );
}
