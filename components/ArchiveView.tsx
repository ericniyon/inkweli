
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
    <div className="max-w-[1600px] mx-auto px-6 py-20">
      <header className="mb-20 text-center font-charter">
        <h1 className="text-medium-h1 md:text-4xl font-black text-slate-900 mb-6 tracking-tight">The Archive</h1>
        <p className="text-medium-body text-slate-500 max-w-2xl mx-auto">Explore our collection of deep dives and insights from past editions.</p>
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
          <p className="text-slate-400 font-charter font-black uppercase tracking-widest text-medium-meta">No stories found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredArticles.map(article => (
            <div 
              key={article.id} 
              className="group py-8 px-6 md:p-8 flex flex-col md:flex-row items-start gap-10 bg-white border border-slate-100 rounded-2xl shadow-md hover:border-sky-200 hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer font-charter"
              onClick={() => onArticleClick(article)}
            >
              <div className="w-full md:w-64 flex-shrink-0">
                <p className="text-medium-meta font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{article.publishDate}</p>
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-slate-100 ring-1 ring-slate-100 group-hover:ring-slate-200 transition-all duration-300">
                   <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" alt="" />
                </div>
              </div>
              <div className="flex-grow pt-2 min-w-0">
                <p className="text-medium-small font-black text-indigo-600 uppercase tracking-widest mb-3">Society & Culture</p>
                <h3 className="text-medium-h1 font-black text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors duration-200">{article.title}</h3>
                <p className="text-medium-body text-slate-500 leading-relaxed max-w-2xl mb-6 font-medium">{article.excerpt}</p>
                <div className="flex items-center gap-4 text-medium-meta">
                  <span className="font-bold text-slate-700">By {article.authorName}</span>
                  <span className="text-slate-200">•</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest">{article.readingTime} MIN READ</span>
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
