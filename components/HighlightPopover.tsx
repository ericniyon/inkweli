
import React from 'react';

interface HighlightPopoverProps {
  rect: DOMRect;
  onAddHighlight: (comment: string) => void;
  onOpenAnnotate: () => void;
  onClose: () => void;
}

const HighlightPopover: React.FC<HighlightPopoverProps> = ({ rect, onOpenAnnotate, onAddHighlight, onClose }) => {
  const top = rect.top + window.scrollY - 70;
  const left = rect.left + rect.width / 2;

  return (
    <div 
      className="fixed z-[120] pointer-events-none"
      style={{ top: `${top}px`, left: `${left}px`, transform: 'translateX(-50%)' }}
    >
      <div className="pointer-events-auto bg-slate-900 text-white rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex items-center p-1.5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <button 
          onClick={onOpenAnnotate}
          className="px-5 py-2.5 hover:bg-slate-800 transition flex items-center gap-2.5 text-xs font-black tracking-widest uppercase"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeWidth="2.5"/></svg>
          Annotate
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button 
          className="px-4 py-2.5 hover:bg-slate-800 transition text-emerald-400 group/h"
          title="Quick Highlight"
          onClick={() => onAddHighlight("Community high-light")}
        >
          <svg className="w-4 h-4 transition-transform group-hover/h:scale-125" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button 
          onClick={onClose}
          className="px-4 py-2.5 hover:bg-slate-800 transition text-slate-500 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
        </button>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
      </div>
    </div>
  );
};

export default HighlightPopover;
