"use client";

import React from "react";

function stripHtmlToText(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, "\n").replace(/\n+/g, "\n").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\n+/g, "\n").trim();
}

function plainTextToHtml(text: string): string {
  if (!text.trim()) return "";
  return text
    .split(/\n+/)
    .map((p) => `<p>${p.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your story...",
  className = "",
  minHeight = "400px",
}: RichTextEditorProps) {
  const isHtml = value.trim().startsWith("<");
  const displayValue = isHtml ? stripHtmlToText(value) : value;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(plainTextToHtml(e.target.value));
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <textarea
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 text-base outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 resize-y"
        style={{ minHeight: minHeight || "60vh" }}
      />
    </div>
  );
}
