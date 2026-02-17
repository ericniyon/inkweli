
import React from 'react';
import { Article } from '../types';

interface TrendingSectionProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ articles, onArticleClick }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 border-b border-slate-100">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-6 h-6 rounded-full border border-slate-900 flex items-center justify-center">
          <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        </div>
        <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Trending on usethinkup</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
        {articles.slice(0, 6).map((article, idx) => (
          <div 
            key={article.id} 
            className="flex gap-6 group cursor-pointer"
            onClick={() => onArticleClick(article)}
          >
            <span className="text-4xl font-black text-slate-100 group-hover:text-slate-200 transition-colors tracking-tighter leading-none">
              0{idx + 1}
            </span>
            <div className="flex-grow space-y-2">
              <div className="flex items-center gap-2">
                <img src={article.authorAvatar} className="w-5 h-5 rounded-full object-cover" />
                <span className="text-[11px] font-bold text-slate-900">{article.authorName}</span>
              </div>
              <h3 className="text-base font-black text-slate-900 leading-snug group-hover:opacity-70 transition line-clamp-2">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
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
