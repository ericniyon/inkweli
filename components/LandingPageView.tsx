"use client";

import React, { useMemo } from "react";
import { Article, Category } from "../types";
import { PLACEHOLDER_IMAGE } from "../constants";
import TrendingSection from "./TrendingSection";
import { useSiteLayout } from "@/lib/site-layout-context";

interface LandingPageViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onGetStarted: () => void;
  onCategoryClick?: (category: Category) => void;
}

const LandingPageView: React.FC<LandingPageViewProps> = ({ articles, onArticleClick, onGetStarted, onCategoryClick }) => {
  const { showHero, showTrending } = useSiteLayout();

  // Categories that have at least one article, sorted by article count (desc)
  const categoriesWithCount = useMemo(() => {
    const countByCategory = new Map<string, number>();
    articles.forEach((a) => {
      const cat = a.category;
      countByCategory.set(cat, (countByCategory.get(cat) ?? 0) + 1);
    });
    return Array.from(countByCategory.entries())
      .map(([name, count]) => ({ name: name as Category, count }))
      .sort((a, b) => b.count - a.count);
  }, [articles]);

  return (
    <div className="animate-fade-in bg-white">
      {/* Hero Section */}
      {showHero && (
      <section className="bg-[#FFC017] border-b border-slate-900 py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl space-y-10">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 leading-[0.95] tracking-tight Charter">
              Think <br /> deeper.
            </h1>
            <p className="text-xl md:text-2xl text-slate-900 font-medium Charter leading-relaxed max-w-lg">
              Discover stories, thinking, and expertise from writers on any topic.
            </p>
            <button 
              onClick={onGetStarted}
              className="bg-slate-900 text-white px-12 py-4 rounded-full text-xl font-bold hover:bg-slate-800 transition shadow-2xl active:scale-95"
            >
              Start reading
            </button>
          </div>
          <div className="hidden lg:block">
            <div className="grid grid-cols-6 gap-2 opacity-80">
               {Array.from({ length: 36 }).map((_, i) => (
                 <div 
                   key={i} 
                   className={`w-8 h-8 rounded-full ${i % 3 === 0 ? 'bg-slate-900' : 'bg-transparent border border-slate-900'} transition-all duration-1000 animate-pulse`} 
                   style={{ animationDelay: `${i * 100}ms` }}
                 />
               ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Trending Section */}
      {showTrending && <TrendingSection articles={articles} onArticleClick={onArticleClick} />}

      {/* Discovery Feed */}
      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row gap-20">
        <main className="flex-1 space-y-16">
          {articles.map((article) => (
            <article 
              key={article.id} 
              className="flex flex-col md:flex-row gap-8 cursor-pointer group"
              onClick={() => onArticleClick(article)}
            >
              <div className="flex-grow space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <img src={article.authorAvatar || PLACEHOLDER_IMAGE} className="w-5 h-5 rounded-full object-cover" alt="" />
                  <span className="text-xs font-bold text-slate-900">{article.authorName}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight group-hover:text-slate-600 transition-colors">
                  {article.title}
                </h2>
                <p className="text-slate-500 line-clamp-3 Charter leading-relaxed text-sm md:text-base">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>{article.publishDate}</span>
                    <span>•</span>
                    <span>{article.readingTime} min read</span>
                    <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full lowercase">{article.category}</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeWidth="2"/></svg>
                  </button>
                </div>
              </div>
              <div className="w-full md:w-48 h-32 md:h-32 bg-slate-100 rounded-sm overflow-hidden flex-shrink-0">
                <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
              </div>
            </article>
          ))}
        </main>

        <aside className="lg:w-80 space-y-12">
          <div className="sticky top-24 space-y-12">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Discover more of what matters to you</h3>
              <div className="flex flex-wrap gap-2">
                {categoriesWithCount.length > 0 ? (
                  categoriesWithCount.map(({ name, count }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onCategoryClick?.(name)}
                      className="px-4 py-2 border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:border-slate-900 hover:text-slate-900 transition"
                    >
                      {name}
                      <span className="ml-1.5 text-slate-400 font-normal">({count})</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No categories yet. Check back after more stories are published.</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LandingPageView;
