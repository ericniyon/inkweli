"use client";

import React from "react";
import { useSiteLayout } from "@/lib/site-layout-context";

const Footer: React.FC = () => {
  const { showFooter } = useSiteLayout();
  if (!showFooter) return null;

  const links = [
    'Help',
    'Status',
    'About',
    'Careers',
    'Blog',
    'Privacy',
    'Terms',
    'Text to Speech',
    'Teams'
  ];

  return (
    <footer className="w-full border-t border-slate-100 bg-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
            >
              {link}
            </a>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} usethinkup platform
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
