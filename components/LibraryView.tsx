
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
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black text-slate-900">Your library</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition">
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
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 group cursor-pointer hover:border-slate-300 transition-all">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-xl font-black text-slate-900 mb-1">Reading list</h2>
                   <p className="text-sm text-slate-500 font-medium">{bookmarks.length} stories · Private</p>
                </div>
                <div className="flex -space-x-4">
                   {bookmarks.slice(0, 3).map((art, i) => (
                      <div key={art.id} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-sm" style={{ zIndex: 3 - i }}>
                         <img src={art.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="space-y-8 mt-10">
                {bookmarks.map(article => (
                   <div key={article.id} onClick={(e) => { e.stopPropagation(); onArticleClick(article); }} className="flex gap-6 group/item">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <img src={article.authorAvatar || PLACEHOLDER_IMAGE} className="w-4 h-4 rounded-full" alt="" />
                          <span className="text-[10px] font-bold text-slate-900">{article.authorName}</span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 leading-tight group-hover/item:text-slate-600 transition-colors line-clamp-2">{article.title}</h3>
                      </div>
                      <div className="w-16 h-12 rounded bg-slate-200 overflow-hidden flex-shrink-0">
                         <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
                      </div>
                   </div>
                ))}
                {bookmarks.length === 0 && (
                   <div className="text-center py-10">
                      <p className="text-slate-400 text-sm">No stories saved yet.</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Highlights' && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
           <p className="text-slate-400 font-medium Charter">Highlight snippets from stories you read to see them here.</p>
        </div>
      )}

      {activeTab === 'Reading history' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center mb-8">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recently viewed</span>
              <button className="text-xs font-bold text-slate-400 hover:text-red-500">Clear history</button>
           </div>
           {bookmarks.slice(0, 2).map(article => (
              <div key={article.id} onClick={() => onArticleClick(article)} className="flex items-center gap-4 cursor-pointer group">
                 <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden">
                    <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900 line-clamp-1 group-hover:underline">{article.title}</h4>
                    <p className="text-[10px] text-slate-400">{article.authorName} · Viewed 2h ago</p>
                 </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default LibraryView;
