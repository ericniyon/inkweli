"use client";

import React from "react";
import {
  BarChart2,
  Bookmark,
  Home,
  LayoutList,
  Plus,
  UserRound,
} from "lucide-react";
import { PLACEHOLDER_IMAGE } from "@/constants";

interface Writer {
  id: string;
  name: string;
  image?: string;
}

interface DashboardSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  following: Writer[];
}

type NavDef = {
  view: string;
  label: string;
  Icon: typeof Home;
};

const NAV_ITEMS: NavDef[] = [
  { view: "home", label: "Home", Icon: Home },
  { view: "library", label: "Library", Icon: Bookmark },
  { view: "stories", label: "Stories", Icon: LayoutList },
  { view: "stats", label: "Stats", Icon: BarChart2 },
  { view: "profile", label: "Profile", Icon: UserRound },
];

export default function DashboardSidebar({ activeView, onNavigate, following }: DashboardSidebarProps) {
  return (
    <aside className="w-56 border-r border-slate-200/80 h-screen fixed left-0 top-0 hidden md:flex z-40 flex-col bg-[#FDFCFB] pt-16 font-charter">
      <nav className="flex-1 px-3 pt-6 pb-4 space-y-1" aria-label="Dashboard">
        {NAV_ITEMS.map(({ view, label, Icon }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate(view)}
              className={[
                "w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors",
                active
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                  : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200/80",
              ].join(" ")}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.75}
                className={active ? "text-white shrink-0" : "text-slate-500 shrink-0"}
                aria-hidden
              />
              <span className="text-medium-meta font-semibold tracking-tight">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-8 pt-2 border-t border-slate-200/60 mt-auto bg-[#F9F7F5]/90">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-1 mb-3">
          Following
        </p>
        <div className="flex flex-col items-stretch gap-2.5">
          <div className="flex flex-wrap gap-2 justify-start">
            {following.slice(0, 6).map((user) => (
              <button
                key={user.id}
                type="button"
                title={user.name}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white overflow-hidden hover:ring-2 hover:ring-indigo-500/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <img
                  src={user.image || PLACEHOLDER_IMAGE}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            <button
              type="button"
              className="w-9 h-9 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-400 hover:bg-white transition-colors"
              aria-label="Discover writers"
            >
              <Plus size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
