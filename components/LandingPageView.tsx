"use client";

import React, { useMemo } from "react";
import { Article, Category } from "../types";
import { PLACEHOLDER_IMAGE } from "../constants";
import OptimizedImage from "./OptimizedImage";
import Logo from "./Logo";

interface LandingPageViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onGetStarted?: () => void;
  onCategoryClick?: (category: Category) => void;
}

const GTM_CATEGORY: Category = "Business (GTM)";
const POLITICS_CATEGORY: Category = "Politics";

const LandingPageView: React.FC<LandingPageViewProps> = ({ articles, onArticleClick }) => {
  // Most recent first; then split by Business (GTM) and Politics
  const sorted = useMemo(
    () => [...articles].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()),
    [articles]
  );
  const businessArticles = useMemo(() => sorted.filter((a) => a.category === GTM_CATEGORY), [sorted]);
  const politicsArticles = useMemo(() => sorted.filter((a) => a.category === POLITICS_CATEGORY), [sorted]);

  const ArticleList = ({ list, label }: { list: Article[]; label: string }) => (
    <div className="mb-12">
      <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 mb-6">
        {label}
      </h2>
      <ul className="space-y-4">
        {list.length === 0 ? (
          <li className="text-slate-500 text-sm italic">No articles in this category yet.</li>
        ) : (
          list.map((article) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => onArticleClick(article)}
                className="text-left w-full group flex items-center gap-3 py-2 rounded-lg hover:bg-slate-50 transition"
              >
                <span className="flex-1 text-slate-900 font-semibold group-hover:text-indigo-600 transition line-clamp-1">
                  {article.title}
                </span>
                <span className="text-xs text-slate-400 shrink-0">{article.publishDate}</span>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <div className="animate-fade-in bg-white">
      {/* Hero: logo, brand, tagline */}
      <section className="border-b border-slate-200 py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Logo size="md" />
            <span className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">ThinkUp</span>
          </div>
          <p className="text-xl md:text-2xl text-slate-600 font-medium Charter leading-relaxed">
            Knowledge that Wins You Markets
          </p>
        </div>
      </section>

      {/* Two lists: Business (GTM) and Politics */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <ArticleList list={businessArticles} label="Business (GTM)" />
        <ArticleList list={politicsArticles} label="Politics" />
      </div>
    </div>
  );
};

export default LandingPageView;
