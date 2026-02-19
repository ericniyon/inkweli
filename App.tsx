"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Article, Category } from './types';
import { WRITERS, PLACEHOLDER_IMAGE } from './constants';
import type { WriterItem } from './lib/articles-server';
import { useAuth } from './lib/auth-context';
import StoryEditor from './components/StoryEditor';
import ProfileView from './components/ProfileView';
import Logo from './components/Logo';
import SiteHeader from './components/SiteHeader';
import LibraryView from './components/LibraryView';
import StoriesManagementView from './components/StoriesManagementView';
import StatsView from './components/StatsView';
import LandingPageView from './components/LandingPageView';
import Footer from './components/Footer';

type View = 'FEED' | 'WRITE' | 'PROFILE' | 'LIBRARY' | 'STATS' | 'STORIES';

type AppProps = {
  initialArticles?: Article[];
  initialWriters?: WriterItem[];
};

const App: React.FC<AppProps> = ({ initialArticles = [], initialWriters }) => {
  const { user, setUser, isGuest, logout, hydrated } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>('FEED');
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [writers, setWriters] = useState<WriterItem[]>(initialWriters?.length ? initialWriters : WRITERS);
  const [activeTab, setActiveTab] = useState<'For you' | 'Following'>('For you');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Sync server data when props change (e.g. navigation)
  useEffect(() => {
    if (initialArticles.length > 0) setArticles(initialArticles);
  }, [initialArticles]);
  useEffect(() => {
    if (initialWriters && initialWriters.length > 0) setWriters(initialWriters);
  }, [initialWriters]);

  // Close dropdowns on view change
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileNavOpen(false);
  }, [currentView]);

  const publishedArticles = useMemo(() => articles.filter((a) => a.status === 'PUBLISHED'), [articles]);
  const latestArticles = useMemo(() => [...publishedArticles].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()), [publishedArticles]);
  const userArticles = useMemo(() => articles.filter(a => a.authorId === user.id), [articles, user.id]);

  const handleArticleClick = (article: Article) => {
    router.push(`/detail/${article.id}`);
  };

  const toggleBookmark = (articleId: string) => {
    if (isGuest) {
      router.push('/login');
      return;
    }
    setUser({
      ...user,
      bookmarks: user.bookmarks.includes(articleId)
        ? user.bookmarks.filter(id => id !== articleId)
        : [...user.bookmarks, articleId]
    });
  };

  const toggleFollow = (authorId: string) => {
    if (isGuest) {
      router.push('/login');
      return;
    }
    setUser({
      ...user,
      following: user.following.includes(authorId)
        ? user.following.filter(id => id !== authorId)
        : [...user.following, authorId]
    });
  };

  const handleLogout = () => {
    logout();
    setCurrentView('FEED');
    setIsUserMenuOpen(false);
  };

  const handleNavClick = (view: View) => {
    if (view === 'WRITE') {
      router.push('/admin');
      return;
    }
    if (isGuest && ['LIBRARY', 'STATS', 'STORIES'].includes(view)) {
      router.push('/login');
    } else {
      setCurrentView(view);
    }
  };

  const showLandingFeed = currentView === 'FEED';

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (showLandingFeed) {
    return (
      <div className="min-h-screen bg-white animate-fade-in">
        <SiteHeader variant="landing" />
        <div className="min-h-[calc(100vh-140px)] animate-fade-up">
          <LandingPageView 
            articles={latestArticles} 
            onArticleClick={handleArticleClick} 
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col animate-fade-in">
      {/* Normal header: logo, search, nav links, Write, notifications, profile picture */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
          <Link href="/" className="flex items-center shrink-0" onClick={() => setCurrentView('FEED')} aria-label="Home">
            <Logo size="sm" />
          </Link>
          {user.role === 'ADMIN' && (
            <div className="relative hidden sm:block flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" /></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-slate-50 rounded-full py-2 pl-10 pr-4 text-sm outline-none border border-slate-100 focus:bg-white focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
              />
            </div>
          )}
          <nav className="hidden md:flex items-center gap-1">
            {(['FEED', 'LIBRARY', 'PROFILE', 'STORIES', 'STATS'] as const).map((view) => (
              <button
                key={view}
                onClick={() => handleNavClick(view)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  currentView === view ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {view === 'FEED' ? 'Home' : view.charAt(0) + view.slice(1).toLowerCase()}
              </button>
            ))}
          </nav>
          {/* Mobile nav toggle */}
          <div className="md:hidden relative">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {isMobileNavOpen && (
              <div className="absolute left-0 top-full mt-1 py-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-[90]">
                {(['FEED', 'LIBRARY', 'PROFILE', 'STORIES', 'STATS'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => handleNavClick(view)}
                    className={`block w-full text-left px-4 py-2 text-sm font-medium ${currentView === view ? 'text-slate-900 bg-slate-50' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {view === 'FEED' ? 'Home' : view.charAt(0) + view.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 relative shrink-0">
          {!isGuest && (
            <Link href="/admin" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" /></svg>
              <span className="hidden sm:inline">Write</span>
            </Link>
          )}
          <button className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100" aria-label="Notifications">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeWidth="2" /></svg>
          </button>
          <button 
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 flex-shrink-0 hover:border-slate-300 transition focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
          >
            {isGuest ? (
              <span className="w-full h-full bg-slate-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" /></svg>
              </span>
            ) : (
              <img src={user.avatar || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt={user.name} />
            )}
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email || 'Guest Reader'}</p>
              </div>
              {isGuest ? (
                <div className="py-1">
                  <Link href="/login" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Sign in</Link>
                  <Link href="/register" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Get started</Link>
                </div>
              ) : (
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign out</button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col sm:flex-row min-h-0" onClick={() => { setIsUserMenuOpen(false); setIsMobileNavOpen(false); }}>
        {/* Left Sidebar - FOLLOWING only (nav is in header) */}
        <aside className="hidden sm:flex flex-col border-r border-slate-200 w-48 min-w-[12rem] flex-shrink-0 sticky top-14 left-0 self-stretch h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar py-5 bg-slate-50 z-10">
          <div className="px-3">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Following</h4>
            <div className="flex items-center gap-2 flex-wrap">
              {writers.slice(0, 2).map(w => (
                <div key={w.id} className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition ring-2 ring-slate-50 shadow-sm bg-white">
                  <img src={w.image || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" title={w.name} alt="" />
                </div>
              ))}
              <button className="w-8 h-8 flex items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 transition bg-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeWidth="2"/></svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full animate-fade-up">
          <div className="flex-1 px-4 sm:px-8 lg:px-12 py-8 min-w-0 max-w-3xl">
            {(currentView as View) === 'FEED' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-6 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
                  {['For you', 'Following'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab as any)}
                      className={`text-sm font-medium pb-4 -mb-px border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-900'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-start gap-4 mb-10 relative">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">
                    <svg className="w-7 h-7 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 mb-0.5">Your first member-only story is free</p>
                    <p className="text-sm text-slate-600">
                      Continue reading the story below or unlock any story with the star icon.{' '}
                      <button type="button" onClick={(e) => { e.stopPropagation(); router.push('/membership'); }} className="text-teal-600 hover:text-teal-700 font-medium underline">
                        Upgrade to access all of usethinkup
                      </button>
                    </p>
                  </div>
                  <button type="button" className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded" aria-label="Dismiss">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg>
                  </button>
                </div>

                <div className="space-y-10">
                  {latestArticles.map(article => (
                    <article key={article.id} className="cursor-pointer group" onClick={() => handleArticleClick(article)}>
                       <div className="flex items-center gap-2 mb-2">
                          <img src={article.authorAvatar || PLACEHOLDER_IMAGE} className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt="" />
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                             <span className="font-semibold text-slate-900">{article.authorName}</span>
                             <span>in</span>
                             <span className="font-semibold text-slate-900">{article.category}</span>
                             <span className="text-slate-400">{article.publishDate}</span>
                          </div>
                       </div>
                       <div className="flex gap-4 items-start">
                          <div className="flex-1 min-w-0">
                             <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-2 group-hover:opacity-80 transition">{article.title}</h2>
                             <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{article.excerpt}</p>
                             <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                                <svg className="w-3.5 h-3.5 fill-current flex-shrink-0" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span className="text-[11px] font-semibold">Member-only</span>
                             </div>
                          </div>
                          <div className="flex items-start gap-2 flex-shrink-0">
                             <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-slate-100">
                                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-white/95 px-1.5 py-0.5 rounded">
                                   <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                   Member-only
                                </div>
                                <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                             </div>
                             <button onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition" aria-label="More options">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                             </button>
                          </div>
                       </div>
                       <div className="mt-3 flex items-center gap-4 text-slate-400 text-xs">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(article.id); }}
                            className={`hover:text-slate-700 transition ${user.bookmarks.includes(article.id) ? 'text-slate-900' : ''}`}
                          >
                            <svg className="w-5 h-5" fill={user.bookmarks.includes(article.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeWidth="2"/></svg>
                          </button>
                          <button className="hover:text-slate-700 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth="2"/></svg>
                          </button>
                          <span className="text-slate-500">{article.publishDate}</span>
                          <span className="font-medium text-slate-600 ml-auto">»» {article.claps}</span>
                       </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'LIBRARY' && (
              <LibraryView bookmarks={articles.filter(a => user.bookmarks.includes(a.id))} onArticleClick={handleArticleClick} />
            )}

            {currentView === 'PROFILE' && (
              <ProfileView user={user} articles={userArticles} onArticleClick={handleArticleClick} onLogout={handleLogout} />
            )}

            {currentView === 'STORIES' && (
              <StoriesManagementView articles={userArticles} onEdit={(a) => router.push(`/admin/editor?id=${a.id}`)} onNew={() => router.push('/admin/editor')} />
            )}

            {currentView === 'STATS' && (
              <StatsView articles={userArticles} />
            )}

            {currentView === 'WRITE' && (
              <StoryEditor 
                currentUser={user} 
                onSave={(s) => { setArticles([s, ...articles]); setCurrentView('FEED'); }} 
                onCancel={() => setCurrentView('FEED')} 
              />
            )}
          </div>

          {/* Right Sidebar - Staff Picks, Recommended topics, Who to follow */}
          <aside className="hidden lg:block w-72 xl:w-80 pl-8 xl:pl-10 pr-6 py-8 border-l border-slate-100 bg-white">
            <div className="sticky top-20 space-y-10">
               <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Staff Picks</h3>
                  <div className="space-y-5">
                     {latestArticles.slice(0, 2).map(art => (
                        <div key={art.id} className="cursor-pointer group" onClick={() => handleArticleClick(art)}>
                           <div className="flex items-center gap-2 mb-1">
                              <img src={art.authorAvatar || PLACEHOLDER_IMAGE} className="w-5 h-5 rounded-full object-cover" alt="" />
                              <span className="text-xs font-bold text-slate-900">{art.authorName}</span>
                           </div>
                           <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:opacity-70 transition">{art.title}</h4>
                        </div>
                     ))}
                  </div>
                  <Link href="/membership" className="text-xs font-medium text-teal-600 mt-4 inline-block hover:text-teal-700">See the full list</Link>
               </div>

               <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Recommended topics</h3>
                  <div className="flex flex-wrap gap-2">
                     {['Data Science', 'Self Improvement', 'Writing', 'Technology', 'Relationships', 'Politics', 'Cryptocurrency'].map(topic => (
                        <button key={topic} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-700 transition">
                           {topic}
                        </button>
                     ))}
                  </div>
                  <Link href="/membership" className="text-xs font-medium text-teal-600 mt-4 inline-block hover:text-teal-700">See more topics</Link>
               </div>

               <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Who to follow</h3>
                  <div className="space-y-5">
                     {writers.slice(0, 2).map(writer => (
                        <div key={writer.id} className="flex items-start gap-3">
                           <img src={writer.image || PLACEHOLDER_IMAGE} className="w-10 h-10 rounded-full border border-slate-100 object-cover flex-shrink-0" alt="" />
                           <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900">{writer.name}</h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{writer.bio}</p>
                           </div>
                           <button 
                            onClick={() => toggleFollow(writer.id)}
                            className={`text-xs font-bold px-4 py-1.5 rounded-full border flex-shrink-0 transition ${user.following.includes(writer.id) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400'}`}
                           >
                              {user.following.includes(writer.id) ? 'Following' : 'Follow'}
                           </button>
                        </div>
                     ))}
                  </div>
                  <Link href="/membership" className="text-xs font-medium text-teal-600 mt-4 inline-block hover:text-teal-700">See suggestions</Link>
               </div>
            </div>
          </aside>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default App;
