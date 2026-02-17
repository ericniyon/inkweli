
import React, { useState, useMemo } from 'react';
import { Stats, Article, User, UserRole, SubscriptionTier, Category } from '../types';
import { MOCK_ARTICLES, WRITERS } from '../constants';

type AdminSection = 'OVERVIEW' | 'ARTICLES' | 'USERS' | 'TEAM' | 'LAYOUT';

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('OVERVIEW');
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentArticle, setCurrentArticle] = useState<Partial<Article> | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'>('All');

  const stats: Stats = {
    totalRevenue: 1450000,
    subscriberCount: 842,
    articleCount: articles.length,
    monthlyGrowth: 12.5
  };

  // Computed Filtered List
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchesSearch = 
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        art.authorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || art.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || art.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [articles, searchTerm, categoryFilter, statusFilter]);

  const handleDeleteArticle = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      setArticles(articles.filter(a => a.id !== id));
    }
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArticle?.title) return;

    if (currentArticle.id) {
      // Edit
      setArticles(articles.map(a => a.id === currentArticle.id ? (currentArticle as Article) : a));
    } else {
      // Create
      const newArt: Article = {
        ...(currentArticle as Article),
        id: Math.random().toString(36).substr(2, 9),
        slug: currentArticle.title.toLowerCase().replace(/ /g, '-'),
        authorId: 'auth_1', // Default to current admin
        authorName: 'Administrator',
        publishDate: new Date().toISOString().split('T')[0],
        status: 'PUBLISHED',
        readingTime: 5,
        category: (currentArticle.category as Category) || 'General'
      };
      setArticles([newArt, ...articles]);
    }
    setIsEditing(false);
    setCurrentArticle(null);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black">I</div>
            <span className="font-black tracking-tighter text-xl">INKWELL <span className="text-[10px] text-indigo-400 align-top uppercase">CMS</span></span>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2">
          {[
            { id: 'OVERVIEW', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'ARTICLES', label: 'Articles', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
            { id: 'USERS', label: 'Subscribers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'TEAM', label: 'Writers', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'LAYOUT', label: 'Site Layout', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveSection(item.id as AdminSection)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black transition-all ${activeSection === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black">A</div>
             <div className="flex-grow min-w-0">
               <p className="text-xs font-black truncate">Administrator</p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Super Admin</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 px-12 py-6 flex justify-between items-center sticky top-0 z-40">
           <div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeSection}</h2>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">System Management</p>
           </div>
           <div className="flex gap-4">
             <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition border border-slate-100 relative">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
             </button>
           </div>
        </header>

        <div className="p-12">
          {activeSection === 'OVERVIEW' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
                {[
                  { label: 'ARR (RWF)', value: stats.totalRevenue.toLocaleString(), trend: '+12.5%', color: 'indigo' },
                  { label: 'Subscribers', value: stats.subscriberCount.toLocaleString(), trend: '+42 new', color: 'slate' },
                  { label: 'Article Count', value: stats.articleCount.toString(), trend: '+5 this wk', color: 'slate' },
                  { label: 'Growth rate', value: '94.2%', trend: '+0.4%', color: 'emerald' }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{item.label}</p>
                     <div className="flex items-baseline gap-3">
                       <h2 className="text-3xl font-black text-slate-900">{item.value}</h2>
                       <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{item.trend}</span>
                     </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900">Recent Articles</h3>
                    <button onClick={() => setActiveSection('ARTICLES')} className="text-xs font-black text-indigo-600 hover:underline">View All</button>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Article</th>
                        <th className="px-8 py-5">Views</th>
                        <th className="px-8 py-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {articles.slice(0, 5).map(article => (
                        <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{article.title}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{article.authorName}</p>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-700">1.2k</td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-widest">Published</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                  <h3 className="text-xl font-black mb-10 tracking-tight">System Events</h3>
                  <div className="space-y-10 relative">
                    <div className="absolute top-0 left-2.5 w-px h-[85%] bg-white/10" />
                    {[
                      { user: 'Kabeza P.', action: 'Upgrade to Unlimited', time: 'Just now' },
                      { user: 'Mutoni A.', action: 'New Highlight posted', time: '14m ago' },
                      { user: 'Ganza E.', action: 'Shared to LinkedIn', time: '2h ago' },
                    ].map((act, i) => (
                      <div key={i} className="flex gap-6 relative z-10">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 border-4 border-slate-900 flex items-center justify-center flex-shrink-0" />
                        <div>
                          <p className="text-sm font-black mb-1">{act.user}</p>
                          <p className="text-xs text-white/50 mb-2 font-medium">{act.action}</p>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'ARTICLES' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Filter Controls */}
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                  <div className="relative w-full sm:w-80">
                     <input 
                      type="text" 
                      placeholder="Search title or author..." 
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-600 transition" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                     />
                     <svg className="w-5 h-5 absolute right-4 top-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  
                  <div className="flex gap-4 w-full sm:w-auto">
                    <select 
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-600 transition w-full sm:w-40 appearance-none text-slate-600"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as any)}
                    >
                      <option value="All">All Categories</option>
                      <option value="Politics">Politics</option>
                      <option value="Economy">Economy</option>
                      <option value="Culture">Culture</option>
                      <option value="Technology">Technology</option>
                      <option value="Science">Science</option>
                      <option value="Opinion">Opinion</option>
                    </select>

                    <select 
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-600 transition w-full sm:w-40 appearance-none text-slate-600"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <option value="All">All Status</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SCHEDULED">Scheduled</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => { setCurrentArticle({}); setIsEditing(true); }}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 w-full sm:w-auto justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Compose New Story
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-6">Article Brief</th>
                      <th className="px-8 py-6">Category</th>
                      <th className="px-8 py-6 text-center">Reading Time</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredArticles.length > 0 ? (
                      filteredArticles.map(article => (
                        <tr key={article.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <img src={article.featuredImage} className="w-14 h-14 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
                              <div className="min-w-0">
                                 <p className="text-sm font-black text-slate-900 truncate max-w-[300px]">{article.title}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">{article.authorName} • {article.publishDate}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{article.category}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="text-xs font-bold text-slate-600">{article.readingTime} min</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                              article.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' : 
                              article.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'
                            }`}>
                              {article.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setCurrentArticle(article); setIsEditing(true); }}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteArticle(article.id)}
                                className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-32 text-center">
                           <div className="flex flex-col items-center justify-center gap-4">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                              </div>
                              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No articles found matching filters</p>
                              <button 
                                onClick={() => { setSearchTerm(''); setCategoryFilter('All'); setStatusFilter('All'); }}
                                className="text-xs font-black text-indigo-600 hover:underline"
                              >
                                Clear all filters
                              </button>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'USERS' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
               <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Registered Subscribers</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Active Members Only</p>
                  </div>
                  <div className="flex gap-4">
                     <button className="px-6 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl">Bulk Action</button>
                  </div>
               </div>
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-10 py-6">Reader Info</th>
                      <th className="px-10 py-6">Subscription Tier</th>
                      <th className="px-10 py-6">Engagement</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { name: 'Kabeza Patrick', email: 'kabeza@example.rw', tier: 'UNLIMITED', views: 42, date: 'May 12, 2024' },
                      { name: 'Mutoni Alice', email: 'alice.m@gmail.com', tier: 'TWO_ARTICLES', views: 2, date: 'Apr 28, 2024' },
                      { name: 'Ganza Eric', email: 'ericg@startup.rw', tier: 'ONE_ARTICLE', views: 1, date: 'May 02, 2024' },
                      { name: 'Uwase Bella', email: 'bella@gov.rw', tier: 'UNLIMITED', views: 128, date: 'Jan 15, 2024' },
                    ].map((user, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-6">
                           <p className="text-sm font-black text-slate-900">{user.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{user.email}</p>
                        </td>
                        <td className="px-10 py-6">
                           <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] ${user.tier === 'UNLIMITED' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                             {user.tier.replace('_', ' ')}
                           </span>
                        </td>
                        <td className="px-10 py-6">
                           <p className="text-xs font-black text-slate-700">{user.views} Articles</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">This Month</p>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeSection === 'TEAM' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
                {WRITERS.map(writer => (
                  <div key={writer.id} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm group">
                     <div className="flex items-center gap-6 mb-8">
                        <img src={writer.image} className="w-20 h-20 rounded-[2rem] object-cover shadow-lg border-2 border-white" />
                        <div>
                           <h4 className="text-xl font-black text-slate-900">{writer.name}</h4>
                           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{writer.role}</p>
                        </div>
                     </div>
                     <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8 italic line-clamp-3">"{writer.bio}"</p>
                     <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                        <div>
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Articles</p>
                           <p className="text-lg font-black text-slate-900">{writer.articlesCount}</p>
                        </div>
                        <div className="flex gap-2">
                           <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                           <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-red-600 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                     </div>
                  </div>
                ))}
                <button className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-10 flex flex-col items-center justify-center gap-4 hover:bg-slate-100 transition group">
                   <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                   </div>
                   <span className="text-sm font-black text-slate-400 group-hover:text-slate-900 transition uppercase tracking-widest">Add Team Member</span>
                </button>
             </div>
          )}

          {activeSection === 'LAYOUT' && (
             <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-12 pb-8 border-b border-slate-50">
                   <div>
                     <h3 className="text-2xl font-black text-slate-900">Homepage Layout</h3>
                     <p className="text-sm text-slate-400 font-medium">Control featured content and section ordering.</p>
                   </div>
                   <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest">Publish Changes</button>
                </div>

                <div className="space-y-12">
                   <div>
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">Hero Feature Article</h4>
                      <div className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center gap-6 border border-slate-200">
                         <img src={articles[0].featuredImage} className="w-40 h-24 rounded-2xl object-cover shadow-md" />
                         <div className="flex-grow">
                            <h5 className="text-lg font-black text-slate-900 leading-tight mb-2">{articles[0].title}</h5>
                            <button className="text-xs font-black text-indigo-600 uppercase tracking-widest">Change Featured Story &rarr;</button>
                         </div>
                      </div>
                   </div>

                   <div>
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">Editorial Picks (Slider)</h4>
                      <div className="grid grid-cols-4 gap-4">
                         {articles.slice(1, 5).map((a, i) => (
                           <div key={i} className="relative group">
                              <img src={a.featuredImage} className="aspect-square rounded-2xl object-cover shadow-sm group-hover:brightness-50 transition-all" />
                              <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                              </button>
                           </div>
                         ))}
                         <button className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 hover:text-indigo-600 transition">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* Editor Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-500">
             <header className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                <div>
                   <h3 className="text-xl font-black text-slate-900">{currentArticle?.id ? 'Modify Story' : 'New Story Draft'}</h3>
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Content Editor</p>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setIsEditing(false)} className="px-8 py-3 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition">Discard</button>
                   <button onClick={handleSaveArticle} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition">Save & Publish</button>
                </div>
             </header>

             <form className="flex-grow p-12 overflow-y-auto space-y-10" onSubmit={handleSaveArticle}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Article Title</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition" 
                        placeholder="e.g. The Quantum Future of Kigali"
                        value={currentArticle?.title || ''}
                        onChange={(e) => setCurrentArticle({ ...currentArticle, title: e.target.value })}
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Section / Category</label>
                      <select 
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition appearance-none"
                        value={currentArticle?.category || 'General'}
                        onChange={(e) => setCurrentArticle({ ...currentArticle, category: e.target.value as Category })}
                      >
                         <option>Politics</option>
                         <option>Economy</option>
                         <option>Culture</option>
                         <option>Technology</option>
                         <option>Science</option>
                         <option>Opinion</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Engaging Excerpt</label>
                   <textarea 
                     rows={3}
                     className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition resize-none leading-relaxed" 
                     placeholder="A brief teaser to catch the reader's eye..."
                     value={currentArticle?.excerpt || ''}
                     onChange={(e) => setCurrentArticle({ ...currentArticle, excerpt: e.target.value })}
                   />
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Featured Image URL</label>
                   <input 
                    type="url"
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition" 
                    placeholder="https://images.unsplash.com/..."
                    value={currentArticle?.featuredImage || ''}
                    onChange={(e) => setCurrentArticle({ ...currentArticle, featuredImage: e.target.value })}
                   />
                </div>

                <div className="space-y-4 flex-grow">
                   <div className="flex justify-between items-center ml-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Story Body (HTML Supported)</label>
                      <span className="text-[9px] font-bold text-slate-300">Charter Serif font applied automatically</span>
                   </div>
                   <textarea 
                     rows={15}
                     required
                     className="w-full bg-slate-50 border-none rounded-3xl px-8 py-8 text-lg font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition resize-none leading-relaxed article-content" 
                     placeholder="Start writing the next masterpiece..."
                     value={currentArticle?.content || ''}
                     onChange={(e) => setCurrentArticle({ ...currentArticle, content: e.target.value })}
                   />
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
