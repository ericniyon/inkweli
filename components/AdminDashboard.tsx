
import React, { useState, useMemo, useEffect } from 'react';
import { Stats, Article, User, UserRole, SubscriptionTier, Category } from '../types';
import { MOCK_ARTICLES, WRITERS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import Logo from './Logo';

type AdminSection = 'OVERVIEW' | 'ARTICLES' | 'USERS' | 'TEAM' | 'LAYOUT' | 'BRAND' | 'EDITOR';

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('OVERVIEW');
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  
  // CRUD States
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Brand Studio State
  const [brandPrompt, setBrandPrompt] = useState('');
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generateBrandAsset = async () => {
    if (!brandPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High-fidelity, professional logo design for a premium news platform called usethinkup. Theme: ${brandPrompt}. Minimalist, vector style, white background, slate and indigo colors.` }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setGeneratedLogo(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error("Branding error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveArticle = () => {
    if (!editingArticle || !editingArticle.title) return;
    setIsSaving(true);

    setTimeout(() => {
      if (editingArticle.id) {
        setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...editingArticle as Article } : a));
      } else {
        const newArt: Article = {
          ...editingArticle as Article,
          id: Math.random().toString(36).substr(2, 9),
          slug: editingArticle.title.toLowerCase().replace(/ /g, '-'),
          authorId: 'auth_admin',
          authorName: 'Admin Editor',
          authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=64&h=64&auto=format&fit=crop',
          publishDate: new Date().toISOString().split('T')[0],
          claps: 0,
          responses: [],
          highlights: [],
          tags: [editingArticle.category || 'General'],
          readingTime: Math.ceil((editingArticle.content || '').split(' ').length / 200)
        };
        setArticles(prev => [newArt, ...prev]);
      }
      setIsSaving(false);
      setLastSaved(new Date().toLocaleTimeString());
      setActiveSection('ARTICLES');
      setEditingArticle(null);
    }, 800);
  };

  const handleDeleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
    setIsDeleting(null);
  };

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

  const suggestExcerpt = async () => {
    if (!editingArticle?.content) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a compelling one-sentence SEO excerpt for this article content: ${editingArticle.content.substring(0, 1000)}`,
      });
      setEditingArticle(prev => ({ ...prev, excerpt: response.text?.trim() }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const wordCount = useMemo(() => (editingArticle?.content || '').trim().split(/\s+/).filter(Boolean).length, [editingArticle?.content]);
  const readTime = Math.ceil(wordCount / 200);

  if (activeSection === 'EDITOR') {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-fade-in overflow-hidden">
        {/* Editor Header */}
        <header className="px-12 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-[100] h-20">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setActiveSection('ARTICLES'); setEditingArticle(null); }}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="flex flex-col">
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none">
                {editingArticle?.id ? 'Edit Story' : 'New Story'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dashboard / Editorial / </span>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{editingArticle?.title || 'Untitled'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isSaving ? 'Saving Changes...' : lastSaved ? `Last Saved ${lastSaved}` : 'Draft ready'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-100" />
            <button 
              onClick={handleSaveArticle}
              disabled={isSaving}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-100 hover:bg-indigo-600 transition-all disabled:opacity-50"
            >
              {editingArticle?.status === 'PUBLISHED' ? 'Update Live' : 'Publish Story'}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Writing Area */}
          <main className="flex-1 overflow-y-auto pt-24 pb-40 px-12 lg:px-0 no-scrollbar">
            <div className="max-w-3xl mx-auto space-y-12">
              <textarea 
                placeholder="Story Title..."
                className="w-full text-5xl md:text-6xl font-black Charter outline-none border-none resize-none placeholder:text-slate-100 text-slate-900 leading-[1.15]"
                value={editingArticle?.title}
                rows={2}
                onChange={(e) => setEditingArticle(prev => ({ ...prev!, title: e.target.value }))}
                autoFocus
              />
              
              <textarea 
                placeholder="Begin your story here..."
                className="w-full text-xl Charter outline-none border-none resize-none placeholder:text-slate-100 text-slate-700 leading-relaxed min-h-[600px]"
                value={editingArticle?.content}
                onChange={(e) => setEditingArticle(prev => ({ ...prev!, content: e.target.value }))}
              />
            </div>
          </main>

          {/* Right Panel Settings */}
          <aside className="w-96 bg-slate-50 border-l border-slate-100 overflow-y-auto no-scrollbar pt-12 px-10 pb-20 space-y-12">
            <div className="space-y-8">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 flex items-center justify-between">
                Story Settings
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2.5"/></svg>
              </h4>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Editorial Section</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition shadow-sm"
                  value={editingArticle?.category}
                  onChange={(e) => setEditingArticle(prev => ({ ...prev!, category: e.target.value as Category }))}
                >
                  <option>General</option>
                  <option>Politics</option>
                  <option>Economy</option>
                  <option>Culture</option>
                  <option>Technology</option>
                  <option>Science</option>
                  <option>Opinion</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Release Flow</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition shadow-sm"
                  value={editingArticle?.status}
                  onChange={(e) => setEditingArticle(prev => ({ ...prev!, status: e.target.value as any }))}
                >
                  <option value="DRAFT">Personal Draft</option>
                  <option value="PUBLISHED">Go Live Instantly</option>
                  <option value="SCHEDULED">Schedule for Later</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Excerpt</label>
                  <button 
                    onClick={suggestExcerpt}
                    disabled={isGenerating || !editingArticle?.content}
                    className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline disabled:opacity-50"
                  >
                    AI Suggestions
                  </button>
                </div>
                <textarea 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium outline-none h-32 Charter leading-relaxed shadow-sm"
                  placeholder="Summary for feed and SEO..."
                  value={editingArticle?.excerpt}
                  onChange={(e) => setEditingArticle(prev => ({ ...prev!, excerpt: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Featured Cover</label>
                <div className="relative group">
                  <input 
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition shadow-sm pr-12"
                    placeholder="https://images.unsplash.com/..."
                    value={editingArticle?.featuredImage}
                    onChange={(e) => setEditingArticle(prev => ({ ...prev!, featuredImage: e.target.value }))}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" /></svg>
                  </div>
                </div>
                {editingArticle?.featuredImage && (
                  <div className="mt-4 aspect-video rounded-3xl overflow-hidden border border-slate-200 shadow-xl animate-fade-in group">
                    <img src={editingArticle.featuredImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-slate-200">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Publication Metrics</h4>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Total Words</span>
                <span className="text-sm font-black text-white">{wordCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Read Estimate</span>
                <span className="text-sm font-black text-indigo-400">{readTime} minutes</span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <p className="text-[10px] text-white/30 font-bold leading-relaxed">
                * Based on average reading speed of 200 wpm. This helps us rank your story for user engagement.
              </p>
            </div>
          </aside>
        </div>

        {/* Floating Editor Status Bar */}
        <div className="fixed bottom-8 left-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full px-8 py-3 flex items-center gap-10 shadow-2xl z-[150] animate-fade-up">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Editing Mode</span>
           </div>
           <div className="h-4 w-px bg-slate-200" />
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
             Words: <span className="text-slate-900">{wordCount}</span>
           </div>
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
             Time: <span className="text-slate-900">{readTime}m</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-72 bg-slate-900 text-white flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="light" className="group-hover:rotate-12 transition-transform" />
            <span className="font-black tracking-tighter text-xl uppercase">usethinkup <span className="text-[10px] text-indigo-400 align-top uppercase">CMS</span></span>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-2">
          {[
            { id: 'OVERVIEW', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'ARTICLES', label: 'Articles', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
            { id: 'USERS', label: 'Subscribers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'TEAM', label: 'Writers', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'LAYOUT', label: 'Site Layout', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
            { id: 'BRAND', label: 'Brand Studio', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
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
      </aside>

      <main className="flex-grow overflow-y-auto">
        <header className="bg-white border-b border-slate-100 px-12 py-6 flex justify-between items-center sticky top-0 z-40">
           <div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeSection}</h2>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">System Management</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                 {WRITERS.slice(0, 3).map(w => (
                   <img key={w.id} src={w.image} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                 ))}
              </div>
              <button className="text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:text-indigo-700 transition">View Team</button>
           </div>
        </header>

        <div className="p-12">
          {activeSection === 'BRAND' && (
            <div className="max-w-4xl space-y-12 animate-fade-in">
              <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-black mb-4">AI Brand Identity Studio</h3>
                <p className="text-slate-500 mb-10 font-medium">Generate new logo concepts and branding assets using the Gemini design engine.</p>
                
                <div className="flex gap-4 mb-12">
                   <input 
                    type="text" 
                    placeholder="Describe a logo concept (e.g. 'Minimalist fountain pen with futuristic skyline')..."
                    className="flex-grow bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition"
                    value={brandPrompt}
                    onChange={(e) => setBrandPrompt(e.target.value)}
                   />
                   <button 
                    onClick={generateBrandAsset}
                    disabled={isGenerating}
                    className="bg-slate-900 text-white px-10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition disabled:opacity-50"
                   >
                    {isGenerating ? 'Designing...' : 'Generate Asset'}
                   </button>
                </div>

                {generatedLogo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-up">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Generated Concept</p>
                       <div className="aspect-square bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 shadow-inner p-4">
                          <img src={generatedLogo} className="w-full h-full object-contain rounded-2xl" />
                       </div>
                    </div>
                    <div className="flex flex-col justify-center gap-6">
                       <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                          <p className="text-sm font-bold text-indigo-900 leading-relaxed italic">
                            "This asset has been generated specifically for the usethinkup visual language. You can download and apply it to the homepage hero or newsletter headers."
                          </p>
                       </div>
                       <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100">Apply to Homepage</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'OVERVIEW' && (
            <div className="space-y-12 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
                {[
                  { label: 'ARR (USD)', value: stats.totalRevenue.toLocaleString(), trend: '+12.5%', color: 'indigo' },
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

              <div className="bg-white rounded-[3rem] border border-slate-100 p-10">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Editorial Activity</h3>
                    <button onClick={() => setActiveSection('ARTICLES')} className="text-xs font-black uppercase text-indigo-600 tracking-widest">Manage All</button>
                 </div>
                 <div className="space-y-6">
                    {articles.slice(0, 5).map(art => (
                      <div key={art.id} className="flex items-center gap-6 p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                         <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={art.featuredImage} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1">
                            <h4 className="text-sm font-black text-slate-900 line-clamp-1">{art.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{art.authorName} • {art.publishDate}</p>
                         </div>
                         <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${art.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {art.status}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {activeSection === 'ARTICLES' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                  <input 
                    type="text" 
                    placeholder="Search articles..." 
                    className="w-full xl:w-80 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-600 transition" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <select 
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-xs font-bold shadow-sm outline-none"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as Category | 'All')}
                    >
                      <option>All</option>
                      <option>Politics</option>
                      <option>Economy</option>
                      <option>Culture</option>
                      <option>Technology</option>
                      <option>Science</option>
                      <option>Opinion</option>
                      <option>General</option>
                    </select>
                    <select 
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-xs font-bold shadow-sm outline-none"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <option>All</option>
                      <option>DRAFT</option>
                      <option>PUBLISHED</option>
                      <option>SCHEDULED</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => { setEditingArticle({ title: '', content: '', category: 'General', status: 'DRAFT', excerpt: '', featuredImage: '' }); setActiveSection('EDITOR'); }} 
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-100 hover:bg-indigo-600 transition-all"
                >
                  Compose New
                </button>
              </div>
              
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-6">Article & Author</th>
                      <th className="px-8 py-6">Category</th>
                      <th className="px-8 py-6">Engagement</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredArticles.map(article => (
                      <tr key={article.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                 <img src={article.featuredImage} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 truncate max-w-[250px]">{article.title}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">{article.authorName} • {article.publishDate}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{article.category}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                              <span className="flex items-center gap-1"><svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>{article.claps}</span>
                              <span className="text-[10px] text-slate-300 font-black tracking-tighter uppercase">{article.readingTime}M</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${article.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{article.status}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => { setEditingArticle(article); setActiveSection('EDITOR'); }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Edit"
                              >
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button 
                                onClick={() => setIsDeleting(article.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete"
                              >
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] p-12 max-w-md w-full animate-fade-up shadow-2xl">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-8">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">Delete this story?</h3>
              <p className="text-slate-500 font-medium mb-10 Charter">This action is permanent and cannot be undone. All engagement data, highlights, and claps for this article will be lost.</p>
              <div className="flex gap-4">
                 <button 
                  onClick={() => setIsDeleting(null)}
                  className="flex-1 px-8 py-4 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition"
                 >
                   Keep Story
                 </button>
                 <button 
                  onClick={() => handleDeleteArticle(isDeleting)}
                  className="flex-1 bg-red-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-600 transition"
                 >
                   Confirm Delete
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
