
import React from 'react';
import { Article } from '../types';
import { PLACEHOLDER_IMAGE } from '../constants';

interface TrendingSectionProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ articles, onArticleClick }) => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-16 border-b border-slate-100">
      <div className="flex items-center gap-3 mb-10 font-charter">
        <div className="w-6 h-6 rounded-full border border-slate-900 flex items-center justify-center">
          <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        </div>
        <h2 className="text-medium-small font-black text-slate-900 uppercase tracking-[0.2em]">Trending on usethinkup</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 font-charter">
        {articles.slice(0, 6).map((article, idx) => (
          <div 
            key={article.id} 
            className="flex gap-5 p-5 sm:p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-sky-200 hover:-translate-y-0.5 transition-all duration-300 ease-out group cursor-pointer"
            onClick={() => onArticleClick(article)}
          >
            <span className="text-3xl sm:text-4xl font-black text-slate-200 group-hover:text-indigo-200 transition-colors duration-300 tracking-tighter leading-none flex-shrink-0">
              0{idx + 1}
            </span>
            <div className="flex-grow space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <img src={article.authorAvatar || PLACEHOLDER_IMAGE} className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200" alt="" />
                <span className="text-medium-small font-bold text-slate-900 truncate">{article.authorName}</span>
              </div>
              <h3 className="text-medium-h3 font-black text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 text-medium-small text-slate-400 font-bold uppercase tracking-wider">
                <span>{article.publishDate}</span>
                <span>•</span>
                <span>{article.readingTime} min read</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingSection;
