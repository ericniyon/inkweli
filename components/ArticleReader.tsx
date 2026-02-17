
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Article, Highlight, User, Response, SubscriptionTier } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import GeminiAssistant from './GeminiAssistant';
import ResponsesDrawer from './ResponsesDrawer';
import HighlightDrawer from './HighlightDrawer';

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
  onToggleFollow
}) => {
  const [claps, setClaps] = useState(article.claps);
  const [progress, setProgress] = useState(0);
  const [isResponsesOpen, setIsResponsesOpen] = useState(false);
  const [isHighlightDrawerOpen, setIsHighlightDrawerOpen] = useState(false);
  
  const [responses, setResponses] = useState<Response[]>(article.responses || []);
  const [highlights, setHighlights] = useState<Highlight[]>(article.highlights || []);
  const [selectionRange, setSelectionRange] = useState<{ rect: DOMRect, text: string } | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  
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
      // Small timeout to allow selection to finalize
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const text = selection.toString().trim();
          
          if (text.length > 3 && contentRef.current?.contains(range.commonAncestorContainer)) {
            const rect = range.getBoundingClientRect();
            setSelectionRange({ rect, text });
            // AUTOMATICALLY open the drawer instead of showing the popover
            setIsHighlightDrawerOpen(true);
          } else {
            const target = e.target as HTMLElement;
            // Only clear if we didn't click a trigger or the drawer itself
            if (!target.closest('.highlight-trigger') && !target.closest('.p-comment-trigger') && !isHighlightDrawerOpen) {
              setSelectionRange(null);
            }
          }
        }
      }, 50);
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const plainText = article.content.replace(/<[^>]*>?/gm, '');
      const prompt = `Read this article in a calm, professional tone: ${article.title}. ${plainText}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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

  const handleClap = () => setClaps(prev => prev + 1);

  const handlePostResponse = (text: string) => {
    const newResponse: Response = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: text,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      claps: 0
    };
    setResponses([newResponse, ...responses]);
  };

  const handleAddHighlight = (comment: string) => {
    if (!selectionRange) return;
    
    const newHighlight: Highlight = {
      id: Math.random().toString(36).substr(2, 9),
      articleId: article.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: selectionRange.text,
      comment: comment,
      createdAt: new Date().toISOString()
    };
    
    setHighlights([...highlights, newHighlight]);
    setSelectionRange(null);
    setIsHighlightDrawerOpen(false);
    window.getSelection()?.removeAllRanges();
  };

  const highlightedContent = useMemo(() => {
    let content = article.content;
    
    // 1. Process Highlights
    const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);
    sorted.forEach(h => {
      const escapedText = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedText, 'g');
      content = content.replace(regex, 
        `<span class="highlight-trigger bg-emerald-100/50 border-b-2 border-emerald-400/30 cursor-pointer transition-all hover:bg-emerald-200" data-highlight-id="${h.id}">${h.text}</span>`
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

    content = content.replace(/<p>(.*?)<\/p>/gs, (match, p1) => {
      return `<p class="paragraph-target">${p1}${pCommentIcon}</p>`;
    });
    
    return content;
  }, [article.content, highlights]);

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const triggerBtn = target.closest('.p-comment-trigger');
    const highlightTrigger = target.closest('.highlight-trigger');

    if (triggerBtn) {
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
      const hId = highlightTrigger.getAttribute('data-highlight-id');
      setActiveHighlightId(hId);
    } else {
      setActiveHighlightId(null);
    }
  };

  const activeHighlight = useMemo(() => 
    highlights.find(h => h.id === activeHighlightId), 
  [highlights, activeHighlightId]);

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

      <article className="max-w-screen-md mx-auto px-6 pt-16">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-8">
            <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Member-only story</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-[1.15] tracking-tight Charter">
            {article.title}
          </h1>

          <p className="text-xl text-slate-500 Charter leading-relaxed italic mb-10">
            {article.excerpt}
          </p>

          <div className="flex items-center justify-between py-6 border-y border-slate-100 mb-12">
             <div className="flex items-center gap-4">
                <button onClick={() => onAuthorClick(article.authorId)} className="w-12 h-12 rounded-full overflow-hidden border border-slate-100 transition-transform hover:scale-105 active:scale-95">
                   <img src={article.authorAvatar} className="w-full h-full object-cover" />
                </button>
                <div className="text-left">
                   <div className="flex items-center gap-3">
                     <p className="font-bold text-slate-900 text-sm hover:underline cursor-pointer" onClick={() => onAuthorClick(article.authorId)}>{article.authorName}</p>
                     <button 
                      onClick={onToggleFollow}
                      className={`text-sm font-bold transition px-3 py-0.5 rounded-full border ${isFollowing ? 'text-slate-400 border-slate-100' : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}
                     >
                       {isFollowing ? 'Following' : 'Follow'}
                     </button>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                     <span>{article.publishDate}</span>
                     <span>•</span>
                     <span>{article.readingTime} min read</span>
                   </div>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={handleListen}
                  disabled={isAudioLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isAudioPlaying ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  {isAudioLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : isAudioPlaying ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  )}
                  {isAudioLoading ? 'Preparing...' : isAudioPlaying ? 'Stop Listening' : 'Listen'}
                </button>
                <div className="h-4 w-px bg-slate-200 mx-2" />
                <button className="text-slate-400 hover:text-slate-900 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M24 11.5c0 5.955-4.823 10.78-10.776 10.78-5.953 0-10.776-4.825-10.776-10.78C2.448 5.544 7.27 .72 13.224.72 19.177.72 24 5.544 24 11.5z" strokeWidth="2" /></svg></button>
                <button className="text-slate-400 hover:text-slate-900 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeWidth="2"/></svg></button>
             </div>
          </div>
        </header>

        <div className="mb-12 -mx-4 md:-mx-12 lg:-mx-20 rounded-xl overflow-hidden shadow-2xl bg-slate-100">
          <img src={article.featuredImage} className="w-full h-full object-cover max-h-[500px]" />
        </div>

        <div 
          ref={contentRef}
          onClick={handleContentClick}
          className="article-content prose prose-slate prose-xl max-w-none text-slate-800 Charter mb-32 leading-[1.8] selection:bg-emerald-100/60"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />

        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-md border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-full px-8 py-3.5 flex items-center justify-between z-50 animate-fade-up">
           <div className="flex items-center gap-8">
              <button onClick={handleClap} className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition">
                 <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 10h4.757c1.246 0 2.257 1.01 2.257 2.257 0 .307-.061.611-.182.894l-2.9 6.767c-.271.633-.893 1.039-1.58 1.039H8.435c-.943 0-1.706-.763-1.706-1.706V10.706c0-.452.18-.886.5-1.206l5.206-5.206a1.706 1.706 0 012.413 2.413L14 10zM6.729 10H4.413C3.47 10 2.706 10.763 2.706 11.706v7.588c0 .943.763 1.706 1.706 1.706h2.318" strokeWidth="2"/></svg>
                 <span className="text-sm font-bold tracking-tight">{claps.toLocaleString()}</span>
              </button>
              <button 
                onClick={() => setIsResponsesOpen(true)}
                className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition"
              >
                 <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth="2"/></svg>
                 <span className="text-sm font-bold tracking-tight">{responses.length}</span>
              </button>
           </div>
           <div className="flex items-center gap-8">
              <button 
                onClick={onToggleBookmark}
                className={`transition group ${isBookmarked ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <svg className={`w-6 h-6 group-hover:scale-110 transition-transform ${isBookmarked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeWidth="2"/></svg>
              </button>
              <button className="text-slate-400 hover:text-slate-900 transition group">
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeWidth="2"/></svg>
              </button>
           </div>
        </div>
      </article>

      <section className="bg-slate-50 border-y border-slate-100 mt-20 py-24">
        <div className="max-w-screen-md mx-auto px-6">
           {moreFromAuthor.length > 0 && (
             <div className="mb-20">
               <div className="flex items-center justify-between mb-10">
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">More from {article.authorName}</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Written by the same author</p>
                 </div>
                 <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition" onClick={() => onAuthorClick(article.authorId)}>See all</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {moreFromAuthor.map(art => (
                   <div key={art.id} className="group cursor-pointer" onClick={() => onArticleClick(art)}>
                      <div className="aspect-video rounded-2xl overflow-hidden mb-4 border border-slate-100 bg-slate-200 shadow-sm">
                        <img src={art.featuredImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 Charter group-hover:text-indigo-600 transition-colors line-clamp-2">{art.title}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>{art.publishDate}</span>
                        <span>•</span>
                        <span>{art.readingTime} min read</span>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
           )}

           <div>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">More from {article.category}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Recommended in this section</p>
                </div>
              </div>
              <div className="space-y-8">
                 {moreFromCategory.map(art => (
                   <div key={art.id} className="flex gap-6 group cursor-pointer" onClick={() => onArticleClick(art)}>
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 bg-slate-200">
                         <img src={art.featuredImage} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow py-1">
                         <div className="flex items-center gap-2 mb-2">
                           <img src={art.authorAvatar} className="w-4 h-4 rounded-full" />
                           <span className="text-[10px] font-bold text-slate-900">{art.authorName}</span>
                         </div>
                         <h3 className="text-lg font-black text-slate-900 leading-tight Charter group-hover:text-indigo-600 transition-colors line-clamp-2">{art.title}</h3>
                      </div>
                   </div>
                 ))}
                 {moreFromCategory.length === 0 && (
                   <div className="py-12 text-center text-slate-400 italic text-sm">No other stories in this category yet.</div>
                 )}
              </div>
           </div>
        </div>
      </section>

      {/* Highlight Side Drawer for context-aware commenting */}
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
      />

      {activeHighlight && (
        <div 
          className="fixed z-[120] bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-6 rounded-2xl w-80 animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-100 ring-offset-2">
              <img src={activeHighlight.userAvatar} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 leading-none">{activeHighlight.userName}</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">Community Note</p>
            </div>
            <button onClick={() => setActiveHighlightId(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
            </button>
          </div>
          <div className="bg-slate-50 border-l-4 border-emerald-400 p-4 mb-4 rounded-r-xl">
            <p className="text-xs text-slate-500 italic Charter leading-relaxed line-clamp-3">
              "{activeHighlight.text}"
            </p>
          </div>
          <p className="text-sm text-slate-800 font-medium leading-relaxed Charter">
            {activeHighlight.comment}
          </p>
          <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
            <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors">Applaud Highlight</button>
            <span className="text-[10px] text-slate-400 font-medium italic">Shared via usethinkup Notes</span>
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
