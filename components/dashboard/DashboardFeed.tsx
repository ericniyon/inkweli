"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Article } from "@/types";
import DashboardArticleCard from "./DashboardArticleCard";
import FollowingList, { type FollowedUser } from "./FollowingList";

interface DashboardFeedProps {
  articles: Article[];
  activeTab: "forYou" | "following";
  onTabChange: (tab: "forYou" | "following") => void;
  onArticleClick: (article: Article) => void;
  onBookmark: (articleId: string) => void;
  bookmarks: string[];
  followedUsers?: FollowedUser[];
  onUnfollow?: (id: string) => void;
}

export default function DashboardFeed({
  articles,
  activeTab,
  onTabChange,
  onArticleClick,
  onBookmark,
  bookmarks,
  followedUsers = [],
  onUnfollow,
}: DashboardFeedProps) {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="max-w-screen-md mx-auto py-8 px-4">
      <div className="flex items-center gap-6 border-b border-zinc-100 mb-6 relative">
        <button
          type="button"
          onClick={() => onTabChange("forYou")}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "forYou" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"}`}
        >
          For you
          {activeTab === "forYou" && <div className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-zinc-900" />}
        </button>
        <button
          type="button"
          onClick={() => onTabChange("following")}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "following" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"}`}
        >
          Following
          {activeTab === "following" && <div className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-zinc-900" />}
        </button>
      </div>

      {activeTab === "following" ? (
        onUnfollow ? (
          <FollowingList users={followedUsers} onUnfollow={onUnfollow} />
        ) : (
          <FollowingList users={followedUsers} onUnfollow={() => {}} />
        )
      ) : (
        <>
          {showBanner && (
            <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-6 flex items-start gap-6 relative mb-8">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 mb-1">Your first member-only story is free</h3>
                <p className="text-zinc-500 text-sm mb-3">
                  Continue reading the story below or unlock any story with the star icon.
                </p>
                <Link
                  href="/membership"
                  className="text-zinc-900 font-bold text-sm underline hover:text-zinc-600 transition-colors"
                >
                  Upgrade to access all of usethinkup
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="text-zinc-300 hover:text-zinc-900 transition-colors absolute top-4 right-4"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="space-y-2">
            {articles.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">No stories yet.</div>
            ) : (
              articles.map((article) => (
                <DashboardArticleCard
                  key={article.id}
                  article={article}
                  onBookmark={onBookmark}
                  isBookmarked={bookmarks.includes(article.id)}
                  onClick={() => onArticleClick(article)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
