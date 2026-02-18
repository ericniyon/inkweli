"use client";

import React from "react";
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

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center py-4 w-full cursor-pointer transition-colors ${active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
  >
    <span className="text-xl mb-1 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
    <span className="text-[11px] font-medium">{label}</span>
  </button>
);

const HouseIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const BookmarkIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);
const ListIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);
const ChartIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth="2" d="M7 12l3-3 3 3 4-8M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);
const UserIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const PlusIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export default function DashboardSidebar({ activeView, onNavigate, following }: DashboardSidebarProps) {
  return (
    <aside className="w-20 border-r border-zinc-100 h-screen fixed left-0 top-0 flex flex-col pt-16 bg-white hidden md:flex z-40">
      <div className="flex-1 space-y-2">
        <NavItem icon={<HouseIcon />} label="Home" active={activeView === "home"} onClick={() => onNavigate("home")} />
        <NavItem icon={<BookmarkIcon />} label="Library" active={activeView === "library"} onClick={() => onNavigate("library")} />
        <NavItem icon={<ListIcon />} label="Stories" active={activeView === "stories"} onClick={() => onNavigate("stories")} />
        <NavItem icon={<ChartIcon />} label="Stats" active={activeView === "stats"} onClick={() => onNavigate("stats")} />
        <NavItem icon={<UserIcon />} label="Profile" active={activeView === "profile"} onClick={() => onNavigate("profile")} />
      </div>

      <div className="pb-8 px-2">
        <div className="text-[10px] font-bold text-zinc-400 mb-4 text-center uppercase tracking-wider">Following</div>
        <div className="flex flex-col items-center space-y-4">
          {following.slice(0, 3).map((user) => (
            <button
              key={user.id}
              type="button"
              className="w-8 h-8 rounded-full border border-zinc-200 overflow-hidden hover:ring-2 hover:ring-zinc-100 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <img src={user.image || PLACEHOLDER_IMAGE} alt={user.name} className="w-full h-full object-cover" />
            </button>
          ))}
          <button
            type="button"
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
            aria-label="Add"
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}
