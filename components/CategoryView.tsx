
import React from 'react';
import { Article, Category } from '../types';
import { MOCK_ARTICLES, PLACEHOLDER_IMAGE } from '../constants';

interface CategoryViewProps {
  topic: Category;
  onArticleClick: (article: Article) => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({ topic, onArticleClick }) => {
  const filteredArticles = MOCK_ARTICLES.filter(a => a.category === topic);
  
  const categoryManifestos: Record<Category, string> = {
    "Business (GTM)": "Go-to-market strategy, positioning, and execution that wins you markets—practical intelligence for leaders.",
    Politics: "Deciphering the corridors of power, diplomatic maneuvers, and the policies shaping Rwanda's governance.",
    Economy: "Analysis of market trends, fiscal strategy, and the grassroots innovation driving regional prosperity.",
    Culture: "A mirror to the soul of the nation, celebrating contemporary art, heritage, and the evolving identity of East Africa.",
    Technology: "Reporting from the Silicon Valley of Africa—where code meets community and innovation scales.",
    Science: "Exploring the frontiers of research, health, and environmental stewardship across the continent.",
    Opinion: "Provocative perspectives and rigorous arguments from the region's leading intellectual voices.",
    General: "Curated insights covering the breadth of the East African experience."
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 animate-fade-in">
      <header className="mb-24 flex flex-col items-center text-center animate-fade-up">
        <div className="mb-8">
           <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] border-b-2 border-indigo-600 pb-2">
             Section / {topic}
           </span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter">
          {topic}
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl font-medium leading-relaxed italic">
          "{categoryManifestos[topic]}"
        </p>
      </header>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-40 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 animate-fade-in">
           <p className="text-slate-400 font-black uppercase tracking-widest">New stories in production for this section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-24">
            {filteredArticles.map((article, idx) => (
              <div 
                key={article.id} 
                className="group cursor-pointer flex flex-col md:flex-row gap-10 animate-fade-up"
                style={{ animationDelay: `${idx * 100}ms` }}
                onClick={() => onArticleClick(article)}
              >
                <div className="w-full md:w-80 flex-shrink-0">
                  <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-lg border border-slate-100">
                     <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  </div>
                </div>
                <div className="flex-grow pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{article.publishDate}</p>
                  <h3 className="text-3xl font-black text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-6 font-medium line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">By {article.authorName}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{article.readingTime} MIN READ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Category Sidebar */}
          <div className="lg:col-span-4 animate-slide-right delay-300">
            <div className="sticky top-32 space-y-16">
               <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                  <h4 className="text-lg font-black mb-6 tracking-tight">The {topic} Briefing</h4>
                  <p className="text-xs text-white/50 leading-relaxed mb-8 font-medium">Get exclusive analysis in this field delivered directly to your inbox before it goes public.</p>
                  <button className="w-full bg-indigo-600 text-white text-[10px] font-black py-4 rounded-2xl tracking-widest uppercase hover:bg-indigo-700 transition">Join the List</button>
               </div>
               
               <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-4">
                    Top in {topic}
                    <div className="flex-grow h-px bg-slate-100" />
                  </h4>
                  <div className="space-y-8">
                     {MOCK_ARTICLES.slice(0, 3).map((art, i) => (
                       <div key={i} className="group cursor-pointer flex gap-4 animate-fade-in" style={{ animationDelay: `${500 + (i * 100)}ms` }} onClick={() => onArticleClick(art)}>
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50">
                            <img src={art.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors mb-1">{art.title}</h5>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{art.authorName}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryView;
