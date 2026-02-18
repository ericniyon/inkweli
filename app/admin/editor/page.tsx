"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Article, Category } from "@/types";

import { GoogleGenAI } from "@google/genai";

const SummernoteEditor = dynamic(
  () => import("@/components/SummernoteEditor").then((m) => m.default),
  { ssr: false, loading: () => <div className="h-[420px] rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-500 text-sm">Loading editor…</div> }
);

function stripHtml(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

function StoryEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [editingArticle, setEditingArticle] = useState<Partial<Article>>({
    title: "",
    content: "",
    category: "General",
    status: "DRAFT",
    excerpt: "",
    featuredImage: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/articles/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setEditingArticle(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const suggestExcerpt = async () => {
    const plainText = stripHtml(editingArticle?.content ?? "");
    if (!plainText) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate a compelling one-sentence SEO excerpt for this article content: ${plainText.substring(0, 1000)}`,
      });
      const text = (response as { text?: string })?.text?.trim();
      if (text) setEditingArticle((prev) => ({ ...prev, excerpt: text }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const wordCount = useMemo(
    () => stripHtml(editingArticle?.content ?? "").split(/\s+/).filter(Boolean).length,
    [editingArticle?.content]
  );
  const readTime = Math.ceil(wordCount / 200);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!editingArticle?.title?.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        title: editingArticle.title.trim(),
        slug: (editingArticle.slug ?? editingArticle.title?.toLowerCase().replace(/\s+/g, "-")) || "",
        excerpt: editingArticle.excerpt ?? "",
        content: editingArticle.content ?? "",
        authorId: editingArticle.authorId ?? "auth_katurebe",
        featuredImage: editingArticle.featuredImage ?? "",
        readingTime: readTime,
        category: editingArticle.category ?? "General",
        tags: editingArticle.tags ?? [],
        status: editingArticle.status ?? "DRAFT",
      };
      if (id) {
        const res = await fetch(`/api/articles/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create");
      }
      setLastSaved(new Date().toLocaleTimeString());
      setTimeout(() => router.push("/admin/articles"), 1000);
    } catch (err) {
      console.error(err);
      setLastSaved(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading article…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top bar – editorial header */}
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/admin/articles"
            className="flex-shrink-0 p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Back to articles"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {id ? "Edit article" : "New article"}
            </p>
            <p className="text-base font-bold text-slate-900 truncate">
              {editingArticle?.title || "Untitled"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                isSaving
                  ? "bg-amber-100 text-amber-800"
                  : lastSaved
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSaving ? "bg-amber-500 animate-pulse" : "bg-current opacity-70"}`} />
              {isSaving ? "Saving…" : lastSaved ? `Saved ${lastSaved}` : "Draft"}
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              {wordCount} words · {readTime} min
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label={sidebarOpen ? "Hide settings" : "Show settings"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-500/25"
          >
            {isSaving ? "Saving…" : editingArticle?.status === "PUBLISHED" ? "Update" : "Publish"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Main editor – paper-style content area */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="w-full max-w-none py-8 px-6 lg:px-10">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Title block */}
              <div className="p-6 lg:p-8 border-b border-slate-200">
                <label className="block">
                  <span className="sr-only">Title</span>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Article title"
                    className="w-full text-2xl lg:text-3xl font-bold text-slate-900 placeholder:text-slate-400 bg-white border-2 border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={editingArticle?.title ?? ""}
                    onChange={(e) => setEditingArticle((prev) => ({ ...prev!, title: e.target.value }))}
                    autoFocus
                  />
                </label>
              </div>

              {/* Summernote body */}
              <div className="px-6 lg:px-8 pb-8">
                <label className="block w-full">
                  <span className="sr-only">Content</span>
                  <SummernoteEditor
                    editorKey={id ?? "new"}
                    value={editingArticle?.content ?? ""}
                    onChange={(content) => setEditingArticle((prev) => ({ ...prev!, content }))}
                    placeholder="Write your article here. Use the toolbar for formatting, links, and images."
                    height="52vh"
                    className="rounded-xl border-2 border-slate-200 overflow-hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar – publish & metadata */}
        <aside
          className={`${
            sidebarOpen ? "w-full" : "w-0 overflow-hidden"
          } lg:w-[380px] flex-shrink-0 bg-white border-l border-slate-200/80 overflow-y-auto transition-all duration-200`}
        >
          <div className="p-6 space-y-8">
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Publish
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Status</label>
                  <select
                    name="status"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={editingArticle?.status ?? "DRAFT"}
                    onChange={(e) => setEditingArticle((prev) => ({ ...prev!, status: e.target.value as Article["status"] }))}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Category</label>
                  <select
                    name="category"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={editingArticle?.category ?? "General"}
                    onChange={(e) => setEditingArticle((prev) => ({ ...prev!, category: e.target.value as Category }))}
                  >
                    <option>General</option>
                    <option>Politics</option>
                    <option>Economy</option>
                    <option>Culture</option>
                    <option>Technology</option>
                    <option>Science</option>
                    <option>Opinion</option>
                  </select>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Excerpt
                </h3>
                <button
                  type="button"
                  onClick={suggestExcerpt}
                  disabled={isGenerating || !editingArticle?.content}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isGenerating ? "…" : "Suggest with AI"}
                </button>
              </div>
              <textarea
                name="excerpt"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none h-28"
                placeholder="Short summary for previews and SEO..."
                value={editingArticle?.excerpt ?? ""}
                onChange={(e) => setEditingArticle((prev) => ({ ...prev!, excerpt: e.target.value }))}
              />
            </section>

            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Cover image
              </h3>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-semibold file:text-sm file:cursor-pointer hover:file:bg-indigo-200"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.set("file", file);
                  try {
                    const res = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || "Upload failed");
                    }
                    const { url } = await res.json();
                    setEditingArticle((prev) => ({ ...prev!, featuredImage: url }));
                  } catch (err) {
                    console.error(err);
                    alert(err instanceof Error ? err.message : "Upload failed");
                  }
                  e.target.value = "";
                }}
              />
              {editingArticle?.featuredImage && (
                <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                  <img
                    src={editingArticle.featuredImage}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </section>

            <section className="pt-6 border-t border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Stats
              </h3>
              <div className="flex gap-8 text-sm">
                <div>
                  <p className="text-slate-500 font-semibold">Words</p>
                  <p className="text-slate-900 font-bold text-lg tabular-nums">{wordCount}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold">Read time</p>
                  <p className="text-slate-900 font-bold text-lg tabular-nums">{readTime} min</p>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AdminEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <StoryEditorContent />
    </Suspense>
  );
}
