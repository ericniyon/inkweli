"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import Logo from "./Logo";
import { useSiteLayout } from "@/lib/site-layout-context";
import { useAuth } from "@/lib/auth-context";

type SiteHeaderProps = {
  variant?: "landing" | "white";
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

export default function SiteHeader({
  variant = "landing",
  searchValue = "",
  onSearchChange,
}: SiteHeaderProps) {
  const router = useRouter();
  const { user, isGuest, logout } = useAuth();
  const { showLogoInHeader, stickyHeader } = useSiteLayout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isLanding = variant === "landing";
  const navBg = "bg-white/95 backdrop-blur-md border-b border-slate-100";

  const membershipLink = (
    <Link
      href="/membership"
      className="font-charter text-sm font-medium text-slate-600 hover:text-slate-900 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
    >
      Membership
    </Link>
  );

  const writerLink = (
    <Link
      href="/become-a-writer"
      className="font-charter text-sm font-medium text-slate-600 hover:text-slate-900 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
    >
      Become Writer
    </Link>
  );

  const signInLink = (
    <Link
      href="/login"
      className="font-charter text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-4 rounded-lg hover:bg-slate-50"
    >
      Sign In
    </Link>
  );

  const getStartedLink = (
    <Link
      href="/register"
      className="font-charter text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 py-2.5 px-5 rounded-full shadow-sm transition-colors"
    >
      Get started
    </Link>
  );

  const rightSection = (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      <div className="hidden md:flex items-center gap-1">{membershipLink}{writerLink}</div>
      {isGuest ? (
        <div className="hidden md:flex items-center gap-2">
          {signInLink}
          {getStartedLink}
        </div>
      ) : (
        <div className="hidden md:block relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold overflow-hidden border border-slate-100"
            aria-label="Account menu"
            aria-expanded={userMenuOpen}
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{user.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
            )}
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-[98]" aria-hidden onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-[100]">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="font-charter text-sm font-black text-slate-900 truncate">{user.name}</p>
                  <p className="font-charter text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="font-charter block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Dashboard</Link>
                <Link href="/" onClick={() => setUserMenuOpen(false)} className="font-charter block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Home</Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="font-charter block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Write</Link>
                )}
                <div className="h-px bg-slate-50 my-2" />
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(false); logout(); router.push("/"); }}
                  className="font-charter w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="md:hidden p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
  );

  if (isLanding) {
    return (
      <>
        <header
          className={`h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between gap-4 ${navBg} ${stickyHeader ? "sticky top-0" : ""} z-50`}
        >
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 text-slate-900 hover:opacity-90 transition-opacity min-w-0"
            aria-label="ThinkUp home"
          >
            {showLogoInHeader && <Logo size="sm" />}
            <span className="font-charter font-bold text-lg sm:text-xl tracking-tight truncate">ThinkUp</span>
          </Link>

          <div className="flex-grow max-w-sm sm:max-w-md mx-2 sm:mx-6 min-w-0">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors pointer-events-none"
                size={18}
              />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="font-charter w-full bg-slate-50 border border-slate-100 focus:border-slate-200 focus:bg-white rounded-full py-2 sm:py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {rightSection}
        </header>

        <div
          className={`md:hidden fixed inset-0 top-14 sm:top-16 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 transition-all duration-200 ${
            menuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
          }`}
        >
          <nav className="flex flex-col p-6 gap-1">
            <Link href="/membership" onClick={() => setMenuOpen(false)} className="font-charter text-base font-medium text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50">
              Membership
            </Link>
            <Link href="/become-a-writer" onClick={() => setMenuOpen(false)} className="font-charter text-base font-medium text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50">
              Become Writer
            </Link>
            {isGuest ? (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="font-charter text-base font-semibold text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="font-charter text-base font-bold text-white bg-slate-900 hover:bg-slate-800 py-3.5 px-5 rounded-full text-center mt-2">
                  Get started
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="font-charter text-base font-medium text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50">
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); logout(); router.push("/"); }}
                  className="font-charter text-base font-bold text-red-500 py-3 px-4 rounded-xl hover:bg-red-50 text-left"
                >
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      </>
    );
  }

  return (
    <>
      <nav
        className={`h-14 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between ${navBg} ${stickyHeader ? "sticky top-0" : ""} z-[100] transition-all duration-300 font-charter`}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-900 hover:opacity-90 transition-opacity flex-shrink-0"
          aria-label="ThinkUp home"
        >
          {showLogoInHeader && <Logo size="sm" />}
          <span className="font-charter font-bold text-lg sm:text-xl tracking-tight">ThinkUp</span>
        </Link>

        <div className="flex items-center gap-2">{rightSection}</div>
      </nav>

      <div
        className={`md:hidden fixed inset-0 top-14 sm:top-16 z-[99] bg-white/95 backdrop-blur-md border-t border-slate-100 transition-all duration-200 ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <nav className="flex flex-col p-6 gap-1">
          <Link href="/membership" onClick={() => setMenuOpen(false)} className="font-charter text-base font-medium text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50">
            Membership
          </Link>
          <Link href="/become-a-writer" onClick={() => setMenuOpen(false)} className="font-charter text-base font-medium text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50">
            Become Writer
          </Link>
          {isGuest ? (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="font-charter text-base font-semibold text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50">
                Sign In
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="font-charter text-base font-bold text-white bg-slate-900 hover:bg-slate-800 py-3.5 px-5 rounded-full text-center mt-2">
                Get started
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="font-charter text-base font-medium text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); logout(); router.push("/"); }}
                className="font-charter text-base font-bold text-red-500 py-3 px-4 rounded-xl hover:bg-red-50 text-left"
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
