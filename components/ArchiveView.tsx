
import React, { useState } from 'react';
import { MOCK_ARTICLES, PLACEHOLDER_IMAGE } from '../constants';
import { Article } from '../types';

interface ArchiveViewProps {
  onArticleClick: (article: Article) => void;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ onArticleClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('All Years');

  const filteredArticles = MOCK_ARTICLES.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'All Years' || art.publishDate.startsWith(selectedYear);
    return matchesSearch && matchesYear;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <header className="mb-20 text-center">
        <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">The Archive</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">Explore our collection of deep dives and insights from past editions.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 mb-16 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search stories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-600 outline-none pr-12"
          />
          <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar w-full md:w-auto">
          {['All Years', '2024', '2023', '2022'].map(year => (
            <button 
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`whitespace-nowrap px-6 py-3 rounded-xl text-xs font-black transition-all ${selectedYear === year ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'}`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed">
          <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No stories found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1 border-y border-slate-100 divide-y divide-slate-100">
          {filteredArticles.map(article => (
            <div 
              key={article.id} 
              className="group py-10 flex flex-col md:flex-row items-start gap-12 cursor-pointer hover:bg-slate-50/50 transition-colors px-6 rounded-3xl"
              onClick={() => onArticleClick(article)}
            >
              <div className="w-full md:w-64 flex-shrink-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{article.publishDate}</p>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
                   <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                </div>
              </div>
              <div className="flex-grow pt-2">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Society & Culture</p>
                <h3 className="text-3xl font-black text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors">{article.title}</h3>
                <p className="text-slate-500 leading-relaxed max-w-2xl mb-6 font-medium">{article.excerpt}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-700">By {article.authorName}</span>
                  <span className="text-slate-200 text-xs">•</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{article.readingTime} MIN READ</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchiveView;
