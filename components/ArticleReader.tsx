
import React, { useState, useRef, useEffect } from 'react';
import { Article, Highlight, User } from '../types';
import { MOCK_ARTICLES, WRITERS } from '../constants';
import GeminiAssistant from './GeminiAssistant';

interface ArticleReaderProps {
  article: Article;
  currentUser: User;
  onArticleClick: (article: Article) => void;
}

const ArticleReader: React.FC<ArticleReaderProps> = ({ article, currentUser, onArticleClick }) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [pendingHighlight, setPendingHighlight] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(1.125); // Default is 1.125rem (18px)
  
  const contentRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  // Find the author for this article
  const author = WRITERS.find(w => w.id === article.authorId || w.name === article.authorName);

  // Filter related articles by same category, excluding current one
  const relatedArticles = MOCK_ARTICLES
    .filter(a => a.id !== article.id)
    .sort((a, b) => {
      if (a.category === article.category && b.category !== article.category) return -1;
      if (b.category === article.category && a.category !== article.category) return 1;
      return 0;
    })
    .slice(0, 4);

  useEffect(() => {
    const saved = localStorage.getItem(`highlights_${article.id}`);
    if (saved) setHighlights(JSON.parse(saved));
    
    // Also load preferred font size if available
    const savedFontSize = localStorage.getItem('reader_font_size');
    if (savedFontSize) setFontSize(parseFloat(savedFontSize));
  }, [article.id]);

  useEffect(() => {
    localStorage.setItem(`highlights_${article.id}`, JSON.stringify(highlights));
  }, [highlights, article.id]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Calculate overall document progress
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeFontSize = (delta: number) => {
    const newSize = Math.min(2, Math.max(0.875, fontSize + delta));
    setFontSize(newSize);
    localStorage.setItem('reader_font_size', newSize.toString());
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) {
      return;
    }

    const range = selection.getRangeAt(0);
    const container = contentRef.current;
    
    if (!container.contains(range.commonAncestorContainer)) return;

    const rect = range.getBoundingClientRect();
    
    setPendingHighlight({
      text: selection.toString(),
      top: rect.top + window.scrollY - 60,
      left: rect.left + rect.width / 2,
    });
    setShowCommentBox(true);
  };

  const saveHighlight = () => {
    if (!pendingHighlight || !newComment.trim()) return;

    const highlight: Highlight = {
      id: Math.random().toString(36).substr(2, 9),
      articleId: article.id,
      userId: currentUser.id,
      userName: currentUser.name,
      text: pendingHighlight.text,
      range: {
        startContainerIndex: 0,
        startOffset: 0,
        endContainerIndex: 0,
        endOffset: 0
      },
      comment: newComment,
      createdAt: new Date().toISOString()
    };

    setHighlights(prev => [...prev, highlight]);
    setNewComment('');
    setShowCommentBox(false);
    setPendingHighlight(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const url = window.location.href;
    const title = article.title;
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="relative pb-32 animate-fade-in" ref={articleRef}>
      {/* Global Minimal Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 z-[110]">
        <div className="h-full bg-indigo-600 transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      <article className="max-w-4xl mx-auto px-6 pt-24">
        <header className="mb-20 text-center animate-fade-up">
          <div className="mb-8">
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-[0.3em] uppercase border border-indigo-100 px-4 py-2 rounded-full">
              {article.category}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-10 leading-[1.05] tracking-tight">
            {article.title}
          </h1>
          <div className="flex items-center justify-center gap-6">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                 {author && <img src={author.image} alt={author.name} className="w-full h-full object-cover" />}
               </div>
               <div className="text-left">
                 <p className="font-black text-slate-900 leading-none mb-1">{article.authorName}</p>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Contributor</p>
               </div>
             </div>
             <div className="w-px h-8 bg-slate-200" />
             <div className="text-left">
                <p className="font-black text-slate-900 leading-none mb-1">{article.publishDate}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{article.readingTime} MIN READ</p>
             </div>
          </div>
        </header>

        <img 
          src={article.featuredImage} 
          alt={article.title} 
          className="w-full h-auto aspect-[21/9] object-cover rounded-[3rem] mb-20 shadow-2xl border border-slate-200 animate-fade-up delay-100"
        />

        {/* Dynamic Reading Progress Section with Font Controls */}
        <div className="sticky top-[73px] z-[80] bg-[#FDFCFB]/80 backdrop-blur-md -mx-6 px-6 py-4 mb-12 border-b border-slate-100 animate-fade-in delay-200">
           <div className="max-w-4xl mx-auto flex items-center gap-4 sm:gap-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap hidden sm:inline">Progress</span>
              <div className="flex-grow bg-slate-100 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter w-8 text-right">
                {Math.round(progress)}%
              </span>
              
              {/* Font Size Controls */}
              <div className="flex items-center gap-1 border-l border-slate-200 pl-4 sm:pl-6 ml-2 sm:ml-0">
                <button 
                  onClick={() => changeFontSize(-0.125)}
                  className="p-2 hover:bg-slate-200/50 rounded-xl transition text-slate-500 hover:text-slate-900"
                  title="Decrease Font Size"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                </button>
                <div className="flex items-center justify-center w-8">
                  <span className="text-[10px] font-black text-slate-900">A</span>
                </div>
                <button 
                  onClick={() => changeFontSize(0.125)}
                  className="p-2 hover:bg-slate-200/50 rounded-xl transition text-slate-500 hover:text-slate-900"
                  title="Increase Font Size"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 mb-20 animate-fade-up delay-300">
          <div className="flex-grow">
            <div 
              ref={contentRef}
              onMouseUp={handleMouseUp}
              className="article-content prose prose-slate prose-xl max-w-none text-slate-800 selection:bg-yellow-200 selection:text-slate-900 mb-20"
              style={{ fontSize: `${fontSize}rem` }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Author Biography Section */}
            {author && (
              <div className="border-t border-slate-100 pt-16 pb-8 animate-fade-up">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 shadow-lg border-2 border-white">
                    <img src={author.image} alt={author.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 leading-tight mb-1">{author.name}</h4>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{author.role}</p>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-4">
                         <a href={author.socials.twitter} className="text-slate-400 hover:text-slate-900 transition-colors">
                           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                         </a>
                         <a href={author.socials.linkedin} className="text-slate-400 hover:text-slate-900 transition-colors">
                           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                         </a>
                      </div>
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed italic border-l-4 border-indigo-100 pl-6 py-2">
                      "{author.bio}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sharing Section */}
            <div className="mt-12 pt-12 border-t border-slate-100 animate-fade-up">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div className="text-center sm:text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Share this Story</p>
                     <p className="text-sm font-medium text-slate-500">Spread the insight across your network.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-3.5 rounded-2xl text-xs font-black text-slate-900 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm hover:shadow-lg active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                      Twitter
                    </button>
                    <button 
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-3.5 rounded-2xl text-xs font-black text-slate-900 hover:border-[#1877F2] hover:text-[#1877F2] transition-all shadow-sm hover:shadow-lg active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg>
                      Facebook
                    </button>
                    <button 
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-3.5 rounded-2xl text-xs font-black text-slate-900 hover:border-[#0A66C2] hover:text-[#0A66C2] transition-all shadow-sm hover:shadow-lg active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                      LinkedIn
                    </button>
                  </div>
               </div>
            </div>
          </div>

          <aside className="w-full lg:w-80 flex-shrink-0 animate-fade-in delay-500">
            <div className="sticky top-40 space-y-12">
               <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-slate-200" />
                    Reader Notes ({highlights.length})
                  </h3>
                  <div className="space-y-8">
                    {highlights.length === 0 ? (
                      <p className="text-slate-400 text-sm italic leading-relaxed">Select text to leave your mark and start a discussion.</p>
                    ) : (
                      highlights.map((h, i) => (
                        <div key={h.id} className="group animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                          <p className="text-[11px] font-black text-slate-400 uppercase mb-3 flex justify-between">
                            <span>{h.userName}</span>
                            <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                          </p>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md transition cursor-pointer">
                            <p className="text-[10px] text-slate-400 italic mb-2 line-clamp-1 bg-slate-50 p-1 px-2 rounded">"{h.text}"</p>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed">{h.comment}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
               </div>
               
               <div className="p-8 bg-slate-900 rounded-[2rem] text-white animate-fade-up">
                 <h4 className="text-lg font-black mb-4 leading-tight">Support Independent Journalism</h4>
                 <p className="text-xs text-white/50 mb-6 leading-relaxed">If you found this story valuable, consider upgrading to a full subscription.</p>
                 <button className="w-full bg-indigo-600 text-white text-xs font-black py-4 rounded-2xl hover:bg-indigo-700 transition">View Plans</button>
               </div>
            </div>
          </aside>
        </div>
      </article>

      {/* Related Articles Section */}
      <section className="bg-white border-y border-slate-100 mt-32 py-24 animate-fade-in">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 animate-fade-up">
            <div className="max-w-xl">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 block">Editorial Recommendation</span>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">More from the {article.category} Section</h3>
              <p className="text-slate-500 font-medium mt-4">Continue your exploration of {article.category.toLowerCase()} with these selected deep dives.</p>
            </div>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition"
            >
              Back to top &uarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {relatedArticles.map((rel, i) => (
              <div 
                key={rel.id} 
                className="group cursor-pointer flex flex-col h-full animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
                onClick={() => onArticleClick(rel)}
              >
                <div className="aspect-[4/3] rounded-[2rem] overflow-hidden mb-8 bg-slate-50 border border-slate-100 shadow-sm relative">
                  <img 
                    src={rel.featuredImage} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" 
                  />
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{rel.category}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{rel.readingTime} MIN</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-6 italic">— {rel.authorName}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlight Popover */}
      {showCommentBox && pendingHighlight && (
        <div 
          className="absolute z-[60] bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 w-80 animate-fade-up"
          style={{ 
            top: pendingHighlight.top, 
            left: `calc(${pendingHighlight.left}px - 10rem)` 
          }}
        >
          <div className="flex justify-between items-center mb-4">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Thought</span>
             <button onClick={() => setShowCommentBox(false)} className="text-slate-300 hover:text-slate-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <p className="text-[11px] italic text-slate-500 mb-4 line-clamp-2 pl-3 border-l-2 border-indigo-500">
            "{pendingHighlight.text}"
          </p>
          <textarea
            autoFocus
            className="w-full text-sm bg-slate-50 border-none rounded-xl p-4 h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4"
            placeholder="Join the conversation..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button 
            onClick={saveHighlight}
            className="w-full bg-slate-900 text-white text-xs font-black py-4 rounded-xl hover:bg-indigo-600 transition shadow-lg"
          >
            Share Thought
          </button>
        </div>
      )}

      {/* Gemini Integration */}
      <GeminiAssistant article={article} />
    </div>
  );
};

export default ArticleReader;
