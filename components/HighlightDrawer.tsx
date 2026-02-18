
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { PLACEHOLDER_IMAGE } from '../constants';

interface HighlightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onSave: (comment: string) => void;
  currentUser: User;
  isSaving?: boolean;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

const HighlightDrawer: React.FC<HighlightDrawerProps> = ({ isOpen, onClose, selectedText, onSave, currentUser, isSaving = false, isGuest = false, onLoginClick }) => {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      setComment('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!comment.trim()) return;
    onSave(comment);
    setComment('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Semi-transparent Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Sidebar Content */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-[0_0_80px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-slate-100">
        <header className="px-10 py-8 flex justify-between items-center border-b border-slate-50 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Annotate Selection</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Contextual Insight</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
          </button>
        </header>

        <div className="flex-grow overflow-y-auto px-10 py-10 no-scrollbar space-y-12">
          {isGuest && onLoginClick && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <p className="text-sm font-bold text-amber-900 mb-3">Sign in to save your note</p>
              <p className="text-xs text-amber-800/80 mb-4">Your annotation will be saved and visible to other readers once you sign in.</p>
              <button
                type="button"
                onClick={onLoginClick}
                className="px-5 py-2.5 rounded-full bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors"
              >
                Sign in to save
              </button>
            </div>
          )}

          {/* Quote Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Selected Text</span>
             </div>
             <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100 italic Charter text-lg text-slate-600 leading-relaxed shadow-inner">
               "{selectedText}"
             </div>
          </div>

          {/* Comment Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <img src={currentUser.avatar || PLACEHOLDER_IMAGE} className="w-8 h-8 rounded-full ring-2 ring-slate-100 ring-offset-2" alt={currentUser.name} />
                 <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">usethinkup Contributor</span>
            </div>

            <textarea 
              autoFocus
              placeholder="What unique perspective do you have on this passage?"
              className="w-full bg-white border border-slate-100 rounded-[2rem] p-8 text-lg text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm min-h-[250px] Charter leading-relaxed resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Guidelines */}
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
             <div className="flex items-center gap-2 mb-2">
               <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg>
               <span className="text-[10px] font-bold text-indigo-900 uppercase">Pro Tip</span>
             </div>
             <p className="text-xs text-indigo-700/70 font-medium leading-relaxed italic">
               Great annotations spark conversation. Aim for insights that help other readers see this text in a new light.
             </p>
          </div>
        </div>

        <footer className="px-10 py-8 border-t border-slate-50 bg-white flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visibility</span>
              <span className="text-xs font-bold text-slate-900">Public Community Note</span>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-3 rounded-full text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={isGuest && onLoginClick ? onLoginClick : handleSave}
                disabled={isGuest ? false : !comment.trim() || isSaving}
                className="bg-slate-900 text-white px-10 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all disabled:opacity-30 shadow-xl shadow-slate-100"
              >
                {isGuest ? 'Sign in to save' : isSaving ? 'Saving…' : 'Save Note'}
              </button>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default HighlightDrawer;
