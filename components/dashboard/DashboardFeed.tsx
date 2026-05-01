"use client";

import React from "react";
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
  return (
    <div className="w-full min-w-0 max-w-none py-4 sm:py-5">
      <div className="min-w-0">
        <div className="flex items-center gap-6 border-b border-zinc-100 mb-4 relative">
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
          <div className="space-y-4">
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
        )}
      </div>
    </div>
  );
}
