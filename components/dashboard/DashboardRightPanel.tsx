"use client";

import React from "react";
import { Article } from "@/types";
import { PLACEHOLDER_IMAGE } from "@/constants";

interface Writer {
  id: string;
  name: string;
  bio?: string;
  image?: string;
}

interface DashboardRightPanelProps {
  staffPicks: Article[];
  onArticleClick: (article: Article) => void;
  writers: Writer[];
  onFollow: (writerId: string) => void;
  following: string[];
  /** Topics derived from article categories and tags (only those that have articles) */
  topics?: string[];
}

export default function DashboardRightPanel({
  staffPicks,
  onArticleClick,
  writers,
  onFollow,
  following,
  topics = [],
}: DashboardRightPanelProps) {
  return (
    <aside className="hidden lg:block w-80 min-h-screen border-l border-zinc-100 p-8 space-y-10">
      <section className="space-y-4">
        <h3 className="font-bold text-sm text-zinc-900">Staff Picks</h3>
        <div className="space-y-4">
          {staffPicks.slice(0, 3).map((pick) => (
            <button
              key={pick.id}
              type="button"
              className="group cursor-pointer text-left w-full"
              onClick={() => onArticleClick(pick)}
            >
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={pick.authorAvatar || PLACEHOLDER_IMAGE}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-zinc-800">{pick.authorName}</span>
              </div>
              <h4 className="font-bold text-sm leading-snug group-hover:underline text-zinc-900">{pick.title}</h4>
            </button>
          ))}
        </div>
        <a href="/membership" className="text-xs text-green-700 hover:text-green-800 transition-colors">
          See the full list
        </a>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-sm text-zinc-900">Recommended topics</h3>
        <div className="flex flex-wrap gap-2">
          {topics.length === 0 ? (
            <p className="text-xs text-zinc-500">No topics yet. Topics appear as stories are published.</p>
          ) : (
            topics.map((topic) => (
              <button
                key={topic}
                type="button"
                className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-full text-xs font-medium text-zinc-800 transition-colors"
              >
                {topic}
              </button>
            ))
          )}
        </div>
        {topics.length > 0 && (
          <a href="/membership" className="text-xs text-green-700 hover:text-green-800 transition-colors">
            See more topics
          </a>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-sm text-zinc-900">Who to follow</h3>
        <div className="space-y-6">
          {writers.slice(0, 3).map((user) => (
            <div key={user.id} className="flex gap-3">
              <img
                src={user.image || PLACEHOLDER_IMAGE}
                alt=""
                className="w-8 h-8 rounded-full shrink-0 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-sm font-bold truncate text-zinc-900">{user.name}</span>
                  <button
                    type="button"
                    onClick={() => onFollow(user.id)}
                    className="px-4 py-1 border border-zinc-200 hover:border-zinc-900 rounded-full text-xs font-medium transition-colors"
                  >
                    {following.includes(user.id) ? "Following" : "Follow"}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{user.bio}</p>
              </div>
            </div>
          ))}
        </div>
        <a href="/writers" className="text-xs text-green-700 hover:text-green-800 transition-colors">
          See suggestions
        </a>
      </section>
    </aside>
  );
}
