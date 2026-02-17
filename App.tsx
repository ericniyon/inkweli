
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, SubscriptionTier, Article, Category } from './types';
import { MOCK_ARTICLES, WRITERS, GUEST_USER } from './constants';
import ArticleReader from './components/ArticleReader';
import StoryEditor from './components/StoryEditor';
import ProfileView from './components/ProfileView';
import OurStoryView from './components/OurStoryView';
import MembershipView from './components/MembershipView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ForgotPasswordView from './components/ForgotPasswordView';
import Logo from './components/Logo';
import LibraryView from './components/LibraryView';
import StoriesManagementView from './components/StoriesManagementView';
import StatsView from './components/StatsView';
import LandingPageView from './components/LandingPageView';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginView from './components/AdminLoginView';

type View = 'FEED' | 'ARTICLE' | 'WRITE' | 'PROFILE' | 'OUR_STORY' | 'MEMBERSHIP' | 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'LIBRARY' | 'STATS' | 'STORIES' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('FEED');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [activeTab, setActiveTab] = useState<'For you' | 'Following'>('For you');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const [user, setUser] = useState<User>(GUEST_USER);

  const isGuest = user.id === 'guest';

  // Close dropdown on view change
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [currentView]);

  const latestArticles = useMemo(() => [...articles].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()), [articles]);
  const userArticles = useMemo(() => articles.filter(a => a.authorId === user.id), [articles, user.id]);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setCurrentView('ARTICLE');
    window.scrollTo(0, 0);
  };

  const toggleBookmark = (articleId: string) => {
    if (isGuest) {
      setCurrentView('LOGIN');
      return;
    }
    setUser(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.includes(articleId) 
        ? prev.bookmarks.filter(id => id !== articleId)
        : [...prev.bookmarks, articleId]
    }));
  };

  const toggleFollow = (authorId: string) => {
    if (isGuest) {
      setCurrentView('LOGIN');
      return;
    }
    setUser(prev => ({
      ...prev,
      following: prev.following.includes(authorId)
        ? prev.following.filter(id => id !== authorId)
        : [...prev.following, authorId]
    }));
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setCurrentView('FEED');
  };

  const handleLogout = () => {
    setUser(GUEST_USER);
    setCurrentView('FEED');
    setIsUserMenuOpen(false);
  };

  const NavItem = ({ icon, label, view, active }: { icon: React.ReactNode, label: string, view: View, active: boolean }) => (
    <button 
      onClick={() => {
        // Redirct Write to Admin Login
        if (view === 'WRITE') {
          setCurrentView('ADMIN_LOGIN');
          return;
        }

        if (isGuest && ['LIBRARY', 'STATS', 'STORIES'].includes(view)) {
          setCurrentView('LOGIN');
        } else {
          setCurrentView(view);
        }
      }}
      className={`flex flex-col items-center gap-1 w-full py-4 transition-all ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
    >
      <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  const isLandingView = ['OUR_STORY', 'MEMBERSHIP', 'LOGIN', 'REGISTER', 'FORGOT_PASSWORD', 'ADMIN_LOGIN'].includes(currentView);
  const showLandingFeed = isGuest && currentView === 'FEED';

  if (currentView === 'ADMIN_DASHBOARD') {
    return <AdminDashboard />;
  }

  if (currentView === 'ADMIN_LOGIN') {
    return <AdminLoginView onLoginSuccess={() => setCurrentView('ADMIN_DASHBOARD')} onCancel={() => setCurrentView('FEED')} />;
  }

  if (currentView === 'ARTICLE' && selectedArticle) {
    return (
      <div className="min-h-screen bg-white animate-fade-in">
        <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-[100]">
           <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('FEED')}>
              <Logo size="sm" />
              <span className="text-xl font-black tracking-tighter">usethinkup</span>
           </div>
           <div className="flex items-center gap-4 relative">
            {!isGuest && (
              <button onClick={() => setCurrentView('ADMIN_LOGIN')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" /></svg>
                Write
              </button>
            )}
            <div 
              className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold cursor-pointer overflow-hidden border border-slate-100"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              {isGuest ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" /></svg>
              ) : (
                <img src={user.avatar} className="w-full h-full object-cover" />
              )}
            </div>

            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl py-3 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-50 mb-2">
                  <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email || 'Guest Session'}</p>
                </div>
                {isGuest ? (
                  <>
                    <button onClick={() => setCurrentView('LOGIN')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Sign in</button>
                    <button onClick={() => setCurrentView('REGISTER')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Get started</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setCurrentView('PROFILE')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Profile</button>
                    <button onClick={() => setCurrentView('LIBRARY')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Library</button>
                    <button onClick={() => setCurrentView('STATS')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Stats</button>
                    <div className="h-px bg-slate-50 my-2" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition">Sign out</button>
                  </>
                )}
              </div>
            )}
           </div>
        </nav>
        <ArticleReader 
          article={selectedArticle} 
          allArticles={articles}
          currentUser={user} 
          onArticleClick={handleArticleClick}
          onAuthorClick={(id) => { console.log('Author click', id); }}
          isBookmarked={user.bookmarks.includes(selectedArticle.id)}
          onToggleBookmark={() => toggleBookmark(selectedArticle.id)}
          isFollowing={user.following.includes(selectedArticle.authorId)}
          onToggleFollow={() => toggleFollow(selectedArticle.authorId)}
        />
        <Footer />
      </div>
    );
  }

  if (isLandingView || showLandingFeed) {
    return (
      <div className="min-h-screen bg-white animate-fade-in">
        <nav className={`px-6 py-4 flex items-center justify-between border-b border-slate-900/10 bg-white sticky top-0 z-[100] transition-colors ${currentView === 'FEED' ? 'bg-[#FFC017]' : 'bg-white'}`}>
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('FEED')}>
             <Logo size="sm" />
             <span className="text-2xl font-black tracking-tighter">usethinkup</span>
           </div>
           <div className="flex items-center gap-6">
              <button onClick={() => setCurrentView('OUR_STORY')} className="hidden sm:block text-sm font-medium text-slate-900">Our story</button>
              <button onClick={() => setCurrentView('MEMBERSHIP')} className="hidden sm:block text-sm font-medium text-slate-900">Membership</button>
              <button onClick={() => setCurrentView('ADMIN_LOGIN')} className="hidden sm:block text-sm font-medium text-slate-900">Write</button>
              <button onClick={() => setCurrentView('LOGIN')} className="text-sm font-medium text-slate-900">Sign in</button>
              <button onClick={() => setCurrentView('REGISTER')} className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition">Get started</button>
           </div>
        </nav>
        <div className="min-h-[calc(100vh-140px)] animate-fade-up">
          {currentView === 'FEED' && (
            <LandingPageView 
              articles={articles} 
              onArticleClick={handleArticleClick} 
              onGetStarted={() => setCurrentView('REGISTER')} 
            />
          )}
          {currentView === 'LOGIN' && <LoginView onLogin={handleLogin} onRegister={() => setCurrentView('REGISTER')} onForgotPassword={() => setCurrentView('FORGOT_PASSWORD')} />}
          {currentView === 'REGISTER' && <RegisterView onRegister={handleLogin} onLogin={() => setCurrentView('LOGIN')} />}
          {currentView === 'FORGOT_PASSWORD' && <ForgotPasswordView onBackToLogin={() => setCurrentView('LOGIN')} />}
          {currentView === 'OUR_STORY' && <OurStoryView onGetStarted={() => setCurrentView('REGISTER')} />}
          {currentView === 'MEMBERSHIP' && <MembershipView onGetStarted={() => setCurrentView('REGISTER')} />}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col animate-fade-in">
      {/* Top Header */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-100 h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="cursor-pointer" onClick={() => setCurrentView('FEED')}>
            <Logo size="sm" />
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-slate-50 rounded-full py-1.5 pl-10 pr-4 text-sm w-48 focus:w-64 transition-all outline-none border border-transparent focus:bg-white focus:border-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 relative">
          {!isGuest && (
            <button onClick={() => setCurrentView('ADMIN_LOGIN')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" /></svg>
              <span className="hidden sm:inline">Write</span>
            </button>
          )}
          <button className="text-slate-500 hover:text-slate-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeWidth="2" /></svg>
          </button>
          <div 
            className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:opacity-80 transition overflow-hidden border border-slate-100"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            {isGuest ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" /></svg>
            ) : (
              <img src={user.avatar} className="w-full h-full object-cover" />
            )}
          </div>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl py-3 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-50 mb-2">
                <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email || 'Guest Reader'}</p>
              </div>
              {isGuest ? (
                <>
                  <button onClick={() => setCurrentView('LOGIN')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Sign in</button>
                  <button onClick={() => setCurrentView('REGISTER')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Get started</button>
                </>
              ) : (
                <>
                  <button onClick={() => setCurrentView('PROFILE')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Profile</button>
                  <button onClick={() => setCurrentView('LIBRARY')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Library</button>
                  <button onClick={() => setCurrentView('STATS')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">Stats</button>
                  <div className="h-px bg-slate-50 my-2" />
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition">Sign out</button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1" onClick={() => setIsUserMenuOpen(false)}>
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col border-r border-slate-100 w-24 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto no-scrollbar pt-4 bg-white animate-slide-right">
          <NavItem active={currentView === 'FEED'} view="FEED" label="Home" icon={<svg className="w-6 h-6" fill={currentView === 'FEED' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" strokeWidth={currentView === 'FEED' ? '0' : '2'}/></svg>} />
          <NavItem active={currentView === 'LIBRARY'} view="LIBRARY" label="Library" icon={<svg className="w-6 h-6" fill={currentView === 'LIBRARY' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeWidth="2"/></svg>} />
          <NavItem active={currentView === 'PROFILE'} view="PROFILE" label="Profile" icon={<svg className="w-6 h-6" fill={currentView === 'PROFILE' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2"/></svg>} />
          <NavItem active={currentView === 'STORIES'} view="STORIES" label="Stories" icon={<svg className="w-6 h-6" fill={currentView === 'STORIES' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" strokeWidth="2"/></svg>} />
          <NavItem active={currentView === 'STATS'} view="STATS" label="Stats" icon={<svg className="w-6 h-6" fill={currentView === 'STATS' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2"/></svg>} />
          
          <div className="mt-8 px-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 text-center">Following</h4>
            <div className="space-y-4 flex flex-col items-center">
              {WRITERS.map(w => (
                <div key={w.id} className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 cursor-pointer hover:opacity-80 transition">
                  <img src={w.image} className="w-full h-full object-cover" title={w.name} />
                </div>
              ))}
              <button className="text-slate-400 hover:text-slate-900 p-1 rounded-full hover:bg-slate-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeWidth="2"/></svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full animate-fade-up">
          <div className="flex-1 px-4 sm:px-12 py-8 border-r border-slate-100 min-w-0">
            {currentView === 'FEED' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-6 border-b border-slate-100 mb-8 overflow-x-auto no-scrollbar">
                  {['For you', 'Following'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab as any)}
                      className={`text-sm font-medium pb-4 border-b transition-colors whitespace-nowrap ${activeTab === tab ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-900'}`}
                    >
                      {tab}
                    </button>
                  ))}
                  <button className="text-slate-300 pb-4 ml-auto hover:text-slate-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeWidth="2"/></svg></button>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6 mb-12 relative overflow-hidden group">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-10 h-10 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-base font-black text-slate-900 mb-1">Your first member-only story is free</h3>
                    <p className="text-sm text-slate-500">Continue reading the story below or unlock any story with the star icon. <button onClick={() => setCurrentView('MEMBERSHIP')} className="text-slate-900 underline font-medium">Upgrade to access all of usethinkup</button></p>
                  </div>
                  <button className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg></button>
                </div>

                <div className="space-y-16">
                  {latestArticles.map(article => (
                    <article key={article.id} className="cursor-pointer group" onClick={() => handleArticleClick(article)}>
                       <div className="flex items-center gap-2 mb-3">
                          <img src={article.authorAvatar} className="w-5 h-5 rounded-full" />
                          <div className="flex items-center gap-1 text-[11px]">
                             <span className="font-bold text-slate-900">{article.authorName}</span>
                             <span className="text-slate-300">in</span>
                             <span className="font-bold text-slate-900">{article.category}</span>
                             <span className="text-slate-300">•</span>
                             <span className="text-slate-500">{article.publishDate}</span>
                          </div>
                          <div className="ml-auto flex items-center gap-1 text-[10px] font-bold text-yellow-600">
                             <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                             Member-only
                          </div>
                       </div>
                       <div className="flex gap-8">
                          <div className="flex-1">
                             <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-slate-600 transition-colors">{article.title}</h2>
                             <p className="text-sm sm:text-base text-slate-500 line-clamp-2 Charter leading-relaxed">{article.excerpt}</p>
                          </div>
                          <div className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 bg-slate-100 rounded overflow-hidden">
                             <img src={article.featuredImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                       </div>
                       <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                             <button 
                              onClick={(e) => { e.stopPropagation(); toggleBookmark(article.id); }}
                              className={`${user.bookmarks.includes(article.id) ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-900'} transition`}
                             >
                                <svg className="w-5 h-5" fill={user.bookmarks.includes(article.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeWidth="2"/></svg>
                             </button>
                             <button className="text-slate-400 hover:text-slate-900 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76 1.128a1 1 0 01.737.97V11a1 1 0 01-1 1h-2.222l1.64 5.467a1 1 0 01-.65 1.222l-.768.256a1 1 0 01-1.222-.65L12 14z" strokeWidth="2"/></svg></button>
                             <div className="flex items-center gap-4 ml-4 text-[11px] text-slate-400 font-medium">
                                <span>{article.publishDate}</span>
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.7 19.3L22 12l-7.3-7.3m-14.7 0L7.3 12l-7.3 7.3" strokeWidth="2"/></svg>
                                  {article.claps}
                                </div>
                             </div>
                          </div>
                          <button className="text-slate-300 hover:text-slate-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" strokeWidth="2"/></svg></button>
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
              <StoriesManagementView articles={userArticles} onEdit={(a) => { setSelectedArticle(a); setCurrentView('WRITE'); }} onNew={() => setCurrentView('WRITE')} />
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

          {/* Right Sidebar */}
          <aside className="hidden lg:block w-96 pl-12 pr-6 py-8">
            <div className="sticky top-20 space-y-12">
               <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-6">Staff Picks</h3>
                  <div className="space-y-6">
                     {latestArticles.slice(0, 3).map(art => (
                        <div key={art.id} className="cursor-pointer group" onClick={() => handleArticleClick(art)}>
                           <div className="flex items-center gap-2 mb-1">
                              <img src={art.authorAvatar} className="w-4 h-4 rounded-full" />
                              <span className="text-[11px] font-bold text-slate-900">{art.authorName}</span>
                           </div>
                           <h4 className="text-sm font-black text-slate-900 leading-tight group-hover:opacity-70 transition">{art.title}</h4>
                        </div>
                     ))}
                  </div>
                  <button className="text-xs font-medium text-emerald-600 mt-6 hover:text-emerald-800">See the full list</button>
               </div>

               <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-6">Recommended topics</h3>
                  <div className="flex flex-wrap gap-2">
                     {['Data Science', 'Self Improvement', 'Writing', 'Technology', 'Relationships', 'Politics', 'Cryptocurrency'].map(topic => (
                        <button key={topic} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full text-xs font-medium text-slate-700 transition">
                           {topic}
                        </button>
                     ))}
                  </div>
                  <button className="text-xs font-medium text-emerald-600 mt-6 hover:text-emerald-800">See more topics</button>
               </div>

               <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-6">Who to follow</h3>
                  <div className="space-y-6">
                     {WRITERS.slice(0, 3).map(writer => (
                        <div key={writer.id} className="flex items-start gap-3">
                           <img src={writer.image} className="w-8 h-8 rounded-full border border-slate-100" />
                           <div className="flex-1">
                              <h4 className="text-xs font-black text-slate-900">{writer.name}</h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{writer.bio}</p>
                           </div>
                           <button 
                            onClick={() => toggleFollow(writer.id)}
                            className={`text-xs font-bold px-4 py-1.5 rounded-full border transition ${user.following.includes(writer.id) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-900'}`}
                           >
                              {user.following.includes(writer.id) ? 'Following' : 'Follow'}
                           </button>
                        </div>
                     ))}
                  </div>
                  <button className="text-xs font-medium text-emerald-600 mt-6 hover:text-emerald-800">See suggestions</button>
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
