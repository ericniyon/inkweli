
import React from 'react';
import { WRITERS } from '../constants';

const WritersView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 animate-fade-in">
      <header className="mb-24 text-center animate-fade-up">
        <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">The Voices</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">Meet the independent thinkers and journalists bringing you the news from the heart of the region.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        {WRITERS.map((writer, i) => (
          <div key={i} className="group relative animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="mb-8 relative">
              <div className="aspect-square rounded-[3rem] overflow-hidden bg-slate-100 border border-slate-100 shadow-xl relative z-10">
                <img src={writer.image} alt={writer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-600 rounded-[2rem] -z-0 opacity-10 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="px-4">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">{writer.role}</p>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter group-hover:text-indigo-600 transition-colors">{writer.name}</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">{writer.bio}</p>
              
              <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                <div className="flex gap-4">
                   <a href={writer.socials.twitter} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                   </a>
                   <a href={writer.socials.linkedin} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                   </a>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Articles</p>
                   <p className="text-lg font-black text-slate-900 leading-none">{writer.articlesCount}</p>
                </div>
              </div>

              <button className="w-full mt-10 bg-slate-900 text-white text-[10px] font-black py-5 rounded-[1.5rem] tracking-[0.2em] uppercase hover:bg-indigo-600 transition shadow-xl shadow-slate-200">
                Follow Updates
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WritersView;
