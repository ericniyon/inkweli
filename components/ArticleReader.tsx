import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Article, Highlight, User, Response, SubscriptionTier } from '../types';
import type { WriterItem } from '@/lib/articles-server';
import { PLACEHOLDER_IMAGE } from '../constants';
import OptimizedImage from './OptimizedImage';
import GeminiAssistant from './GeminiAssistant';
import ResponsesDrawer from './ResponsesDrawer';
import HighlightDrawer from './HighlightDrawer';
import { RelatedArticleCardCompact } from './RelatedArticleCard';

/** Min and max paragraphs shown for free before the paywall (4–5) */
const FREE_PREVIEW_PARAGRAPHS_MIN = 4;
const FREE_PREVIEW_PARAGRAPHS_MAX = 5;

/** Stable per-article value in [min, max] so different articles can show 2, 3, or 4 free paragraphs */
function getFreePreviewParagraphCount(articleId: string): number {
  const n = FREE_PREVIEW_PARAGRAPHS_MAX - FREE_PREVIEW_PARAGRAPHS_MIN + 1;
  const hash = articleId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return FREE_PREVIEW_PARAGRAPHS_MIN + (Math.abs(hash) % n);
}

/** True if the HTML block has meaningful text content (not just images/tags) */
function hasTextContent(html: string): boolean {
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return text.length >= 10;
}

/** Returns the first N text paragraphs; images and image-only blocks are not counted as paragraphs. */
function getFirstNParagraphsHtml(html: string, n: number): string {
  const trimmed = (html || '').trim();
  if (!trimmed) return '';

  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let textParagraphCount = 0;
  let endIndex = 0;

  for (const m of trimmed.matchAll(pRegex)) {
    const fullMatch = m[0];
    const inner = m[1] || '';
    if (hasTextContent(inner)) {
      textParagraphCount++;
      endIndex = m.index! + fullMatch.length;
      if (textParagraphCount >= n) break;
    }
  }

  if (textParagraphCount >= n && endIndex > 0) {
    return trimmed.slice(0, endIndex);
  }

  if (textParagraphCount > 0) {
    return trimmed.slice(0, endIndex || trimmed.length);
  }

  // No <p> tags or no text in them: plain text by double newlines
  const blocks = trimmed.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  if (blocks.length > 0) {
    const firstN = blocks.slice(0, n);
    return firstN.map((block) => `<p>${block.trim().replace(/\n/g, '<br>')}</p>`).join('');
  }

  const fallback = trimmed.slice(0, 1200).trim();
  return fallback ? `<p>${fallback.replace(/\n/g, '<br>')}</p>` : trimmed;
}

/** Decode common HTML entities so highlight plain text can match content */
function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

interface ArticleReaderProps {
  article: Article;
  allArticles: Article[];
  currentUser: User;
  onArticleClick: (article: Article) => void;
  onAuthorClick: (id: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  /** When true, only first paragraph is shown and "Read More" sends to payment page */
  isLimitedAccess?: boolean;
  /** Called when user taps "Read More" to go to payment packages */
  onReadMoreClick?: () => void;
  /** Writers list for author bio (optional) */
  writers?: WriterItem[];
}

// Audio Decoding Helpers
function decode(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ArticleReader: React.FC<ArticleReaderProps> = ({ 
  article, 
  allArticles,
  currentUser, 
  onArticleClick, 
  onAuthorClick,
  isBookmarked,
  onToggleBookmark,
  isFollowing,
  onToggleFollow,
  isLimitedAccess = false,
  onReadMoreClick,
  writers = [],
}) => {
  const isGuest = isLimitedAccess;
  const hasFullListen = !isGuest && currentUser.tier === SubscriptionTier.UNLIMITED;
  const author = useMemo(
    () => writers.find((w) => w.id === article.authorId),
    [writers, article.authorId]
  ); // for existing handlers that check isGuest
  const [claps, setClaps] = useState(article.claps);
  const [hasClapped, setHasClapped] = useState(article.hasClapped ?? false);
  const [progress, setProgress] = useState(0);
  const [isResponsesOpen, setIsResponsesOpen] = useState(false);
  const [isHighlightDrawerOpen, setIsHighlightDrawerOpen] = useState(false);
  
  const [responses, setResponses] = useState<Response[]>(article.responses || []);
  const [highlights, setHighlights] = useState<Highlight[]>(article.highlights || []);
  const [selectionRange, setSelectionRange] = useState<{ rect: DOMRect, text: string } | null>(null);
  const [activeHighlightIds, setActiveHighlightIds] = useState<string[]>([]);

  useEffect(() => {
    setHighlights(article.highlights || []);
    setActiveHighlightIds([]);
    setClaps(article.claps);
    setHasClapped(article.hasClapped ?? false);
  }, [article.id, article.claps, article.hasClapped]);
  
  // Audio State
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      stopAudio();
    };
  }, []);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const text = selection?.toString().trim() ?? '';
      const isInContent = range && contentRef.current?.contains(range.commonAncestorContainer);
      const isClickOnTrigger = target.closest('.highlight-trigger') || target.closest('.p-comment-trigger') || target.closest('[data-selection-toolbar]');

      if (text.length > 3 && isInContent) {
        const rect = range!.getBoundingClientRect();
        setSelectionRange({ rect, text });
      } else if (!isClickOnTrigger && !isHighlightDrawerOpen) {
        setSelectionRange(null);
        setActiveHighlightIds([]);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isHighlightDrawerOpen]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsAudioPlaying(false);
  };

  const handleListen = async () => {
    if (isAudioPlaying) {
      stopAudio();
      return;
    }

    setIsAudioLoading(true);
    try {
      const res = await fetch('/api/read-aloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          ...(isGuest ? {} : { userId: currentUser.id }),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to generate audio');

      const base64Audio = json.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          ctx,
          24000,
          1,
        );

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsAudioPlaying(false);
        
        audioSourceRef.current = source;
        source.start(0);
        setIsAudioPlaying(true);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      alert("Failed to generate audio. Please try again.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleClap = async () => {
    if (isGuest) {
      onReadMoreClick?.();
      return;
    }
    if (hasClapped) return; // Already clapped, prevent double-clap
    try {
      const res = await fetch(`/api/articles/${article.id}/clap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to clap');
      setClaps(data.claps ?? claps + 1);
      setHasClapped(data.clapped ?? true);
    } catch (err) {
      console.error('Clap error:', err);
      alert(err instanceof Error ? err.message : 'Failed to clap article.');
    }
  };

  const handlePostResponse = async (text: string) => {
    if (isGuest) {
      onReadMoreClick?.();
      return;
    }
    try {
      const res = await fetch(`/api/articles/${article.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, text: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to post response');
      const created: Response = {
        id: data.id,
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        text: data.text,
        createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        claps: data.claps ?? 0,
      };
      setResponses([created, ...responses]);
    } catch (err) {
      console.error('Post response error:', err);
      alert(err instanceof Error ? err.message : 'Failed to post response.');
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = article.title;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard?.writeText(url);
      alert('Link copied to clipboard.');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      try {
        await navigator.clipboard?.writeText(url);
        alert('Link copied to clipboard.');
      } catch {
        alert('Could not share or copy link.');
      }
    }
  };

  const [isSavingHighlight, setIsSavingHighlight] = useState(false);

  const handleAddHighlight = async (comment: string) => {
    if (!selectionRange) return;
    setIsSavingHighlight(true);
    try {
      const res = await fetch(`/api/articles/${article.id}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectionRange.text,
          comment: comment.trim(),
          userId: currentUser.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save note');
      }
      const saved: Highlight = await res.json();
      setHighlights((prev) => [...prev, saved]);
      setSelectionRange(null);
      setIsHighlightDrawerOpen(false);
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      console.error('Save highlight error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save note. Please try again.');
    } finally {
      setIsSavingHighlight(false);
    }
  };

  const freePreviewParagraphs = useMemo(
    () => getFreePreviewParagraphCount(article.id),
    [article.id]
  );

  const highlightedContent = useMemo(() => {
    let content = isLimitedAccess ? getFirstNParagraphsHtml(article.content, freePreviewParagraphs) : article.content;
    // Preserve newlines/line breaks (HTML collapses \n when parsed)
    content = content.replace(/\n/g, '<br>');
    content = decodeHtmlEntities(content);

    // 1. Process Highlights: group by normalized text; match in decoded HTML with flexible whitespace
    const normalize = (t: string) => t.trim().replace(/\s+/g, ' ');
    const byText = new Map<string, Highlight[]>();
    highlights.forEach(h => {
      const key = normalize(h.text);
      if (!key) return;
      if (!byText.has(key)) byText.set(key, []);
      byText.get(key)!.push(h);
    });
    // Longest first so we don't wrap inner phrases and break the outer span
    const sortedEntries = [...byText.entries()].sort((a, b) => b[0].length - a[0].length);
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sortedEntries.forEach(([text, group]) => {
      const pattern = text.split(/\s+/).map(escapeRegex).join('\\s+');
      const regex = new RegExp(pattern, 'i');
      const ids = group.map(h => h.id).join(',');
      content = content.replace(regex, (match) =>
        `<span class="highlight-trigger bg-[#dcfce7] border-b-2 border-green-400/60 cursor-pointer transition-all hover:bg-[#bbf7d0] rounded-sm px-0.5" data-highlight-ids="${ids}">${match}</span>`
      );
    });

    // 2. Wrap Paragraphs with comment triggers
    const pCommentIcon = `
      <button class="p-comment-trigger" data-action="paragraph-comment">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke-width="2.5"/>
        </svg>
      </button>
    `;

    content = content.replace(/<p>([\s\S]*?)<\/p>/g, (_match, p1) => {
      return `<p class="paragraph-target">${p1}${pCommentIcon}</p>`;
    });
    
    return content;
  }, [article.content, highlights, isLimitedAccess, freePreviewParagraphs]);

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const triggerBtn = target.closest('.p-comment-trigger');
    const highlightTrigger = target.closest('.highlight-trigger');

    if (triggerBtn) {
      e.preventDefault();
      const parentP = triggerBtn.closest('p');
      if (parentP) {
        const pText = parentP.innerText.replace(/[\n\r]/g, ' ').trim();
        const rect = parentP.getBoundingClientRect();
        setSelectionRange({ rect, text: pText });
        setIsHighlightDrawerOpen(true);
      }
      return;
    }

    if (highlightTrigger) {
      e.preventDefault();
      const idsStr = highlightTrigger.getAttribute('data-highlight-ids');
      setActiveHighlightIds(idsStr ? idsStr.split(',').filter(Boolean) : []);
    } else {
      setActiveHighlightIds([]);
    }
  };

  const activeHighlights = useMemo(() => 
    activeHighlightIds.map(id => highlights.find(h => h.id === id)).filter(Boolean) as Highlight[], 
  [highlights, activeHighlightIds]);

  const moreFromAuthor = useMemo(() => 
    allArticles.filter(a => a.authorId === article.authorId && a.id !== article.id).slice(0, 3),
  [allArticles, article]);

  const moreFromCategory = useMemo(() => 
    allArticles.filter(a => a.category === article.category && a.id !== article.id && !moreFromAuthor.some(auth => auth.id === a.id)).slice(0, 3),
  [allArticles, article, moreFromAuthor]);

  return (
    <div className="relative pb-32 animate-fade-in bg-white min-h-screen">
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-50 z-[110]">
        <div className="h-full bg-slate-900 transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        <article className="min-w-0">
          <header className="mb-10">
            <h1 className="font-charter font-black text-slate-900 text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight mb-4">
              {article.title}
            </h1>
            <p className="font-charter text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
              {article.excerpt}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button onClick={() => onAuthorClick(article.authorId)} className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  <OptimizedImage src={article.authorAvatar || PLACEHOLDER_IMAGE} alt={article.authorName} width={40} height={40} className="w-full h-full object-cover" />
                </button>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <p className="font-charter font-bold text-slate-900 text-sm cursor-pointer hover:underline" onClick={() => onAuthorClick(article.authorId)}>{article.authorName}</p>
                  <button
                    onClick={onToggleFollow}
                    className={`font-charter text-xs font-bold transition px-2.5 py-1 rounded-full border ${isFollowing ? 'text-slate-400 border-slate-200' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <span className="text-slate-400 text-sm">·</span>
                  <span className="font-charter text-slate-500 text-sm">{article.readingTime} min read</span>
                  <span className="text-slate-400 text-sm">·</span>
                  <span className="font-charter text-slate-500 text-sm">{article.publishDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleClap}
                    disabled={hasClapped || isGuest}
                    className={`flex items-center gap-1.5 font-charter text-sm font-bold transition ${hasClapped ? 'text-slate-700' : isGuest ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <svg className="w-5 h-5" fill={hasClapped ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M14 10h4.757c1.246 0 2.257 1.01 2.257 2.257 0 .307-.061.611-.182.894l-2.9 6.767c-.271.633-.893 1.039-1.58 1.039H8.435c-.943 0-1.706-.763-1.706-1.706V10.706c0-.452.18-.886.5-1.206l5.206-5.206a1.706 1.706 0 012.413 2.413L14 10z" /></svg>
                    {claps >= 1000 ? `${(claps / 1000).toFixed(1)}K` : claps.toLocaleString()}
                  </button>
                  <button
                    type="button"
                    onClick={() => (isLimitedAccess ? onReadMoreClick?.() : setIsResponsesOpen(true))}
                    className="flex items-center gap-1.5 font-charter text-sm font-bold text-slate-600 hover:text-slate-900"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {responses.length}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={onToggleBookmark} className="p-1.5 text-slate-500 hover:text-slate-900 transition" aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
                    <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleListen}
                    disabled={isAudioLoading}
                    title={hasFullListen ? "Listen to full article" : "Listen to first paragraph (full article for annual subscribers)"}
                    className="p-1.5 text-slate-500 hover:text-slate-900 transition"
                    aria-label={hasFullListen ? "Listen to full article" : "Listen to first paragraph"}
                  >
                    {isAudioLoading ? <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> : isAudioPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>}
                  </button>
                  <button type="button" onClick={handleShare} className="p-1.5 text-slate-500 hover:text-slate-900 transition" aria-label="Share">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  </button>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 transition" aria-label="More">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Author bio below header, optional */}
          {(author?.bio || author?.role) && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 mb-10">
              {author?.role && <p className="font-charter text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{author.role}</p>}
              {author?.bio && <p className="font-charter text-sm text-slate-600 leading-relaxed">{author.bio}</p>}
            </div>
          )}

          <div className="relative">
            {/* Floating toolbar when text is selected */}
          {selectionRange && !isHighlightDrawerOpen && (
            <div
              data-selection-toolbar
              className="fixed z-[150] flex items-center gap-1 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 py-2 px-2 animate-in fade-in zoom-in-95 duration-200"
              style={{
                top: selectionRange.rect.top - 52,
                left: Math.max(12, Math.min(window.innerWidth - 280, selectionRange.rect.left + selectionRange.rect.width / 2 - 140)),
                transform: 'translateY(-100%)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsHighlightDrawerOpen(true)}
                className="font-charter flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 text-medium-meta font-bold hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Add note
              </button>
              <button
                type="button"
                onClick={async () => {
                  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';
                  try {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      await navigator.share({
                        title: article.title,
                        text: `"${selectionRange.text}" — Read more:`,
                        url: articleUrl,
                      });
                    } else {
                      await navigator.clipboard?.writeText(`"${selectionRange.text}"\n\nRead this article: ${articleUrl}`);
                      alert('Link and selection copied. Share it to invite someone to read.');
                    }
                  } catch (e) {
                    if ((e as Error).name !== 'AbortError') {
                      try {
                        await navigator.clipboard?.writeText(articleUrl);
                        alert('Link copied to clipboard.');
                      } catch {
                        alert('Could not copy link.');
                      }
                    }
                  }
                  setSelectionRange(null);
                  window.getSelection()?.removeAllRanges();
                }}
                className="font-charter flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-medium-meta font-bold hover:bg-emerald-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Invite to Read
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectionRange(null);
                  window.getSelection()?.removeAllRanges();
                }}
                className="font-charter px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-medium-meta font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="relative">
            <div
              ref={contentRef}
              onClick={handleContentClick}
              className="article-content font-charter text-slate-800 leading-[1.8] selection:bg-emerald-100/60"
              style={isLimitedAccess ? { marginBottom: 0 } : undefined}
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
            {/* Pay-to-continue overlay: only for unpaid users (isLimitedAccess), after 4–5 free paragraphs */}
            {isLimitedAccess && onReadMoreClick && (
              <div className="relative mt-10 pb-12 min-h-[380px] flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/90 to-white pointer-events-none" aria-hidden />
                <div className="relative z-10 max-w-2xl mx-auto rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm pointer-events-none rounded-2xl" aria-hidden />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-slate-900/10 pointer-events-none rounded-2xl" aria-hidden />
                  <div className="relative z-10 text-center px-6 sm:px-10 py-8 sm:py-10">
                    <h2 className="font-charter text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4">
                      Pay to continue reading the full story
                    </h2>
                    <p className="font-charter text-slate-600 text-base md:text-lg leading-relaxed mb-8">
                      You&apos;ve read the free preview. To read the rest of this article you need either a paid ThinkUp membership or an annual subscription.
                    </p>
                    <Link
                      href="/membership"
                      className="font-charter inline-block px-8 py-3.5 rounded-full bg-slate-900 text-white text-base font-bold hover:bg-slate-800 transition shadow-lg hover:shadow-xl"
                    >
                      Pay to read full story
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>

          {!isGuest && <div className="mb-24" />}

          {/* Related: below article body, single column */}
          <footer className="mt-16 pt-10 border-t border-slate-100">
            {moreFromAuthor.length > 0 && (
              <div id="more-from-author" className="scroll-mt-24 mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-charter text-sm font-bold uppercase tracking-widest text-slate-500">More from {article.authorName}</h2>
                  <button type="button" onClick={() => onAuthorClick(article.authorId)} className="font-charter text-sm font-bold text-slate-600 hover:text-slate-900">
                    See all
                  </button>
                </div>
                <div className="space-y-4">
                  {moreFromAuthor.map((art) => (
                    <RelatedArticleCardCompact key={art.id} article={art} onClick={() => onArticleClick(art)} />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 className="font-charter text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">More from {article.category}</h2>
              {moreFromCategory.length > 0 ? (
                <div className="space-y-4">
                  {moreFromCategory.map((art) => (
                    <RelatedArticleCardCompact key={art.id} article={art} onClick={() => onArticleClick(art)} />
                  ))}
                </div>
              ) : (
                <p className="font-charter text-sm text-slate-400 italic py-4">No other stories in this category yet.</p>
              )}
            </div>
          </footer>
        </article>
      </div>

      {/* Highlight Side Drawer: comment on selected text */}
      <HighlightDrawer 
        isOpen={isHighlightDrawerOpen}
        onClose={() => {
          setIsHighlightDrawerOpen(false);
          setSelectionRange(null);
          window.getSelection()?.removeAllRanges();
        }}
        selectedText={selectionRange?.text || ''}
        onSave={handleAddHighlight}
        currentUser={currentUser}
        isSaving={isSavingHighlight}
        isGuest={isLimitedAccess}
        onLoginClick={onReadMoreClick}
      />

      {/* Community notes side drawer */}
      {activeHighlights.length > 0 && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={() => setActiveHighlightIds([])}
            aria-hidden
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-[0_0_80px_rgba(0,0,0,0.08)] flex flex-col animate-in slide-in-from-right duration-300 ease-out border-l border-slate-100">
            <header className="px-8 py-6 flex justify-between items-center border-b border-slate-100 bg-white shrink-0">
              <div>
                <h2 className="font-charter text-medium-h2 font-black text-slate-900 tracking-tight">Community notes</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {activeHighlights.length} {activeHighlights.length === 1 ? 'note' : 'notes'} on this passage
                </p>
              </div>
              <button
                onClick={() => setActiveHighlightIds([])}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-5 rounded-r-xl">
                <p className="text-[10px] font-bold text-green-800 uppercase tracking-wider mb-2">Highlighted passage</p>
                <p className="font-charter text-medium-meta text-slate-700 italic leading-relaxed">
                  &ldquo;{activeHighlights[0].text}&rdquo;
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes from readers</p>
                <div className="space-y-5">
                  {activeHighlights.map((h) => (
                    <div key={h.id} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-slate-100 flex-shrink-0">
                        <OptimizedImage src={h.userAvatar || PLACEHOLDER_IMAGE} alt={h.userName} width={40} height={40} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-charter text-medium-meta font-bold text-slate-900 leading-none">{h.userName}</p>
                        <p className="font-charter text-medium-meta text-slate-700 leading-relaxed mt-2">{h.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <footer className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <span className="text-[10px] text-slate-400 font-medium italic">Shared via usethinkup Notes</span>
            </footer>
          </div>
        </div>
      )}

      <ResponsesDrawer 
        isOpen={isResponsesOpen} 
        onClose={() => setIsResponsesOpen(false)} 
        responses={responses}
        onPostResponse={handlePostResponse}
        currentUser={currentUser}
      />

      <GeminiAssistant article={article} />
    </div>
  );
};

export default ArticleReader;
