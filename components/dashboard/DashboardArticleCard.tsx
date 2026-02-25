"use client";

import React from "react";
import { Article } from "@/types";
import { PLACEHOLDER_IMAGE } from "@/constants";
import OptimizedImage from "@/components/OptimizedImage";

interface Props {
  article: Article;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
  onClick: () => void;
}

const StarIcon = () => (
  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled: boolean }) => (
  <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const EllipsisIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

export default function DashboardArticleCard({ article, onBookmark, isBookmarked, onClick }: Props) {
  const isMemberOnly = true; // could come from article or subscription

  return (
    <div
      className="py-6 px-5 sm:px-6 rounded-2xl border border-zinc-100 bg-white shadow-sm hover:border-sky-200 hover:-translate-y-0.5 transition-all duration-300 ease-out group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between gap-8">
        <div className="flex-1 space-y-2 font-charter min-w-0">
          <div className="flex items-center gap-2 text-medium-meta mb-3 flex-wrap">
            <OptimizedImage
              src={article.authorAvatar || PLACEHOLDER_IMAGE}
              alt={article.authorName}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="font-bold text-zinc-800">{article.authorName}</span>
            <span className="text-zinc-400">in</span>
            <span className="font-bold text-zinc-800">{article.category}</span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-400">{article.publishDate}</span>
            {isMemberOnly && (
              <div className="flex items-center gap-1 text-yellow-600 font-bold ml-auto">
                <StarIcon />
                <span className="uppercase text-medium-small tracking-tight">Member-only</span>
              </div>
            )}
          </div>

          <h2 className="text-medium-h3 font-bold leading-tight group-hover:text-indigo-600 text-zinc-900 transition-colors duration-200">
            {article.title}
          </h2>
          <p className="text-zinc-500 text-medium-body line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>

          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-4 text-zinc-400 text-medium-meta">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark?.(article.id);
                }}
                className="hover:text-zinc-900 transition-colors"
              >
                <BookmarkIcon filled={!!isBookmarked} />
              </button>
              <span>{article.publishDate}</span>
              <div className="flex items-center gap-1">
                <span className="text-medium-small">»»</span>
                <span>{article.claps}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <EllipsisIcon />
            </button>
          </div>
        </div>

        <div className="w-28 h-28 sm:w-40 sm:h-28 shrink-0 overflow-hidden rounded-xl border border-zinc-100 ring-1 ring-zinc-100 group-hover:ring-zinc-200 relative transition-all duration-300">
          <OptimizedImage
            src={article.featuredImage || PLACEHOLDER_IMAGE}
            alt={article.title}
            fill
            sizes="160px"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </div>
      </div>
    </div>
  );
}
