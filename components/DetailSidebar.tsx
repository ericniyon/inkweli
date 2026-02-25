"use client";

import React from "react";
import Link from "next/link";

interface Writer {
  id: string;
  name: string;
  image?: string;
}

interface DetailSidebarProps {
  writers: Writer[];
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  href: string;
}> = ({ icon, label, href }) => (
  <Link
    href={href}
    className="flex items-center gap-3 py-3 px-4 w-full text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 transition-colors rounded-lg"
  >
    <span className="shrink-0 [&>svg]:w-5 [&>svg]:h-5 text-slate-500">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </Link>
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
export default function DetailSidebar({ writers }: DetailSidebarProps) {
  return (
    <aside className="w-52 border-r border-slate-100 h-screen fixed left-0 top-0 flex flex-col pt-20 pb-6 px-4 bg-white hidden md:flex z-40">
      <nav className="flex-1 space-y-0.5">
        <NavItem icon={<HouseIcon />} label="Home" href="/" />
        <NavItem icon={<BookmarkIcon />} label="Library" href="/" />
        <NavItem icon={<UserIcon />} label="Profile" href="/" />
        <NavItem icon={<ListIcon />} label="Stories" href="/" />
        <NavItem icon={<ChartIcon />} label="Stats" href="/" />
      </nav>
    </aside>
  );
}
