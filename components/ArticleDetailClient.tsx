"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Article, SubscriptionTier } from "@/types";
import { useAuth } from "@/lib/auth-context";
import type { WriterItem } from "@/lib/articles-server";
import SiteHeader from "@/components/SiteHeader";
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
  const { user, setUser, isGuest } = useAuth();
  const [article, setArticle] = useState<Article>(initialArticle);

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
      <SiteHeader variant="white" />

      <div className="flex pt-0">
        <DetailSidebar writers={writers} />
        <main className="flex-1 md:ml-52 flex flex-col min-h-screen">
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
            writers={writers}
          />
          <Footer />
        </main>
      </div>
    </div>
  );
}
