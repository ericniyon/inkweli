
import React, { useState } from 'react';
import { Article } from '../types';

interface StoriesManagementViewProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onNew: () => void;
}

const StoriesManagementView: React.FC<StoriesManagementViewProps> = ({ articles, onEdit, onNew }) => {
  const [activeTab, setActiveTab] = useState<'Drafts' | 'Published' | 'Responses'>('Published');

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black text-slate-900">Your stories</h1>
        <div className="flex gap-3">
           <button onClick={onNew} className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition">
             Write a story
           </button>
           <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-slate-50 transition">
             Import a story
           </button>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-100 mb-10">
        {['Drafts', 'Published', 'Responses'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            className={`text-sm font-medium pb-4 border-b transition-colors ${activeTab === tab ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-900'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {activeTab === 'Published' && (
          articles.length > 0 ? (
            articles.map(article => (
              <div key={article.id} className="group border-b border-slate-50 pb-8 last:border-0">
                <h2 className="text-xl font-black text-slate-900 mb-2 cursor-pointer hover:underline" onClick={() => onEdit(article)}>{article.title}</h2>
                <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                  <span>Published on {article.publishDate}</span>
                  <span>·</span>
                  <span>{article.readingTime} min read</span>
                  <div className="flex items-center gap-1 ml-4 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76 1.128a1 1 0 01.737.97V11a1 1 0 01-1 1h-2.222l1.64 5.467a1 1 0 01-.65 1.222l-.768.256a1 1 0 01-1.222-.65L12 14z" strokeWidth="2"/></svg>
                    {article.claps} claps
                  </div>
                  <button className="ml-auto text-slate-400 hover:text-slate-900"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2"/></svg></button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-slate-400 italic">No published stories yet.</p>
            </div>
          )
        )}

        {activeTab === 'Drafts' && (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-slate-400 font-medium">You have no drafts. Start a new story to see it here.</p>
          </div>
        )}

        {activeTab === 'Responses' && (
          <div className="py-20 text-center">
            <p className="text-slate-400 italic">No responses from others yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesManagementView;
