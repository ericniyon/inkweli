"use client";

import React from "react";
import Link from "next/link";
import { useSiteLayout } from "@/lib/site-layout-context";
import Logo from "./Logo";

const Footer: React.FC = () => {
  const { showFooter } = useSiteLayout();
  if (!showFooter) return null;

  return (
    <footer className="py-16 px-6 border-t border-gray-100 flex flex-col items-center text-center bg-gray-50/50">
      <Link href="/" className="mb-6 flex items-center gap-2 text-slate-900" aria-label="ThinkUp home">
        <Logo size="sm" />
        <span className="font-charter font-bold text-medium-h3 tracking-tight">ThinkUp</span>
      </Link>
      <div className="font-charter flex gap-8 mb-8 text-medium-small font-medium uppercase tracking-widest text-gray-400">
        <a href="#" className="hover:text-black transition-colors">Twitter</a>
        <a href="#" className="hover:text-black transition-colors">LinkedIn</a>
        <a href="#" className="hover:text-black transition-colors">Newsletter</a>
      </div>
      <p className="text-[10px] font-mono text-gray-300 uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} ThinkUp Intelligence. All Rights Reserved.
      </p>
    </footer>
  );
};

export default Footer;
