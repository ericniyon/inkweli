"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Article } from "@/types";
import { WRITERS, PLACEHOLDER_IMAGE } from "@/constants";
import { useAuth } from "@/lib/auth-context";
import type { WriterItem } from "@/lib/articles-server";
import SiteHeader from "@/components/SiteHeader";
import DashboardSidebar from "./DashboardSidebar";
import DashboardFeed from "./DashboardFeed";
import DashboardRightPanel from "./DashboardRightPanel";
import type { FollowedUser } from "./FollowingList";
import LibraryView from "@/components/LibraryView";
import ProfileView from "@/components/ProfileView";
import StoriesManagementView from "@/components/StoriesManagementView";
import StatsView from "@/components/StatsView";

type DashboardView = "home" | "library" | "profile" | "stories" | "stats";

type DashboardProps = {
  initialArticles?: Article[];
  initialWriters?: WriterItem[];
};

export default function Dashboard({
  initialArticles = [],
  initialWriters,
}: DashboardProps) {
  const { user, setUser, isGuest, logout, hydrated } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>("home");
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [writers, setWriters] = useState<WriterItem[]>(
    initialWriters?.length ? initialWriters : WRITERS
  );

  useEffect(() => {
    if (initialArticles.length > 0) setArticles(initialArticles);
  }, [initialArticles]);
  useEffect(() => {
    if (initialWriters && initialWriters.length > 0) setWriters(initialWriters);
  }, [initialWriters]);

  const publishedArticles = useMemo(
    () => articles.filter((a) => a.status === "PUBLISHED"),
    [articles]
  );
  const latestArticles = useMemo(
    () =>
      [...publishedArticles].sort(
        (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      ),
    [publishedArticles]
  );
  const followedUsers = useMemo((): FollowedUser[] => {
    const byId = new Map<string, FollowedUser>();
    writers
      .filter((w) => user.following.includes(w.id))
      .forEach((w) => byId.set(w.id, { id: w.id, name: w.name, avatar: w.image, role: w.role }));
    latestArticles.forEach((a) => {
      if (user.following.includes(a.authorId) && !byId.has(a.authorId)) {
        byId.set(a.authorId, {
          id: a.authorId,
          name: a.authorName,
          avatar: a.authorAvatar,
        });
      }
    });
    return user.following.map((id) => byId.get(id)).filter(Boolean) as FollowedUser[];
  }, [writers, latestArticles, user.following]);

  const feedArticles = latestArticles;

  const recommendedTopics = useMemo(() => {
    const set = new Set<string>();
    publishedArticles.forEach((a) => {
      set.add(a.category);
      (a.tags || []).forEach((t) => t && set.add(t));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [publishedArticles]);

  const userArticles = useMemo(
    () => articles.filter((a) => a.authorId === user.id),
    [articles, user.id]
  );

  const handleArticleClick = (article: Article) => {
    router.push(`/detail/${article.id}`);
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

  const handleNavigate = (view: string) => {
    if (isGuest && ["library", "stats", "stories"].includes(view)) {
      router.push("/login");
      return;
    }
    setActiveView(view as DashboardView);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Require login: redirect to login with return URL so user comes back to dashboard after signing in
  if (isGuest) {
    router.replace("/login?returnTo=/dashboard");
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeView) {
      case "home":
        return (
          <div className="w-full flex">
            <div className="flex-1 min-w-0">
              <DashboardFeed
                articles={feedArticles}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onArticleClick={handleArticleClick}
                onBookmark={toggleBookmark}
                bookmarks={user.bookmarks}
                followedUsers={followedUsers}
                onUnfollow={(id) => toggleFollow(id)}
              />
            </div>
            <DashboardRightPanel
              staffPicks={latestArticles}
              onArticleClick={handleArticleClick}
              writers={writers}
              onFollow={toggleFollow}
              following={user.following}
              topics={recommendedTopics}
            />
          </div>
        );
      case "library":
        return (
          <LibraryView
            bookmarks={articles.filter((a) => user.bookmarks.includes(a.id))}
            onArticleClick={handleArticleClick}
          />
        );
      case "profile":
        return (
          <ProfileView
            user={user}
            articles={userArticles}
            onArticleClick={handleArticleClick}
            onLogout={handleLogout}
          />
        );
      case "stories":
        return (
          <StoriesManagementView
            articles={userArticles}
            onEdit={(a) => router.push(`/admin/editor?id=${a.id}`)}
            onNew={() => router.push("/admin/editor")}
          />
        );
      case "stats":
        return <StatsView articles={userArticles} />;
      default:
        return (
          <div className="w-full flex">
            <div className="flex-1 min-w-0">
              <DashboardFeed
                articles={feedArticles}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onArticleClick={handleArticleClick}
                onBookmark={toggleBookmark}
                bookmarks={user.bookmarks}
                followedUsers={followedUsers}
                onUnfollow={(id) => toggleFollow(id)}
              />
            </div>
            <DashboardRightPanel
              staffPicks={latestArticles}
              onArticleClick={handleArticleClick}
              writers={writers}
              onFollow={toggleFollow}
              following={user.following}
              topics={recommendedTopics}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader variant="white" />

      <div className="flex flex-1 min-h-0">
        <DashboardSidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          following={writers}
        />

        <main className="flex-1 md:ml-20 flex justify-center">
          <div className="w-full max-w-5xl">{renderMainContent()}</div>
        </main>
      </div>
    </div>
  );
}
