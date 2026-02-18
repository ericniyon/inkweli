
import React from 'react';
import { User, Article } from '../types';
import { PLACEHOLDER_IMAGE } from '../constants';

interface ProfileViewProps {
  user: User;
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, articles, onArticleClick, onLogout }) => {
  const isGuest = user.id === 'guest';

  return (
    <div className="animate-fade-in">
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
           <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
              {isGuest ? (
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" /></svg>
              ) : (
                <img src={user.avatar || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
              )}
           </div>
           <div className="text-center sm:text-left flex-1">
              <h1 className="text-4xl font-black text-slate-900 mb-1">{user.name}</h1>
              {!isGuest && (
                <>
                  <p className="text-sm text-slate-500 font-medium mb-4">{user.followersCount} Followers · {user.following.length} Following</p>
                  <p className="text-slate-600 Charter leading-relaxed max-w-xl italic">"{user.bio || 'Sharing thoughts and insights from usethinkup.'}"</p>
                </>
              )}
           </div>
           <div className="flex gap-3">
              {!isGuest ? (
                <>
                  <button className="bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition">Edit profile</button>
                  <button onClick={onLogout} className="px-6 py-2 border border-red-100 text-red-500 rounded-full text-sm font-bold hover:bg-red-50 transition">Sign out</button>
                </>
              ) : (
                <button className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition">Sign in to edit</button>
              )}
           </div>
        </div>

        <div className="flex items-center gap-8 border-b border-slate-100 mb-12">
          <button className="text-sm font-bold text-slate-900 pb-4 border-b-2 border-slate-900 -mb-[17px]">Home</button>
          <button className="text-sm font-medium text-slate-400 pb-4 hover:text-slate-900 transition">About</button>
        </div>

        <div className="space-y-16">
          {articles.length > 0 ? articles.map(article => (
            <div key={article.id} className="group cursor-pointer" onClick={() => onArticleClick(article)}>
              <div className="flex items-center gap-2 mb-3">
                  <img src={article.authorAvatar || PLACEHOLDER_IMAGE} className="w-5 h-5 rounded-full" alt="" />
                  <span className="text-[10px] font-bold text-slate-900">{article.authorName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] text-slate-400 uppercase">{article.publishDate}</span>
              </div>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-grow">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-slate-600 transition-colors">{article.title}</h2>
                  <p className="text-slate-600 line-clamp-2 mb-4 Charter leading-relaxed text-sm">{article.excerpt}</p>
                  <div className="flex items-center gap-4">
                     <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{article.category}</span>
                     <span className="text-xs text-slate-400 font-medium">{article.readingTime} min read</span>
                  </div>
                </div>
                {article.featuredImage && (
                  <div className="w-full md:w-32 h-24 rounded overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <p className="text-slate-400 font-medium">{isGuest ? 'Sign in to see your stories.' : "You haven't published any stories yet."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
