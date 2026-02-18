
import React from 'react';
import { Article } from '../types';

interface Props {
  article: Article;
}

const ArticleCard: React.FC<Props> = ({ article }) => {
  return (
    <div className="py-8 border-b border-zinc-100 last:border-0 group cursor-pointer">
      <div className="flex justify-between gap-8">
        <div className="flex-1 space-y-2">
          {/* Author Header */}
          <div className="flex items-center gap-2 text-xs mb-3">
            <img 
              src={article.author.avatar} 
              alt={article.author.name} 
              className="w-5 h-5 rounded-full"
            />
            <span className="font-bold text-zinc-800">{article.author.name}</span>
            <span className="text-zinc-400">in</span>
            <span className="font-bold text-zinc-800">{article.category}</span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-400">{article.publishDate}</span>
            {article.isMemberOnly && (
              <div className="flex items-center gap-1 text-yellow-600 font-bold ml-auto">
                <i className="fa-solid fa-star text-[10px]"></i>
                <span className="uppercase text-[10px] tracking-tight">Member-only</span>
              </div>
            )}
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold leading-tight group-hover:underline text-zinc-900">
            {article.title}
          </h2>
          <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">
            {article.summary}
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-4 text-zinc-400 text-xs">
              <button className="hover:text-zinc-900 transition-colors">
                <i className="fa-regular fa-bookmark"></i>
              </button>
              <button className="hover:text-zinc-900 transition-colors">
                <i className="fa-regular fa-thumbs-down"></i>
              </button>
              <span>{article.publishDate}</span>
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-angles-right text-[10px]"></i>
                <span>{article.views}</span>
              </div>
            </div>
            <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <i className="fa-solid fa-ellipsis"></i>
            </button>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="w-28 h-28 sm:w-40 sm:h-28 shrink-0 overflow-hidden rounded border border-zinc-50">
          <img 
            src={article.thumbnail} 
            alt={article.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
