import React, { useState, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { User, UserRole, SubscriptionTier, Article, Category } from './types';
import { MOCK_ARTICLES, SUBSCRIPTION_PLANS, WRITERS } from './constants';
import ArticleReader from './components/ArticleReader';
import AdminDashboard from './components/AdminDashboard';
import ArchiveView from './components/ArchiveView';
import WritersView from './components/WritersView';
import CategoryView from './components/CategoryView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ForgotPasswordView from './components/ForgotPasswordView';

type View = 'FEED' | 'ARTICLE' | 'ADMIN' | 'PRICING' | 'ARCHIVE' | 'WRITERS' | 'CATEGORY';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>('FEED');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTopic, setActiveTopic] = useState<Category | 'All Stories'>('All Stories');
  const [user, setUser] = useState<User>({
    id: 'guest',
    name: 'Guest Reader',
    email: 'guest@example.com',
    role: UserRole.FREE_USER,
    tier: SubscriptionTier.NONE,
    articlesViewedThisMonth: []
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const topics: (Category | 'All Stories')[] = ['All Stories', 'Politics', 'Economy', 'Culture', 'Technology', 'Science', 'Opinion'];

  const handleArticleClick = (article: Article) => {
    const hasViewed = user.articlesViewedThisMonth.includes(article.id);
    const canView = checkAccess(article.id);

    if (canView || hasViewed) {
      if (!hasViewed) {
        setUser(prev => ({
          ...prev,
          articlesViewedThisMonth: [...prev.articlesViewedThisMonth, article.id]
        }));
      }
      setSelectedArticle(article);
      setCurrentView('ARTICLE');
      window.scrollTo(0, 0);
    } else {
      setCurrentView('PRICING');
    }
  };

  const handleTopicClick = (topic: Category | 'All Stories') => {
    setActiveTopic(topic);
    if (topic === 'All Stories') {
      setCurrentView('FEED');
    } else {
      setCurrentView('CATEGORY');
    }
    window.scrollTo(0, 0);
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const checkAccess = (articleId: string): boolean => {
    if (user.role === UserRole.ADMIN || user.role === UserRole.EDITOR) return true;
    if (user.tier === SubscriptionTier.UNLIMITED) return true;
    
    const count = user.articlesViewedThisMonth.length;
    if (user.tier === SubscriptionTier.TWO_ARTICLES && count < 2) return true;
    if (user.tier === SubscriptionTier.ONE_ARTICLE && count < 1) return true;
    
    return false;
  };

  const handleSubscribe = (tier: SubscriptionTier) => {
    setUser(prev => ({
      ...prev,
      role: UserRole.SUBSCRIBER,
      tier: tier
    }));
    setCurrentView('FEED');
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    navigate('/');
  };

  const logout = () => {
    setUser({
      id: 'guest',
      name: 'Guest Reader',
      email: 'guest@example.com',
      role: UserRole.FREE_USER,
      tier: SubscriptionTier.NONE,
      articlesViewedThisMonth: []
    });
    setCurrentView('FEED');
    setActiveTopic('All Stories');
  };

  const featuredArticle = MOCK_ARTICLES[0];
  const secondaryFeatures = MOCK_ARTICLES.slice(1, 4);
  const trendingArticles = [...MOCK_ARTICLES].reverse().slice(0, 5);
  const collectionArticles = MOCK_ARTICLES.slice(4, 12);

  return (
    <Routes>
      <Route path="/login" element={
        <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 bg-[#FDFCFB]">
          <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4">
            <Link to="/" className="flex items-center gap-3 w-fit group">
              <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-all group-hover:rotate-6 shadow-lg shadow-slate-200">
                <span className="text-white font-black text-xl">I</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-slate-900 leading-none">INKWELL</span>
                <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Premium Edition</span>
              </div>
            </Link>
          </nav>
          <main className="flex-grow">
            <LoginView
              onLogin={handleLogin}
              onRegister={() => navigate('/register')}
              onForgotPassword={() => navigate('/forgot-password')}
            />
          </main>
        </div>
      } />
      <Route path="/register" element={
        <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 bg-[#FDFCFB]">
          <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4">
            <Link to="/" className="flex items-center gap-3 w-fit group">
              <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-all group-hover:rotate-6 shadow-lg shadow-slate-200">
                <span className="text-white font-black text-xl">I</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-slate-900 leading-none">INKWELL</span>
                <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Premium Edition</span>
              </div>
            </Link>
          </nav>
          <main className="flex-grow">
            <RegisterView
              onRegister={handleLogin}
              onLogin={() => navigate('/login')}
            />
          </main>
        </div>
      } />
      <Route path="/forgot-password" element={
        <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 bg-[#FDFCFB]">
          <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4">
            <Link to="/" className="flex items-center gap-3 w-fit group">
              <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-all group-hover:rotate-6 shadow-lg shadow-slate-200">
                <span className="text-white font-black text-xl">I</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-slate-900 leading-none">INKWELL</span>
                <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Premium Edition</span>
              </div>
            </Link>
          </nav>
          <main className="flex-grow">
            <ForgotPasswordView onBackToLogin={() => navigate('/login')} />
          </main>
        </div>
      } />
      <Route path="*" element={
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 bg-[#FDFCFB]">
      {/* Primary Navigation */}
      <nav className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <Link 
          to="/"
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => { setCurrentView('FEED'); setActiveTopic('All Stories'); }}
        >
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-all group-hover:rotate-6 shadow-lg shadow-slate-200">
            <span className="text-white font-black text-xl">I</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter text-slate-900 leading-none">INKWELL</span>
            <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Premium Edition</span>
          </div>
        </Link>
        
        <div className="hidden lg:flex items-center gap-10">
          <button 
            onClick={() => { setCurrentView('FEED'); setActiveTopic('All Stories'); }} 
            className={`text-xs font-black uppercase tracking-widest transition-all pb-1 border-b-2 ${currentView === 'FEED' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-900 hover:border-slate-300'}`}
          >
            Today
          </button>
          <button 
            onClick={() => setCurrentView('ARCHIVE')}
            className={`text-xs font-black uppercase tracking-widest transition-all pb-1 border-b-2 ${currentView === 'ARCHIVE' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-900 hover:border-slate-300'}`}
          >
            The Archive
          </button>
          <button 
            onClick={() => setCurrentView('WRITERS')}
            className={`text-xs font-black uppercase tracking-widest transition-all pb-1 border-b-2 ${currentView === 'WRITERS' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-900 hover:border-slate-300'}`}
          >
            Writers
          </button>
          {user.role === UserRole.ADMIN && (
            <button onClick={() => setCurrentView('ADMIN')} className="bg-slate-100 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition shadow-sm">Dashboard</button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user.id === 'guest' ? (
            <div className="flex items-center gap-2">
              <Link 
                to="/login"
                className="text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest px-4 py-2 hidden sm:block"
              >
                Sign In
              </Link>
              <button 
                onClick={() => setCurrentView('PRICING')}
                className="bg-slate-900 text-white px-7 py-3 rounded-2xl text-[11px] font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                UPGRADE
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
               <div className="hidden sm:block text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{user.name}</p>
                 <p className="text-[10px] font-black text-indigo-600 uppercase leading-none">{user.tier === SubscriptionTier.NONE ? user.role : user.tier.replace('_', ' ')}</p>
               </div>
               <button onClick={logout} className="p-3 bg-slate-50 hover:bg-red-50 rounded-2xl transition text-slate-400 hover:text-red-600 shadow-sm border border-slate-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
               </button>
            </div>
          )}
        </div>
      </nav>

      {/* Topics Sub-nav */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-8 overflow-x-auto no-scrollbar sticky top-[68px] z-[90]">
          {topics.map((topic, i) => (
            <button 
              key={topic}
              onClick={() => handleTopicClick(topic)}
              className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-widest transition animate-fade-in group`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className={`${activeTopic === topic ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'}`}>
                {topic}
              </span>
              {activeTopic === topic && <div className="h-0.5 bg-indigo-600 mt-1 w-full rounded-full" />}
            </button>
          ))}
        </div>

      {/* Main Content */}
      <main className="flex-grow">
        {currentView === 'FEED' && (
          <div className="animate-fade-in">
            
            {/* Intelligence Bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-8 py-2 overflow-hidden whitespace-nowrap hidden lg:block">
               <div className="flex items-center gap-12 animate-slide-right">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Pulse</span>
                     <span className="text-[10px] font-black text-emerald-600">RWANDA NSE +1.4%</span>
                     <span className="text-[10px] font-black text-red-600">USD/RWF -0.2%</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200" />
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kigali Today</span>
                     <span className="text-[10px] font-black text-slate-600">24°C Partly Cloudy</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200" />
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                     <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[10px] font-black text-slate-600">Network Operational</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
              
              {/* Section: 01 Front Page Split-Hero */}
              <div className="mb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* Big Hero Column */}
                  <div className="lg:col-span-8 group cursor-pointer opacity-0 animate-fade-up delay-100" onClick={() => handleArticleClick(featuredArticle)}>
                    <div className="relative aspect-[16/9] rounded-[3.5rem] overflow-hidden mb-10 shadow-3xl bg-slate-900 ring-4 ring-white shadow-slate-200/50">
                      <img src={featuredArticle.featuredImage} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s] opacity-90" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                      <div className="absolute bottom-12 left-12 right-12">
                         <div className="flex items-center gap-3 mb-6">
                            <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-600/30">Lead Story</span>
                            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">{featuredArticle.category}</span>
                         </div>
                         <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-8 tracking-tighter drop-shadow-lg">
                           {featuredArticle.title}
                         </h2>
                         <div className="flex items-center gap-8">
                            <div className="flex items-center gap-4 text-white">
                               <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 p-0.5 overflow-hidden">
                                  <img src={WRITERS[0].image} className="w-full h-full object-cover rounded-[14px]" />
                               </div>
                               <div>
                                 <p className="text-xs font-black">{featuredArticle.authorName}</p>
                                 <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Correspondent</p>
                               </div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <span className="text-[11px] font-black text-white/70 tracking-widest uppercase">{featuredArticle.readingTime} MIN READ</span>
                         </div>
                      </div>
                    </div>
                    <div className="px-6 border-l-4 border-indigo-600 py-2">
                       <p className="text-2xl text-slate-700 leading-relaxed font-medium Charter italic">{featuredArticle.excerpt}</p>
                    </div>
                  </div>

                  {/* Sidebar Feed */}
                  <div className="lg:col-span-4 space-y-10 opacity-0 animate-fade-up delay-300">
                     <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 pb-2 border-b-2 border-slate-900 flex justify-between items-center">
                        Intelligence Feed
                        <span className="text-indigo-600">Updated 4m ago</span>
                     </h3>
                     <div className="space-y-8">
                        {secondaryFeatures.map((art, i) => (
                           <div key={art.id} className="group cursor-pointer border-b border-slate-100 pb-8 last:border-0" onClick={() => handleArticleClick(art)}>
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">{art.category}</span>
                                <span className="text-[9px] font-bold text-slate-300">{art.readingTime} MIN</span>
                              </div>
                              <h4 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                {art.title}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">— {art.authorName}</p>
                           </div>
                        ))}
                     </div>

                     {/* Premium Callout Card */}
                     <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group/card transition-transform hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 transition-transform group-hover/card:scale-[1.7]">
                           <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
                        </div>
                        <h5 className="text-2xl font-black mb-4 relative z-10 leading-tight">Master the Complexity.</h5>
                        <p className="text-xs text-indigo-100/70 mb-8 relative z-10 leading-relaxed font-medium">Unlock our database of over 1,200 analytical reports and deep dives from across East Africa.</p>
                        <button 
                          onClick={() => setCurrentView('PRICING')}
                          className="bg-white text-indigo-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl relative z-10 hover:bg-slate-900 hover:text-white transition"
                        >
                          Unlock Archive
                        </button>
                     </div>
                  </div>
                </div>
              </div>

              {/* Journalist Spotlight Row */}
              <div className="mb-24 opacity-0 animate-fade-up delay-500">
                 <div className="flex items-center gap-4 mb-12">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">02 / The Thinkers</span>
                   <div className="flex-grow h-px bg-slate-100" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {WRITERS.map((writer, i) => (
                       <div key={writer.id} className="flex items-center gap-6 group cursor-pointer" onClick={() => setCurrentView('WRITERS')}>
                          <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-slate-100 border-2 border-white shadow-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                             <img src={writer.image} className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{writer.name}</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{writer.role}</p>
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{writer.articlesCount} Stories</span>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-900 transition">Bio &rarr;</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Section: 03 The Deep Dive Slider */}
              <div className="mb-24 opacity-0 animate-fade-up delay-700">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center gap-4 flex-grow">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">03 / The Deep Dive</span>
                     <div className="flex-grow h-px bg-slate-100" />
                   </div>
                   <div className="flex items-center gap-3 ml-8">
                      <button 
                        onClick={() => scrollSlider('left')}
                        className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all text-slate-400 shadow-sm"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                      </button>
                      <button 
                        onClick={() => scrollSlider('right')}
                        className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all text-slate-400 shadow-sm"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                      </button>
                   </div>
                </div>
                
                <div 
                  ref={scrollRef}
                  className="flex gap-12 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-12"
                >
                  {MOCK_ARTICLES.slice(4, 10).map((article, i) => (
                    <div 
                      key={article.id} 
                      className="flex-shrink-0 w-[85vw] sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-2rem)] snap-start group cursor-pointer"
                      onClick={() => handleArticleClick(article)}
                    >
                      <div className="aspect-[4/3] rounded-[3rem] overflow-hidden mb-8 bg-slate-50 border border-slate-100 shadow-xl shadow-slate-200/50 relative">
                        <img src={article.featuredImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                        <div className="absolute top-6 left-6">
                           <span className="bg-white/80 backdrop-blur-md text-slate-900 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg">
                             {article.category}
                           </span>
                        </div>
                      </div>
                      <div className="px-4">
                         <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
                           {article.title}
                         </h3>
                         <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium mb-6 Charter">
                           {article.excerpt}
                         </p>
                         <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">By {article.authorName}</span>
                            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">{article.readingTime} MIN</span>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: 04 The Collection Asymmetrical Grid */}
              <div className="mb-24 opacity-0 animate-fade-up delay-1000">
                 <div className="flex items-center gap-4 mb-16">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">04 / Essential Collections</span>
                   <div className="flex-grow h-px bg-slate-100" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-4 space-y-10">
                       {collectionArticles.slice(0, 2).map((art, i) => (
                          <div key={art.id} className="group cursor-pointer" onClick={() => handleArticleClick(art)}>
                             <div className="aspect-square rounded-[2.5rem] overflow-hidden mb-6 bg-slate-50 border border-slate-100 shadow-md">
                                <img src={art.featuredImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                             </div>
                             <h4 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">{art.title}</h4>
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{art.category} • {art.publishDate}</p>
                          </div>
                       ))}
                    </div>

                    <div className="md:col-span-5 bg-[#FAF9F6] rounded-[4rem] p-16 border border-slate-200 flex flex-col justify-center relative overflow-hidden group/featured">
                       <div className="absolute top-0 right-0 p-12 opacity-5 scale-[2] pointer-events-none transition-transform group-hover/featured:scale-[2.2]">
                         <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                       </div>
                       <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-10 block">Newsletter Exclusive</span>
                       <h3 className="text-4xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tighter">The Monday Intelligence</h3>
                       <p className="text-lg text-slate-500 mb-12 leading-relaxed font-medium Charter italic">A curated briefing for decision-makers, distilling the week's most critical developments into a five-minute read.</p>
                       <div className="space-y-4 max-w-sm">
                          <input type="email" placeholder="Email Address" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-600 transition" />
                          <button className="w-full bg-slate-900 text-white text-[11px] font-black py-5 rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all">Join 15k+ Readers</button>
                       </div>
                    </div>

                    <div className="md:col-span-3 space-y-10">
                       {collectionArticles.slice(2, 5).map((art, i) => (
                          <div key={art.id} className="group cursor-pointer border-b border-slate-100 pb-8 last:border-0 last:pb-0" onClick={() => handleArticleClick(art)}>
                             <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-3">{art.category}</p>
                             <h4 className="text-base font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-3 mb-4">{art.title}</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{art.readingTime} MIN READ</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

            </div>
          </div>
        )}

        {currentView === 'CATEGORY' && (
          <CategoryView topic={activeTopic as Category} onArticleClick={handleArticleClick} />
        )}

        {currentView === 'ARCHIVE' && (
          <ArchiveView onArticleClick={handleArticleClick} />
        )}

        {currentView === 'WRITERS' && (
          <WritersView />
        )}

        {currentView === 'ARTICLE' && selectedArticle && (
          <ArticleReader 
            article={selectedArticle} 
            currentUser={user} 
            onArticleClick={handleArticleClick} 
          />
        )}

        {currentView === 'ADMIN' && <AdminDashboard />}

        {currentView === 'PRICING' && (
          <div className="max-w-6xl mx-auto px-6 py-24 animate-fade-up">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Invest in Truth.</h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">High-quality journalism requires resources. Choose a plan that fuels independent reporting in Rwanda.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {SUBSCRIPTION_PLANS.map((plan, i) => (
                <div key={plan.id} 
                  className={`bg-white rounded-[3.5rem] p-12 border ${plan.tier === SubscriptionTier.UNLIMITED ? 'border-indigo-600 border-2 shadow-2xl lg:scale-105' : 'border-slate-100 shadow-xl'} flex flex-col relative overflow-hidden animate-fade-up`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {plan.tier === SubscriptionTier.UNLIMITED && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl uppercase tracking-widest">Recommended</div>
                  )}
                  <div className="mb-10">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{plan.interval}LY ACCESS</p>
                  </div>
                  <div className="mb-12">
                    <span className="text-6xl font-black text-slate-900">RWF {plan.price.toLocaleString()}</span>
                  </div>
                  <ul className="space-y-5 mb-12 flex-grow">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600 font-medium">
                        <svg className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => handleSubscribe(plan.tier)}
                    className={`w-full font-black py-5 rounded-[1.5rem] transition transform active:scale-95 shadow-xl ${plan.tier === SubscriptionTier.UNLIMITED ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                    Activate {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
        <footer className="bg-slate-900 text-white py-32 px-10 rounded-t-[4rem]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-20 mb-20">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-slate-900 font-black text-2xl">I</span>
                  </div>
                  <span className="text-3xl font-black tracking-tighter text-white uppercase">INKWELL</span>
                </div>
                <p className="text-white/40 font-medium leading-relaxed max-w-sm mb-12 Charter italic text-lg">
                  "Independent, verified, and essential. Inkwell is the definitive source for the ideas shaping the modern East African experience."
                </p>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-white transition cursor-pointer"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></div>
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-white transition cursor-pointer"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-10 pb-4 border-b border-white/5">Sections</h4>
                <ul className="space-y-5 text-xs font-black text-white/40 uppercase tracking-tighter">
                  {topics.map(t => (
                    <li key={t}><button onClick={() => handleTopicClick(t)} className="hover:text-indigo-400 transition-all">{t}</button></li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-1">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-10 pb-4 border-b border-white/5">Company</h4>
                <ul className="space-y-5 text-xs font-black text-white/40 uppercase tracking-tighter">
                  <li><button onClick={() => setCurrentView('ARCHIVE')} className="hover:text-indigo-400 transition-all">Archives</button></li>
                  <li><button onClick={() => setCurrentView('WRITERS')} className="hover:text-indigo-400 transition-all">Writers</button></li>
                  <li><a href="#" className="hover:text-indigo-400 transition-all">Terms of Use</a></li>
                  <li><a href="#" className="hover:text-indigo-400 transition-all">Privacy</a></li>
                </ul>
              </div>

              <div className="lg:col-span-2">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-10 pb-4 border-b border-white/5">Weekly Briefing</h4>
                <p className="text-xs text-white/40 font-medium mb-8 leading-relaxed">Join our high-level distribution list for curated insights delivered every Monday morning.</p>
                <div className="flex gap-3">
                   <input type="text" placeholder="Intelligence Delivered" className="flex-grow bg-white/5 border-none rounded-2xl px-5 py-4 text-xs font-bold outline-none text-white focus:ring-2 focus:ring-indigo-600" />
                   <button className="bg-indigo-600 text-white text-[10px] font-black px-6 rounded-2xl shadow-lg shadow-indigo-600/20">JOIN</button>
                </div>
              </div>
            </div>
            
            <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">© 2024 Inkwell Media Group • All Rights Reserved</p>
               <div className="flex gap-10">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">MTN MOMO ENABLED</span>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">AIRTEL MONEY ENABLED</span>
               </div>
            </div>
          </div>
        </footer>
    </div>
  } />
    </Routes>
  );
};

export default App;
