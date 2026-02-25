"use client";

import React from "react";
import Link from "next/link";
import { Article } from "@/types";
import { PLACEHOLDER_IMAGE } from "@/constants";
import OptimizedImage from "./OptimizedImage";
import { ArrowRight } from "lucide-react";

interface RelatedArticleCardProps {
  article: Article;
  variant?: "compact" | "featured";
  onClick?: () => void;
}

/** Compact card for sidebar: content left, image right */
export function RelatedArticleCardCompact({ article, onClick }: RelatedArticleCardProps) {
  return (
    <Link
      href={`/detail/${article.id}`}
      onClick={onClick}
      className="group flex flex-row border border-slate-100 bg-white overflow-hidden hover:border-sky-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out"
    >
      <div className="flex-1 p-4 min-w-0 flex flex-col justify-center">
        <h3 className="font-charter font-bold text-medium-body text-slate-900 leading-snug line-clamp-2">
          {article.title}
        </h3>
        <div className="font-charter flex items-center gap-2 mt-2 text-medium-small text-slate-500">
          <span>{article.authorName}</span>
          <span className="text-slate-300">·</span>
          <span>{article.readingTime} min read</span>
        </div>
      </div>
      <div className="w-28 sm:w-32 flex-shrink-0 aspect-square overflow-hidden bg-slate-100 flex items-center justify-center">
        <OptimizedImage
          src={article.featuredImage || PLACEHOLDER_IMAGE}
          alt={article.title}
          width={128}
          height={128}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
      </div>
    </Link>
  );
}

/** Featured card: content left, image right */
export function RelatedArticleCardFeatured({ article, onClick }: RelatedArticleCardProps) {
  return (
    <Link
      href={`/detail/${article.id}`}
      onClick={onClick}
      className="group flex flex-col sm:flex-row gap-4 border border-slate-100 bg-white overflow-hidden hover:border-sky-200 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out"
    >
      <div className="flex-1 p-4 sm:p-6 sm:pl-6 flex flex-col justify-center min-w-0 order-2 sm:order-1">
        <span className="font-charter text-medium-small font-bold uppercase tracking-wider text-accent mb-1">
          {article.category}
        </span>
        <h3 className="font-charter font-bold text-medium-h3 text-slate-900 leading-snug line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="font-charter text-medium-meta text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        )}
        <div className="font-charter flex items-center gap-2 mt-3 text-medium-small text-slate-500">
          <OptimizedImage
            src={article.authorAvatar || PLACEHOLDER_IMAGE}
            alt={article.authorName}
            width={20}
            height={20}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span>{article.authorName}</span>
          <span className="text-slate-300">·</span>
          <span>{article.readingTime} min read</span>
        </div>
        <span className="font-charter inline-flex items-center gap-1 mt-2 text-medium-small font-bold text-slate-900">
          Read story
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
        </span>
      </div>
      <div className="min-w-0 w-full sm:w-40 aspect-video sm:aspect-square overflow-hidden bg-slate-100 flex-shrink-0 order-1 sm:order-2 flex items-center justify-center">
        <OptimizedImage
          src={article.featuredImage || PLACEHOLDER_IMAGE}
          alt={article.title}
          width={400}
          height={300}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
      </div>
    </Link>
  );
}

export default RelatedArticleCardCompact;
