
import React, { useState } from 'react';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState('saved');

  const savedItems = [
    {
      title: "The Future of Digital Media in East Africa",
      author: "Jean Bosco",
      date: "May 15",
      readingTime: "5 min read",
      thumbnail: "https://picsum.photos/seed/tech/400/300"
    },
    {
      title: "Navigating Rwandan Economic Policies for Startups",
      author: "Marie Louise",
      date: "May 10",
      readingTime: "8 min read",
      thumbnail: "https://picsum.photos/seed/economy/400/300"
    }
  ];

  return (
    <div className="max-w-screen-md mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-zinc-900">Your Library</h1>
        <button className="bg-zinc-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors">
          New list
        </button>
      </div>

      <div className="flex items-center gap-6 border-b border-zinc-100 mb-8">
        {['Your lists', 'Saved', 'Highlights', 'Reading history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.toLowerCase() ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'
            }`}
          >
            {tab}
            {activeTab === tab.toLowerCase() && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-zinc-900"></div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {savedItems.map((item, i) => (
          <div key={i} className="flex justify-between gap-6 group cursor-pointer">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-zinc-800">{item.author}</span>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-400">{item.date}</span>
              </div>
              <h2 className="text-xl font-bold leading-tight group-hover:underline">{item.title}</h2>
              <div className="flex items-center gap-4 pt-2 text-zinc-400 text-xs">
                <span>{item.readingTime}</span>
                <button className="hover:text-zinc-900"><i className="fa-regular fa-circle-minus"></i></button>
                <button className="hover:text-zinc-900"><i className="fa-solid fa-ellipsis"></i></button>
              </div>
            </div>
            <div className="w-24 h-24 shrink-0 rounded overflow-hidden">
              <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
