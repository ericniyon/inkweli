"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article, SubscriptionTier } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { PLACEHOLDER_IMAGE } from "@/constants";
import type { WriterItem } from "@/lib/articles-server";
import Logo from "@/components/Logo";
import DetailSidebar from "@/components/DetailSidebar";
import ArticleReader from "@/components/ArticleReader";
import Footer from "@/components/Footer";

type ArticleDetailClientProps = {
  article: Article;
  allArticles: Article[];
  writers: WriterItem[];
};

export default function ArticleDetailClient({
  article: initialArticle,
  allArticles,
  writers,
}: ArticleDetailClientProps) {
  const router = useRouter();
  const { user, setUser, isGuest, logout } = useAuth();
  const [article, setArticle] = useState<Article>(initialArticle);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // When user is logged in, refetch article to get correct hasClapped (server didn't have userId)
  useEffect(() => {
    if (isGuest || user.id === "guest") return;
    fetch(`/api/articles/${initialArticle.id}?userId=${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setArticle(data))
      .catch(() => {});
  }, [initialArticle.id, user.id, isGuest]);

  useEffect(() => {
    const prev = document.title;
    document.title = `${article.title} | usethinkup`;
    return () => {
      document.title = prev;
    };
  }, [article.title]);

  const handleArticleClick = (a: Article) => {
    router.push(`/detail/${a.id}`);
  };

  const toggleBookmark = (articleId: string) => {
    if (isGuest) {
      router.push("/login");
      return;
    }
    setUser({
      ...user,
      bookmarks: user.bookmarks.includes(articleId)
        ? user.bookmarks.filter((id) => id !== articleId)
        : [...user.bookmarks, articleId],
    });
  };

  const toggleFollow = (authorId: string) => {
    if (isGuest) {
      router.push("/login");
      return;
    }
    setUser({
      ...user,
      following: user.following.includes(authorId)
        ? user.following.filter((id) => id !== authorId)
        : [...user.following, authorId],
    });
  };

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-[100] md:pl-24">
        <Link href="/" className="flex items-center gap-4" aria-label="ThinkUp home">
          <Logo size="sm" />
          <span className="text-xl font-black tracking-tighter">ThinkUp</span>
        </Link>
        <div className="flex items-center gap-4 relative">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium mr-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Write
          </Link>
          <div
            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold cursor-pointer overflow-hidden border border-slate-100"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            {isGuest ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <img src={user.avatar || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
            )}
          </div>
          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl py-3 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-50 mb-2">
                <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email || "Guest Session"}</p>
              </div>
              {isGuest ? (
                <>
                  <Link href="/login" className="block w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Sign in</Link>
                  <Link href="/register" className="block w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Get started</Link>
                </>
              ) : (
                <>
                  <Link href="/" className="block w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Profile</Link>
                  <Link href="/" className="block w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Library</Link>
                  <Link href="/" className="block w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Stats</Link>
                  <div className="h-px bg-slate-50 my-2" />
                  <button
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="flex pt-0">
        <DetailSidebar writers={writers} />
        <main className="flex-1 md:ml-20 flex flex-col min-h-screen">
          <ArticleReader
        article={article}
        allArticles={allArticles}
        currentUser={user}
        onArticleClick={handleArticleClick}
        onAuthorClick={() => {}}
        isBookmarked={user.bookmarks.includes(article.id)}
        onToggleBookmark={() => toggleBookmark(article.id)}
        isFollowing={user.following.includes(article.authorId)}
        onToggleFollow={() => toggleFollow(article.authorId)}
        isLimitedAccess={isGuest || user.tier !== SubscriptionTier.UNLIMITED}
        onReadMoreClick={() => router.push("/membership")}
          />
          <Footer />
        </main>
      </div>
    </div>
  );
}
