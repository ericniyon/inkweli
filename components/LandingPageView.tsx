"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Target, Search, Filter, Lightbulb, BookOpen, TrendingUp, BarChart2, Sparkles } from "lucide-react";
import { Article, Category } from "@/types";
import { PLACEHOLDER_IMAGE } from "@/constants";
import OptimizedImage from "./OptimizedImage";

interface LandingPageViewProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onGetStarted?: () => void;
  onCategoryClick?: (category: Category) => void;
  /** When provided, use controlled search (e.g. from header) */
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  activeCategory?: string;
  onActiveCategoryChange?: (value: string) => void;
}

const CATEGORIES_ALL: string[] = [
  "ALL",
  "Business (GTM)",
  "Politics",
  "Technology",
  "Economy",
  "Culture",
  "Science",
  "Opinion",
  "General",
];

const LandingPageView: React.FC<LandingPageViewProps> = ({
  articles,
  onArticleClick,
  searchQuery: controlledSearch,
  onSearchQueryChange,
  activeCategory: controlledCategory,
  onActiveCategoryChange,
}) => {
  const [internalCategory, setInternalCategory] = useState("ALL");
  const [internalSearch, setInternalSearch] = useState("");
  const activeCategory = controlledCategory ?? internalCategory;
  const setActiveCategory = useCallback(
    (v: string) => (onActiveCategoryChange ? onActiveCategoryChange(v) : setInternalCategory(v)),
    [onActiveCategoryChange]
  );
  const searchQuery = controlledSearch ?? internalSearch;
  const setSearchQuery = useCallback(
    (v: string) => (onSearchQueryChange ? onSearchQueryChange(v) : setInternalSearch(v)),
    [onSearchQueryChange]
  );
  const INITIAL_VISIBLE = 4;
  const LOAD_MORE_STEP = 4;
  const [visibleRestCount, setVisibleRestCount] = useState(INITIAL_VISIBLE);

  const loadMore = useCallback(() => {
    setVisibleRestCount((prev) => prev + LOAD_MORE_STEP);
  }, []);

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) loadMore();
        });
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleRestCount, loadMore]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === "ALL" || article.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [articles, activeCategory, searchQuery]);

  const categoriesInData = useMemo(() => {
    const set = new Set(articles.map((a) => a.category));
    return CATEGORIES_ALL.filter((c) => c === "ALL" || set.has(c as Category));
  }, [articles]);

  const restArticles = useMemo(() => filteredArticles.slice(1), [filteredArticles]);
  const restArticlesVisible = useMemo(
    () => restArticles.slice(0, visibleRestCount),
    [restArticles, visibleRestCount]
  );
  const hasMoreRest = restArticles.length > visibleRestCount;

  const categoryAuthors = useMemo(() => {
    if (activeCategory === "ALL") return [];
    const byId = new Map<string, { authorName: string; count: number }>();
    filteredArticles.forEach((a) => {
      const existing = byId.get(a.authorId);
      if (existing) existing.count += 1;
      else byId.set(a.authorId, { authorName: a.authorName, count: 1 });
    });
    return Array.from(byId.entries()).map(([id, { authorName, count }]) => ({ authorId: id, authorName, count }));
  }, [activeCategory, filteredArticles]);
  const isCategoryFiltered = activeCategory !== "ALL";

  React.useEffect(() => {
    setVisibleRestCount(INITIAL_VISIBLE);
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero — match thinkup reference */}
      <section
        className="relative pt-32 pb-24 flex flex-col items-center text-center overflow-hidden bg-[#FAFAFA] border-b border-gray-100"
        aria-label="Welcome"
      >
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.05, scale: 1 }}
            transition={{ duration: 2 }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-accent rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.05, scale: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent rounded-full blur-3xl"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-6xl px-6 relative"
        >
          <h1 className="font-charter font-bold text-medium-display tracking-tight text-slate-900 mb-8">
            ThinkUp<span className="text-accent">.</span>
          </h1>
          <p className="text-medium-h2 md:text-medium-h1 font-charter text-gray-500 max-w-2xl mx-auto leading-relaxed italic">
            &ldquo;Knowledge that Wins You Markets&rdquo;
          </p>
        </motion.div>
        {/* Animated background icons — visible but subtle */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [0, -24, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[8%] top-[18%] text-slate-300/70"
            aria-hidden
          >
            <Target size={100} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[12%] bottom-[22%] text-slate-300/70"
            aria-hidden
          >
            <Search size={88} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            animate={{ y: [0, -16, 0], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[18%] top-[25%] text-slate-300/75"
            aria-hidden
          >
            <Lightbulb size={64} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            animate={{ y: [0, 14, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[15%] bottom-[28%] text-slate-300/65"
            aria-hidden
          >
            <BookOpen size={72} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            animate={{ y: [0, -12, 0], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[25%] top-[12%] text-slate-300/70"
            aria-hidden
          >
            <TrendingUp size={56} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute right-[8%] top-[35%] text-slate-300/60"
            aria-hidden
          >
            <BarChart2 size={48} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[75%] top-[8%] text-slate-300/70"
            aria-hidden
          >
            <Sparkles size={44} strokeWidth={1.5} />
          </motion.div>
          <motion.div
            animate={{ y: [0, 18, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[28%] bottom-[12%] text-slate-300/55"
            aria-hidden
          >
            <BookOpen size={52} strokeWidth={1.25} />
          </motion.div>
        </div>
      </section>

      {/* Filters bar — match reference (Filter label + category pills) */}
      <div className="max-w-[1600px] mx-auto px-6 mb-12">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar border-b border-gray-100 pb-4">
          <div className="flex-shrink-0 flex items-center gap-2 text-black mr-4">
            <Filter size={14} />
            <span className="text-[10px] font-extrabold tracking-widest uppercase">Filter</span>
          </div>
          {categoriesInData.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-extrabold tracking-widest uppercase transition-all ${
                activeCategory === cat
                  ? "bg-black text-white shadow-lg shadow-black/10"
                  : "text-gray-400 hover:text-black hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main content — category header when filtered, then Featured + grid or list */}
      <div className="max-w-7xl mx-auto px-6 pb-24 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + searchQuery}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-16"
          >
            {filteredArticles.length > 0 ? (
              <>
                {isCategoryFiltered ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {/* Row 1: Featured Insight full width */}
                    <div className="lg:col-span-12">
                      <div className="space-y-6">
                        <h2 className="text-[13px] font-medium uppercase tracking-widest text-gray-500">Featured Insight</h2>
                        {filteredArticles.slice(0, 1).map((article, index) => (
                          <motion.div
                            key={article.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group flex flex-col gap-8 items-start p-0 border-none transition-all duration-300 ease-out hover:-translate-y-1"
                          >
                            <div className="flex flex-col md:flex-row gap-8 items-start w-full p-6 md:p-8 border border-sky-200 rounded-lg">
                              <div className="space-y-4 flex-grow min-w-0 order-2 md:order-1">
                                <span className="text-[13px] font-medium uppercase tracking-widest text-accent">{article.category}</span>
                                <div className="space-y-3">
                                  <Link href={`/detail/${article.id}`} onClick={() => onArticleClick(article)} className="font-charter font-bold text-medium-title tracking-tight text-slate-900 block cursor-pointer">
                                    {article.title}
                                  </Link>
                                  <div className="flex items-center gap-2 text-medium-meta text-gray-500">
                                    <span className="text-slate-900 font-semibold">{article.authorName}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span>{article.publishDate}</span>
                                  </div>
                                  <p className="font-charter text-medium-body leading-relaxed text-gray-500">{article.excerpt}</p>
                                </div>
                                <Link href={`/detail/${article.id}`} onClick={() => onArticleClick(article)} className="text-[13px] font-medium uppercase tracking-widest text-slate-900 font-bold flex items-center gap-2 group/btn">
                                  Read Full Insight
                                  <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
                                </Link>
                              </div>
                              <Link href={`/detail/${article.id}`} onClick={() => onArticleClick(article)} className="relative w-full md:w-1/2 aspect-[16/9] flex-shrink-0 bg-gray-50 overflow-hidden cursor-pointer block order-1 md:order-2 flex items-center justify-center border border-sky-200 transition-all duration-300">
                                <OptimizedImage src={article.featuredImage || PLACEHOLDER_IMAGE} alt={article.title} width={600} height={338} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                              </Link>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Row 2: More in [category] (left) + Writers in this section + Briefing (right) */}
                    <div className="lg:col-span-8">
                      {restArticlesVisible.length > 0 ? (
                        <div className="space-y-6">
                          <h2 className="text-[13px] font-medium uppercase tracking-widest text-gray-500">More in {activeCategory}</h2>
                          <div className="space-y-4">
                            {restArticlesVisible.map((article, index) => (
                              <motion.div
                                key={article.id}
                                layout
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group flex flex-col py-6 border-b border-gray-100 last:border-0 border-l-4 border-l-transparent hover:bg-sky-50/30 hover:border-l-sky-200 hover:-translate-y-0.5 px-4 -mx-4 transition-all duration-300 ease-out rounded-xl"
                              >
                                <div className="flex items-start gap-6 w-full">
                                  <div className="flex-grow space-y-2 min-w-0">
                                    <Link href={`/detail/${article.id}`} onClick={() => onArticleClick(article)} className="font-charter font-bold text-medium-body text-slate-900 block cursor-pointer line-clamp-2">
                                      {article.title}
                                    </Link>
                                    <div className="flex items-center gap-2 text-medium-meta text-gray-500">
                                      <span className="text-slate-900">{article.authorName}</span>
                                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                                      <span>{article.publishDate}</span>
                                    </div>
                                    <p className="text-medium-small text-gray-500 leading-relaxed line-clamp-2">{article.excerpt}</p>
                                    <Link href={`/detail/${article.id}`} onClick={() => onArticleClick(article)} className="text-[9px] font-medium uppercase tracking-widest text-slate-900 font-bold flex items-center gap-1 group/btn">
                                      Read More
                                      <ArrowRight size={10} className="transition-transform duration-200 group-hover/btn:translate-x-1" />
                                    </Link>
                                  </div>
                                  <Link href={`/detail/${article.id}`} onClick={() => onArticleClick(article)} className="w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-100 overflow-hidden cursor-pointer block flex items-center justify-center border border-slate-200/80 group-hover:border-sky-300 transition-all duration-300">
                                    <OptimizedImage src={article.featuredImage || PLACEHOLDER_IMAGE} alt={article.title} width={160} height={160} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
                                  </Link>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {hasMoreRest && <div ref={loadMoreSentinelRef} className="h-12 flex-shrink-0" aria-hidden />}
                    </div>
                    <aside className="lg:col-span-4 space-y-10">
                      {categoryAuthors.length > 0 && (
                        <div className="font-charter">
                          <h4 className="text-medium-small font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-4">
                            Writers in this section
                            <div className="flex-grow h-px bg-slate-100" />
                          </h4>
                          <div className="space-y-4">
                            {categoryAuthors.map(({ authorId, authorName, count }) => (
                              <div key={authorId} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                                <span className="font-bold text-slate-900 text-medium-meta">{authorName}</span>
                                <span className="text-medium-small font-medium text-slate-500">{count} {count === 1 ? "story" : "stories"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="bg-slate-900 rounded-2xl p-8 text-white font-charter">
                        <h4 className="text-medium-h3 font-black mb-4 tracking-tight">The {activeCategory} Briefing</h4>
                        <p className="text-medium-meta text-white/70 leading-relaxed mb-6">Get exclusive analysis in this section delivered to your inbox before it goes public.</p>
                        <button type="button" className="w-full bg-sky-500 text-white text-medium-small font-bold py-3.5 rounded-xl tracking-widest uppercase hover:bg-sky-600 transition">
                          Join the list
                        </button>
                      </div>
                      <div className="font-charter">
                        <h4 className="text-medium-small font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-4">
                          Recommended topics
                          <div className="flex-grow h-px bg-slate-100" />
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {categoriesInData.filter((c) => c !== "ALL" && c !== activeCategory).slice(0, 5).map((cat) => (
                            <button key={cat} type="button" onClick={() => setActiveCategory(cat)} className="px-3 py-1.5 rounded-full text-medium-small font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="font-charter">
                        <h4 className="text-medium-small font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-4">
                          Who to follow
                          <div className="flex-grow h-px bg-slate-100" />
                        </h4>
                        <div className="space-y-3">
                          {categoryAuthors.slice(0, 4).map(({ authorId, authorName }) => (
                            <div key={authorId} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="font-bold text-slate-900 text-medium-meta truncate">{authorName}</span>
                              <button type="button" className="flex-shrink-0 text-xs font-bold text-sky-600 hover:text-sky-700 uppercase tracking-wider">
                                Follow
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </aside>
                  </div>
                ) : (
                  <>
                {/* Featured Insight — one article, image left / content right */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-[13px] font-medium uppercase tracking-widest text-gray-500">Featured Insight</h2>
                    <div className="h-px flex-grow bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-1 gap-12">
                    {filteredArticles.slice(0, 1).map((article, index) => (
                      <motion.div
                        key={article.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group flex flex-col gap-8 items-start p-0 border-none transition-all duration-300 ease-out hover:-translate-y-1"
                      >
                        <div className="flex flex-col md:flex-row gap-8 items-start w-full p-6 md:p-8 border border-sky-200 rounded-lg">
                          <div className="space-y-4 flex-grow min-w-0 order-2 md:order-1">
                            <span className="text-[13px] font-medium uppercase tracking-widest text-accent">
                              {article.category}
                            </span>
                            <div className="space-y-3">
                              <Link
                                href={`/detail/${article.id}`}
                                onClick={() => onArticleClick(article)}
                                className="font-charter font-bold text-medium-title tracking-tight text-slate-900 block cursor-pointer"
                              >
                                {article.title}
                              </Link>
                              <div className="flex items-center gap-2 text-medium-meta text-gray-500">
                                <span className="text-slate-900 font-semibold">{article.authorName}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>{article.publishDate}</span>
                              </div>
                              <p className="font-charter text-medium-body leading-relaxed text-gray-500">
                                {article.excerpt}
                              </p>
                            </div>
                            <Link
                              href={`/detail/${article.id}`}
                              onClick={() => onArticleClick(article)}
                              className="text-[13px] font-medium uppercase tracking-widest text-slate-900 font-bold flex items-center gap-2 group/btn"
                            >
                              Read Full Insight
                              <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
                            </Link>
                          </div>
                          <Link
                            href={`/detail/${article.id}`}
                            onClick={() => onArticleClick(article)}
                            className="relative w-full md:w-1/2 aspect-[16/9] flex-shrink-0 bg-gray-50 overflow-hidden cursor-pointer block order-1 md:order-2 flex items-center justify-center border border-sky-200 transition-all duration-300"
                          >
                            <OptimizedImage
                              src={article.featuredImage || PLACEHOLDER_IMAGE}
                              alt={article.title}
                              width={600}
                              height={338}
                              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Other articles by category — 2-col grid, load more on scroll */}
                {filteredArticles.length > 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {categoriesInData
                      .filter((c) => c !== "ALL")
                      .map((category) => {
                        const categoryArticles = restArticlesVisible.filter((a) => a.category === category);
                        if (categoryArticles.length === 0) return null;
                        return (
                          <div key={category} className="space-y-8">
                            <div className="flex items-center gap-4">
                              <h2 className="text-[13px] font-medium uppercase tracking-widest text-gray-500">{category}</h2>
                              <div className="h-px flex-grow bg-gray-100" />
                            </div>
                            <div className="space-y-4">
                              {categoryArticles.map((article, index) => (
                                <motion.div
                                  key={article.id}
                                  layout
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="group flex flex-col py-6 border-b border-gray-100 last:border-0 border-l-4 border-l-transparent hover:bg-sky-50/30 hover:border-l-sky-200 hover:-translate-y-0.5 px-4 -mx-4 transition-all duration-300 ease-out rounded-xl"
                                >
                                  <div className="flex items-start gap-6 w-full">
                                    <div className="flex-grow space-y-2 min-w-0">
                                      <Link
                                        href={`/detail/${article.id}`}
                                        onClick={() => onArticleClick(article)}
                                        className="font-charter font-bold text-medium-body text-slate-900 block cursor-pointer line-clamp-2"
                                      >
                                        {article.title}
                                      </Link>
                                      <div className="flex items-center gap-2 text-medium-meta text-gray-500">
                                        <span className="text-slate-900">{article.authorName}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                        <span>{article.publishDate}</span>
                                      </div>
                                      <p className="text-medium-small text-gray-500 leading-relaxed line-clamp-2">
                                        {article.excerpt}
                                      </p>
                                      <Link
                                        href={`/detail/${article.id}`}
                                        onClick={() => onArticleClick(article)}
                                        className="text-[9px] font-medium uppercase tracking-widest text-slate-900 font-bold flex items-center gap-1 group/btn"
                                      >
                                        Read More
                                        <ArrowRight size={10} className="transition-transform duration-200 group-hover/btn:translate-x-1" />
                                      </Link>
                                    </div>
                                    <Link
                                      href={`/detail/${article.id}`}
                                      onClick={() => onArticleClick(article)}
                                      className="w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-100 overflow-hidden cursor-pointer block flex items-center justify-center border border-slate-200/80 group-hover:border-sky-300 transition-all duration-300"
                                    >
                                      <OptimizedImage
                                        src={article.featuredImage || PLACEHOLDER_IMAGE}
                                        alt={article.title}
                                        width={160}
                                        height={160}
                                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                      />
                                    </Link>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
                {hasMoreRest && (
                  <div
                    ref={loadMoreSentinelRef}
                    className="h-12 flex-shrink-0"
                    aria-hidden
                  />
                )}

                  </>
                )}
              </>
            ) : (
              <div className="py-24 flex flex-col items-center text-center text-gray-400">
                <p className="italic text-medium-body mb-2">No insights found in this category.</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("ALL");
                    setSearchQuery("");
                  }}
                  className="text-black font-bold text-medium-small tracking-widest uppercase underline underline-offset-4"
                >
                  View all insights
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LandingPageView;
