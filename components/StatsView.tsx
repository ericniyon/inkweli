
import React from 'react';
import { Article } from '../types';

interface StatsViewProps {
  articles: Article[];
}

const StatsView: React.FC<StatsViewProps> = ({ articles }) => {
  const totalClaps = articles.reduce((sum, art) => sum + art.claps, 0);
  const totalViews = totalClaps * 12.5; // Mock logic: views are ~12.5x claps

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Stats</h1>
        <p className="text-sm text-slate-500 font-medium">Click on a story's title to see its details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Views</p>
           <h2 className="text-4xl font-black text-slate-900">{Math.round(totalViews).toLocaleString()}</h2>
           <p className="text-emerald-500 text-xs font-bold mt-2">+12% from last month</p>
        </div>
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Reads</p>
           <h2 className="text-4xl font-black text-slate-900">{Math.round(totalViews * 0.4).toLocaleString()}</h2>
           <p className="text-slate-400 text-xs font-bold mt-2">40% read ratio</p>
        </div>
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Claps</p>
           <h2 className="text-4xl font-black text-slate-900">{totalClaps.toLocaleString()}</h2>
           <p className="text-emerald-500 text-xs font-bold mt-2">+8% from last month</p>
        </div>
      </div>

      <div className="mb-10 flex justify-between items-end">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Article performance</h3>
        <span className="text-xs text-slate-400 font-medium italic">Showing last 30 days</span>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Title</th>
                  <th className="px-8 py-4 text-right">Views</th>
                  <th className="px-8 py-4 text-right">Reads</th>
                  <th className="px-8 py-4 text-right">Claps</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {articles.map(article => (
                  <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-900 leading-tight line-clamp-1">{article.title}</p>
                     </td>
                     <td className="px-8 py-6 text-right font-bold text-sm text-slate-600">{Math.round(article.claps * 12.5).toLocaleString()}</td>
                     <td className="px-8 py-6 text-right font-bold text-sm text-slate-600">{Math.round(article.claps * 5.2).toLocaleString()}</td>
                     <td className="px-8 py-6 text-right font-bold text-sm text-indigo-600">{article.claps.toLocaleString()}</td>
                  </tr>
               ))}
               {articles.length === 0 && (
                  <tr>
                     <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No writing data available yet.</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default StatsView;
