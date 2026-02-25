
import React, { useState } from 'react';
import { Article } from '../types';
import { PLACEHOLDER_IMAGE } from '../constants';

interface LibraryViewProps {
  bookmarks: Article[];
  onArticleClick: (article: Article) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ bookmarks, onArticleClick }) => {
  const [activeTab, setActiveTab] = useState<'Lists' | 'Highlights' | 'Reading history'>('Lists');

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex justify-between items-center mb-12 font-charter">
        <h1 className="text-medium-h1 md:text-3xl font-black text-slate-900">Your library</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-full text-medium-meta font-bold hover:bg-emerald-700 transition">
          New list
        </button>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-100 mb-10">
        {['Lists', 'Highlights', 'Reading history'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            className={`text-sm font-medium pb-4 border-b transition-colors ${activeTab === tab ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-900'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Lists' && (
        <div className="space-y-12">
          {/* Default Reading List */}
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 group cursor-pointer hover:border-slate-300 transition-all font-charter">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-medium-h3 font-black text-slate-900 mb-1">Reading list</h2>
                   <p className="text-medium-meta text-slate-500 font-medium">{bookmarks.length} stories · Private</p>
                </div>
                <div className="flex -space-x-4">
                   {bookmarks.slice(0, 3).map((art, i) => (
                      <div key={art.id} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-sm" style={{ zIndex: 3 - i }}>
                         <img src={art.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="space-y-4 mt-10">
                {bookmarks.map(article => (
                   <div key={article.id} onClick={(e) => { e.stopPropagation(); onArticleClick(article); }} className="flex gap-5 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-sky-200 hover:-translate-y-0.5 transition-all duration-300 ease-out group/item cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <img src={article.authorAvatar || PLACEHOLDER_IMAGE} className="w-5 h-5 rounded-full ring-1 ring-slate-200 object-cover" alt="" />
                          <span className="text-medium-small font-bold text-slate-900 truncate">{article.authorName}</span>
                        </div>
                        <h3 className="text-medium-h3 font-black text-slate-900 leading-tight group-hover/item:text-indigo-600 transition-colors duration-200 line-clamp-2">{article.title}</h3>
                      </div>
                      <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 ring-1 ring-slate-100 group-hover/item:ring-slate-200 transition-all duration-300">
                         <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500 ease-out" alt="" />
                      </div>
                   </div>
                ))}
                {bookmarks.length === 0 && (
                   <div className="text-center py-10">
                      <p className="text-slate-400 text-medium-meta">No stories saved yet.</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Highlights' && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
           <p className="text-slate-400 font-charter font-medium text-medium-body">Highlight snippets from stories you read to see them here.</p>
        </div>
      )}

      {activeTab === 'Reading history' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center mb-8 font-charter">
              <span className="text-medium-small font-bold text-slate-400 uppercase tracking-widest">Recently viewed</span>
              <button className="text-medium-small font-bold text-slate-400 hover:text-red-500">Clear history</button>
           </div>
           {bookmarks.slice(0, 2).map(article => (
              <div key={article.id} onClick={() => onArticleClick(article)} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-sky-200 hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer group font-charter">
                 <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-slate-200 group-hover:ring-slate-300 transition-all duration-300">
                    <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" alt="" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="text-medium-meta font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-200">{article.title}</h4>
                    <p className="text-medium-small text-slate-400">{article.authorName} · Viewed 2h ago</p>
                 </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default LibraryView;
