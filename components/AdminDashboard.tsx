"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Stats, Article, Category } from '../types';
import { WRITERS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import Logo from './Logo';
import { useAuth } from '@/lib/auth-context';

type AdminSection = 'OVERVIEW' | 'ARTICLES' | 'USERS' | 'TEAM' | 'LAYOUT' | 'BRAND';

const ADMIN_NAV: { id: AdminSection; label: string; icon: string }[] = [
  { id: 'OVERVIEW', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'ARTICLES', label: 'Articles', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
  { id: 'USERS', label: 'Subscribers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'TEAM', label: 'Writers', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'LAYOUT', label: 'Site Layout', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'BRAND', label: 'Brand Studio', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
];

interface AdminDashboardProps {
  initialSection?: AdminSection;
}

interface WriterFromApi {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  image?: string;
  articlesCount: number;
  socials: { twitter: string; linkedin: string };
}

interface SubscriberFromApi {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  joined: string;
  status: string;
}

interface SiteLayoutSettingsForm {
  showLogoInHeader: boolean;
  stickyHeader: boolean;
  showHero: boolean;
  showTrending: boolean;
  showFooter: boolean;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23e2e8f0" width="40" height="40"/%3E%3C/svg%3E';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialSection = 'OVERVIEW' }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const activeSection = initialSection;
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Writers (TEAM section)
  const [writersList, setWritersList] = useState<WriterFromApi[]>([]);
  const [writersLoading, setWritersLoading] = useState(true);
  const [addWriterModalOpen, setAddWriterModalOpen] = useState(false);
  const [addWriterSubmitting, setAddWriterSubmitting] = useState(false);
  const [removingWriterId, setRemovingWriterId] = useState<string | null>(null);
  const [removingWriterInProgress, setRemovingWriterInProgress] = useState(false);
  const [editingWriter, setEditingWriter] = useState<WriterFromApi | null>(null);
  const [editWriterSubmitting, setEditWriterSubmitting] = useState(false);
  const [subscribersList, setSubscribersList] = useState<SubscriberFromApi[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [layoutSettings, setLayoutSettings] = useState<SiteLayoutSettingsForm | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [newWriterForm, setNewWriterForm] = useState({
    name: '',
    role: '',
    bio: '',
    image: '',
    twitter: '',
    linkedin: '',
  });

  useEffect(() => {
    fetch('/api/articles?admin=1')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setArticlesLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/writers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setWritersList(Array.isArray(data) ? data : []))
      .catch(() => setWritersList([]))
      .finally(() => setWritersLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSubscribersList(Array.isArray(data) ? data : []))
      .catch(() => setSubscribersList([]))
      .finally(() => setSubscribersLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLayoutSettings({
            showLogoInHeader: data.showLogoInHeader ?? true,
            stickyHeader: data.stickyHeader ?? true,
            showHero: data.showHero ?? true,
            showTrending: data.showTrending ?? true,
            showFooter: data.showFooter ?? true,
          });
        } else {
          setLayoutSettings({
            showLogoInHeader: true,
            stickyHeader: true,
            showHero: true,
            showTrending: true,
            showFooter: true,
          });
        }
      })
      .catch(() => setLayoutSettings({
        showLogoInHeader: true,
        stickyHeader: true,
        showHero: true,
        showTrending: true,
        showFooter: true,
      }))
      .finally(() => setLayoutLoading(false));
  }, []);

  const handleSaveLayoutSettings = async () => {
    if (!layoutSettings) return;
    setLayoutSaving(true);
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setLayoutSettings(data);
      }
    } catch (e) {
      console.error('Save layout failed', e);
    } finally {
      setLayoutSaving(false);
    }
  };

  const refetchWriters = () => {
    fetch('/api/writers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setWritersList(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const handleAddWriterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWriterForm.name.trim()) return;
    setAddWriterSubmitting(true);
    try {
      const res = await fetch('/api/writers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWriterForm.name.trim(),
          role: newWriterForm.role.trim() || undefined,
          bio: newWriterForm.bio.trim() || undefined,
          image: newWriterForm.image.trim() || undefined,
          twitter: newWriterForm.twitter.trim() || undefined,
          linkedin: newWriterForm.linkedin.trim() || undefined,
        }),
      });
      if (res.ok) {
        setNewWriterForm({ name: '', role: '', bio: '', image: '', twitter: '', linkedin: '' });
        setAddWriterModalOpen(false);
        refetchWriters();
      }
    } catch (err) {
      console.error('Add writer failed', err);
    } finally {
      setAddWriterSubmitting(false);
    }
  };

  const handleRemoveWriter = async (writerId: string) => {
    setRemovingWriterInProgress(true);
    try {
      const res = await fetch(`/api/writers/${writerId}`, { method: 'DELETE' });
      if (res.ok) setWritersList((prev) => prev.filter((w) => w.id !== writerId));
    } catch (e) {
      console.error('Remove writer failed', e);
    } finally {
      setRemovingWriterInProgress(false);
      setRemovingWriterId(null);
    }
  };

  const openEditWriter = (w: WriterFromApi) => {
    setNewWriterForm({
      name: w.name,
      role: w.role ?? '',
      bio: w.bio ?? '',
      image: w.image ?? '',
      twitter: w.socials?.twitter && w.socials.twitter !== '#' ? w.socials.twitter : '',
      linkedin: w.socials?.linkedin && w.socials.linkedin !== '#' ? w.socials.linkedin : '',
    });
    setEditingWriter(w);
  };

  const handleEditWriterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWriter || !newWriterForm.name.trim()) return;
    setEditWriterSubmitting(true);
    try {
      const res = await fetch(`/api/writers/${editingWriter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWriterForm.name.trim(),
          role: newWriterForm.role.trim() || null,
          bio: newWriterForm.bio.trim() || null,
          image: newWriterForm.image.trim() || null,
          twitter: newWriterForm.twitter.trim() || null,
          linkedin: newWriterForm.linkedin.trim() || null,
        }),
      });
      if (res.ok) {
        setEditingWriter(null);
        refetchWriters();
      }
    } catch (err) {
      console.error('Edit writer failed', err);
    } finally {
      setEditWriterSubmitting(false);
    }
  };

  // Brand Studio State
  const [brandPrompt, setBrandPrompt] = useState('');
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'>('All');

  const publishedCount = useMemo(() => articles.filter((a) => a.status === 'PUBLISHED').length, [articles]);
  const subscriberCount = useMemo(
    () => subscribersList.filter((u) => u.role !== 'ADMIN').length,
    [subscribersList]
  );
  const stats: Stats = {
    totalRevenue: 0,
    subscriberCount,
    articleCount: articles.length,
    monthlyGrowth: 0,
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

      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            setGeneratedLogo(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Branding error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    setDeletingInProgress(true);
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      if (res.ok) setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error('Delete article failed', e);
    } finally {
      setDeletingInProgress(false);
      setIsDeleting(null);
    }
  };

  const handleStatusChange = async (articleId: string, newStatus: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED') => {
    setUpdatingStatusId(articleId);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleId ? { ...a, status: newStatus } : a))
        );
      }
    } catch (e) {
      console.error('Update status failed', e);
    } finally {
      setUpdatingStatusId(null);
    }
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

  return (
    <>
      <main className="flex-grow overflow-y-auto">
        <header className="bg-white border-b border-slate-100 px-12 py-6 flex justify-between items-center sticky top-0 z-40">
           <div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">
               {ADMIN_NAV.find(n => n.id === activeSection)?.label ?? activeSection}
             </h2>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">System Management</p>
           </div>
           <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 tracking-widest transition"
              >
                Log out
              </button>
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

          {activeSection === 'USERS' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-slate-500 font-medium">Manage subscribers and subscription tiers.</p>
                <button type="button" className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition">
                  Export list
                </button>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-6">Subscriber</th>
                      <th className="px-8 py-6">Tier</th>
                      <th className="px-8 py-6">Joined</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {subscribersLoading ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                          Loading subscribers…
                        </td>
                      </tr>
                    ) : subscribersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                          No subscribers in the database yet.
                        </td>
                      </tr>
                    ) : (
                      subscribersList.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div>
                              <p className="text-sm font-black text-slate-900">{row.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{row.email}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                              {row.tier === 'UNLIMITED' ? 'Unlimited' : row.tier === 'TWO_ARTICLES' ? 'Standard' : row.tier === 'ONE_ARTICLE' ? 'One article' : row.tier === 'NONE' ? 'None' : row.tier}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-600">{row.joined}</td>
                          <td className="px-8 py-6">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${row.status === 'Active' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-100'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button type="button" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'TEAM' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-slate-500 font-medium">Manage writers and contributors.</p>
                <button
                  onClick={() => {
                    setNewWriterForm({ name: '', role: '', bio: '', image: '', twitter: '', linkedin: '' });
                    setAddWriterModalOpen(true);
                  }}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition"
                >
                  Add writer
                </button>
              </div>
              {writersLoading ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center text-slate-500 font-medium">
                  Loading writers…
                </div>
              ) : writersList.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center">
                  <p className="text-slate-500 font-medium mb-4">No writers yet.</p>
                  <button
                    onClick={() => {
                      setNewWriterForm({ name: '', role: '', bio: '', image: '', twitter: '', linkedin: '' });
                      setAddWriterModalOpen(true);
                    }}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition"
                  >
                    Add writer
                  </button>
                </div>
              ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {writersList.map(w => (
                  <div key={w.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-100">
                        <img src={w.image || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt={w.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-black text-slate-900 truncate">{w.name}</h4>
                        {w.role && <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{w.role}</p>}
                        {w.bio && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{w.bio}</p>}
                        <p className="text-[10px] font-black text-slate-400 uppercase mt-3">{w.articlesCount} articles</p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditWriter(w)}
                        className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemovingWriterId(w.id)}
                        className="py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {activeSection === 'LAYOUT' && (
            <div className="max-w-3xl space-y-8 animate-fade-in">
              <p className="text-slate-500 font-medium">Configure global site structure and visibility of sections. Changes apply to the public site immediately after saving.</p>
              {layoutLoading ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center text-slate-500 font-medium">
                  Loading layout settings…
                </div>
              ) : layoutSettings && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-8">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Header &amp; navigation</h4>
                <div className="flex items-center justify-between py-4 border-b border-slate-50">
                  <div>
                    <p className="text-sm font-black text-slate-900">Show logo in header</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Display site logo in the main navigation bar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutSettings.showLogoInHeader}
                      onChange={() => setLayoutSettings((s) => s ? { ...s, showLogoInHeader: !s.showLogoInHeader } : s)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-slate-50">
                  <div>
                    <p className="text-sm font-black text-slate-900">Sticky header</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Keep navigation visible on scroll</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutSettings.stickyHeader}
                      onChange={() => setLayoutSettings((s) => s ? { ...s, stickyHeader: !s.stickyHeader } : s)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 pt-4">Homepage sections</h4>
                <div className="flex items-center justify-between py-4 border-b border-slate-50">
                  <div>
                    <p className="text-sm font-black text-slate-900">Hero / landing block</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Yellow hero with &quot;Think deeper&quot; headline</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutSettings.showHero}
                      onChange={() => setLayoutSettings((s) => s ? { ...s, showHero: !s.showHero } : s)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-slate-50">
                  <div>
                    <p className="text-sm font-black text-slate-900">Trending section</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Show trending stories on the feed</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutSettings.showTrending}
                      onChange={() => setLayoutSettings((s) => s ? { ...s, showTrending: !s.showTrending } : s)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 pt-4">Footer</h4>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-black text-slate-900">Show footer on all pages</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Display links and copyright in footer</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutSettings.showFooter}
                      onChange={() => setLayoutSettings((s) => s ? { ...s, showFooter: !s.showFooter } : s)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={handleSaveLayoutSettings}
                    disabled={layoutSaving}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition disabled:opacity-50"
                  >
                    {layoutSaving ? 'Saving…' : 'Save layout settings'}
                  </button>
                </div>
              </div>
              )}
            </div>
          )}

          {activeSection === 'OVERVIEW' && (
            <div className="space-y-12 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
                {[
                  { label: 'Subscribers', value: stats.subscriberCount.toLocaleString(), sub: 'From database' },
                  { label: 'Articles', value: stats.articleCount.toString(), sub: 'Total' },
                  { label: 'Published', value: publishedCount.toString(), sub: 'Live' },
                  { label: 'Writers', value: writersList.length.toString(), sub: 'Team' },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{item.label}</p>
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-3xl font-black text-slate-900">{item.value}</h2>
                      {item.sub && <span className="text-[10px] font-bold text-slate-400">{item.sub}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-100 p-10">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Editorial Activity</h3>
                    <Link href="/admin/articles" className="text-xs font-black uppercase text-indigo-600 tracking-widest hover:underline">Manage All</Link>
                 </div>
                 {articlesLoading ? (
                   <div className="py-12 text-center text-slate-500 font-medium">Loading articles…</div>
                 ) : articles.length === 0 ? (
                   <div className="py-12 text-center text-slate-500 font-medium">No articles yet. <Link href="/admin/editor" className="text-indigo-600 hover:underline">Create one</Link>.</div>
                 ) : (
                 <div className="space-y-6">
                    {articles.slice(0, 5).map(art => (
                      <div key={art.id} className="flex items-center gap-6 p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                         <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={art.featuredImage || PLACEHOLDER_IMAGE} alt="" className="w-full h-full object-cover" />
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
                 )}
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
                <Link 
                  href="/admin/editor"
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-100 hover:bg-indigo-600 transition-all inline-block"
                >
                  Compose New
                </Link>
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
                    {articlesLoading ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                          Loading articles…
                        </td>
                      </tr>
                    ) : filteredArticles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                          No articles yet. <Link href="/admin/editor" className="text-indigo-600 hover:underline">Compose one</Link>.
                        </td>
                      </tr>
                    ) : (
                    <>
                      {filteredArticles.map(article => (
                        <tr key={article.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                   <img src={article.featuredImage || PLACEHOLDER_IMAGE} alt="" className="w-full h-full object-cover" />
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
                            <select
                              value={article.status}
                              onChange={(e) => handleStatusChange(article.id, e.target.value as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED')}
                              disabled={updatingStatusId === article.id}
                              className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border-0 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 ${article.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}
                            >
                              <option value="DRAFT">Draft</option>
                              <option value="PUBLISHED">Published</option>
                              <option value="SCHEDULED">Scheduled</option>
                            </select>
                            {updatingStatusId === article.id && (
                              <span className="ml-2 text-[10px] text-slate-400">Updating…</span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end items-center gap-3">
                                <Link 
                                  href={`/admin/editor?id=${article.id}`}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all text-xs font-bold"
                                  title="Edit article"
                                >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                   Edit
                                </Link>
                                <button 
                                  onClick={() => setIsDeleting(article.id)}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-bold"
                                  title="Delete article"
                                >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                   Delete
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </>
                    )}
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
                  onClick={() => !deletingInProgress && setIsDeleting(null)}
                  disabled={deletingInProgress}
                  className="flex-1 px-8 py-4 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition disabled:opacity-50"
                 >
                   Keep Story
                 </button>
                 <button 
                  onClick={() => isDeleting && handleDeleteArticle(isDeleting)}
                  disabled={deletingInProgress}
                  className="flex-1 bg-red-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-600 transition disabled:opacity-50"
                 >
                   {deletingInProgress ? 'Deleting…' : 'Confirm Delete'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Remove Writer Confirmation Modal */}
      {removingWriterId && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-12 max-w-md w-full animate-fade-up shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-8">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">Remove this writer?</h3>
            <p className="text-slate-500 font-medium mb-10">
              {writersList.find((w) => w.id === removingWriterId)?.name ?? 'This writer'} will be removed from the team list. This does not delete any articles.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => !removingWriterInProgress && setRemovingWriterId(null)}
                disabled={removingWriterInProgress}
                className="flex-1 px-8 py-4 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition disabled:opacity-50"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => handleRemoveWriter(removingWriterId)}
                disabled={removingWriterInProgress}
                className="flex-1 bg-red-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-600 transition disabled:opacity-50"
              >
                {removingWriterInProgress ? 'Removing…' : 'Remove writer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Writer Modal */}
      {editingWriter && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full animate-fade-up shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Edit writer</h3>
            <form onSubmit={handleEditWriterSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={newWriterForm.name}
                  onChange={(e) => setNewWriterForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jean Bosco"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Role</label>
                <input
                  type="text"
                  value={newWriterForm.role}
                  onChange={(e) => setNewWriterForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Senior Correspondent"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Bio</label>
                <textarea
                  value={newWriterForm.bio}
                  onChange={(e) => setNewWriterForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Short bio or description"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Image URL</label>
                <input
                  type="url"
                  value={newWriterForm.image}
                  onChange={(e) => setNewWriterForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Twitter</label>
                  <input
                    type="text"
                    value={newWriterForm.twitter}
                    onChange={(e) => setNewWriterForm((f) => ({ ...f, twitter: e.target.value }))}
                    placeholder="URL or handle"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">LinkedIn</label>
                  <input
                    type="text"
                    value={newWriterForm.linkedin}
                    onChange={(e) => setNewWriterForm((f) => ({ ...f, linkedin: e.target.value }))}
                    placeholder="URL"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingWriter(null)}
                  disabled={editWriterSubmitting}
                  className="flex-1 px-8 py-4 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editWriterSubmitting || !newWriterForm.name.trim()}
                  className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition disabled:opacity-50"
                >
                  {editWriterSubmitting ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Writer Modal */}
      {addWriterModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full animate-fade-up shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Add writer</h3>
            <form onSubmit={handleAddWriterSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={newWriterForm.name}
                  onChange={(e) => setNewWriterForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jean Bosco"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Role</label>
                <input
                  type="text"
                  value={newWriterForm.role}
                  onChange={(e) => setNewWriterForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Senior Correspondent"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Bio</label>
                <textarea
                  value={newWriterForm.bio}
                  onChange={(e) => setNewWriterForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Short bio or description"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Image URL</label>
                <input
                  type="url"
                  value={newWriterForm.image}
                  onChange={(e) => setNewWriterForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Twitter</label>
                  <input
                    type="text"
                    value={newWriterForm.twitter}
                    onChange={(e) => setNewWriterForm((f) => ({ ...f, twitter: e.target.value }))}
                    placeholder="URL or handle"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">LinkedIn</label>
                  <input
                    type="text"
                    value={newWriterForm.linkedin}
                    onChange={(e) => setNewWriterForm((f) => ({ ...f, linkedin: e.target.value }))}
                    placeholder="URL"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setAddWriterModalOpen(false)}
                  disabled={addWriterSubmitting}
                  className="flex-1 px-8 py-4 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addWriterSubmitting || !newWriterForm.name.trim()}
                  className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition disabled:opacity-50"
                >
                  {addWriterSubmitting ? 'Adding…' : 'Add writer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
