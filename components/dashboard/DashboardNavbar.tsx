"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PLACEHOLDER_IMAGE } from "@/constants";

interface DashboardNavbarProps {
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userAvatar?: string;
  userName?: string;
  userEmail?: string;
}

export default function DashboardNavbar({ onNavigate, onLogout, userAvatar, userName, userEmail }: DashboardNavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="h-14 border-b border-zinc-100 flex items-center justify-between px-4 fixed top-0 left-0 right-0 bg-white z-50">
      <div className="flex items-center gap-4 flex-1">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-black text-xl italic shrink-0 cursor-pointer"
          aria-label="Home"
        >
          U
        </button>
        <div className="relative max-w-md w-full group">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-zinc-50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-200 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 text-sm font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="hidden sm:inline">Write</span>
        </Link>
        <button type="button" className="text-zinc-500 hover:text-zinc-900 relative transition-colors" aria-label="Notifications">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            className="w-8 h-8 rounded-full border border-zinc-100 overflow-hidden flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            aria-label={userName ? `Profile: ${userName}` : "Profile"}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <img
              src={userAvatar || PLACEHOLDER_IMAGE}
              alt={userName || "Profile"}
              className="w-full h-full object-cover"
            />
          </button>
          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg py-2 z-[110]">
              <div className="px-4 py-3 border-b border-zinc-100">
                <p className="text-sm font-semibold text-zinc-900 truncate">{userName}</p>
                <p className="text-xs text-zinc-500 truncate">{userEmail || ""}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onNavigate("profile");
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
