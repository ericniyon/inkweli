
import React, { useState } from 'react';

const Stories: React.FC = () => {
  const [tab, setTab] = useState('drafts');

  return (
    <div className="max-w-screen-md mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-zinc-900">Your stories</h1>
        <div className="flex gap-2">
          <button className="bg-zinc-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors">
            Write a story
          </button>
          <button className="px-4 py-2 border border-zinc-300 rounded-full text-sm font-medium hover:border-zinc-900 transition-colors">
            Import a story
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-zinc-100 mb-8">
        {['Drafts', 'Published', 'Responses'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t.toLowerCase())}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              tab === t.toLowerCase() ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'
            }`}
          >
            {t}
            {tab === t.toLowerCase() && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-zinc-900"></div>
            )}
          </button>
        ))}
      </div>

      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-zinc-400 italic">No {tab} yet.</div>
        <p className="text-zinc-500 text-sm max-w-xs">
          {tab === 'drafts' 
            ? "You haven't started any new stories. Start writing today!" 
            : `You haven't ${tab} any stories yet.`}
        </p>
      </div>
    </div>
  );
};

export default Stories;
