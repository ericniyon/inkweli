"use client";

import React, { useState, useEffect, useRef } from "react";
import "react-quill-new/dist/quill.snow.css";

export interface SummernoteEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number | string;
  className?: string;
  /** When this changes, editor is remounted with new value (e.g. article id) */
  editorKey?: string;
}

const TOOLTIP_MAP: Record<string, string> = {
  "ql-bold": "Bold",
  "ql-italic": "Italic",
  "ql-underline": "Underline",
  "ql-strike": "Strikethrough",
  "ql-list": "List",
  "ql-ordered": "Numbered list",
  "ql-bullet": "Bullet list",
  "ql-link": "Insert link",
  "ql-image": "Insert image",
  "ql-clean": "Clear formatting",
  "ql-header": "Heading",
  "ql-picker-label": "Format",
};

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const LOADING_PLACEHOLDER = (
  <div className="min-h-[65vh] max-h-[720px] rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
    Loading editor…
  </div>
);

export default function SummernoteEditor({
  value,
  onChange,
  placeholder = "Write your story here...",
  height = "min(65vh, 720px)",
  className = "",
  editorKey = "default",
}: SummernoteEditorProps) {
  const [Editor, setEditor] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("react-quill-new").then((mod: unknown) => {
      const Component = (mod as { default?: React.ComponentType<Record<string, unknown>> }).default ?? (mod as React.ComponentType<Record<string, unknown>>);
      setEditor(() => Component);
    });
  }, []);

  useEffect(() => {
    if (!Editor || !wrapperRef.current) return;
    const toolbar = wrapperRef.current.querySelector(".ql-toolbar");
    if (!toolbar) return;
    const buttons = toolbar.querySelectorAll("button, .ql-picker-label");
    buttons.forEach((el) => {
      const button = el as HTMLElement;
      const cls = Array.from(button.classList).find((c) => c.startsWith("ql-"));
      if (cls) {
        const label = TOOLTIP_MAP[cls] || cls.replace("ql-", "").replace(/-/g, " ");
        button.setAttribute("title", label);
      }
    });
  }, [Editor, editorKey]);

  const h = typeof height === "number" ? `${height}px` : height;

  if (!Editor) {
    return (
      <div className={`summernote-editor-wrapper w-full ${className}`}>
        {LOADING_PLACEHOLDER}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`summernote-editor-wrapper summernote-editor-styled w-full ${className}`}>
      <Editor
        key={editorKey}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        modules={QUILL_MODULES}
        style={{ minHeight: h }}
      />
    </div>
  );
}
