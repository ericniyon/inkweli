
import React, { useState } from 'react';
import { Response, User } from '../types';
import { PLACEHOLDER_IMAGE } from '../constants';

interface ResponsesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  responses: Response[];
  onPostResponse: (text: string) => void;
  currentUser: User;
}

const ResponsesDrawer: React.FC<ResponsesDrawerProps> = ({ isOpen, onClose, responses, onPostResponse, currentUser }) => {
  const [newText, setNewText] = useState('');

  const handlePost = () => {
    if (!newText.trim()) return;
    onPostResponse(newText);
    setNewText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <header className="px-6 py-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-charter text-medium-h2 font-black text-slate-900">Responses ({responses.length})</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg>
          </button>
        </header>

        <div className="p-6 border-b border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 shadow-inner">
            <div className="flex items-center gap-3 mb-3">
              <img src={currentUser.avatar || PLACEHOLDER_IMAGE} className="w-6 h-6 rounded-full" alt="" />
              <span className="font-charter text-medium-small font-bold text-slate-900">{currentUser.name}</span>
            </div>
            <textarea 
              placeholder="What are your thoughts?"
              className="font-charter w-full bg-transparent border-none text-medium-meta focus:ring-0 outline-none resize-none min-h-[100px] font-medium"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setNewText('')} className="font-charter text-medium-small font-bold text-slate-500 hover:text-slate-900">Cancel</button>
              <button 
                onClick={handlePost}
                disabled={!newText.trim()}
                className="font-charter bg-emerald-600 text-white px-4 py-1.5 rounded-full text-medium-small font-bold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                Respond
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-6 py-8 space-y-8 no-scrollbar">
          {responses.map(resp => (
            <div key={resp.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={resp.userAvatar || PLACEHOLDER_IMAGE} className="w-8 h-8 rounded-full" alt="" />
                  <div>
                    <p className="font-charter text-medium-small font-bold text-slate-900">{resp.userName}</p>
                    <p className="font-charter text-medium-small text-slate-400 font-medium">{resp.createdAt}</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" strokeWidth="2"/></svg></button>
              </div>
              <p className="font-charter text-medium-meta text-slate-700 leading-relaxed font-medium">{resp.text}</p>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 10h4.757c1.246 0 2.257 1.01 2.257 2.257 0 .307-.061.611-.182.894l-2.9 6.767c-.271.633-.893 1.039-1.58 1.039H8.435c-.943 0-1.706-.763-1.706-1.706V10.706c0-.452.18-.886.5-1.206l5.206-5.206a1.706 1.706 0 012.413 2.413L14 10zM6.729 10H4.413C3.47 10 2.706 10.763 2.706 11.706v7.588c0 .943.763 1.706 1.706 1.706h2.318" strokeWidth="2"/></svg>
                   <span className="font-charter text-medium-small font-bold">{resp.claps || 0}</span>
                </button>
                <button className="font-charter text-medium-small font-bold text-slate-400 hover:text-slate-900">Reply</button>
              </div>
            </div>
          ))}
          {responses.length === 0 && (
            <div className="font-charter text-center py-20 text-slate-400 italic text-medium-meta">Be the first to respond!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponsesDrawer;
