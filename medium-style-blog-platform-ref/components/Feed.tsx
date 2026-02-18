
import React, { useState } from 'react';
import ArticleCard from './ArticleCard';
import { Article } from '../types';

const Feed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [showBanner, setShowBanner] = useState(true);

  const articles: Article[] = [
    {
      id: '1',
      author: { name: 'Jean Bosco', avatar: 'https://picsum.photos/seed/jean/100/100' },
      category: 'Technology',
      publishDate: '2024-05-15',
      title: 'The Future of Digital Media in East Africa',
      summary: 'Exploring the rapid transformation of the digital landscape in Rwanda and its neighbors. How infrastructure developments are changing content consumption patterns across the region.',
      thumbnail: 'https://picsum.photos/seed/tech/400/300',
      isMemberOnly: true,
      views: 1250
    },
    {
      id: '2',
      author: { name: 'Marie Louise', avatar: 'https://picsum.photos/seed/marie/100/100' },
      category: 'Economy',
      publishDate: '2024-05-10',
      title: 'Navigating Rwandan Economic Policies for Startups',
      summary: 'A comprehensive guide to leveraging government incentives for your new venture. Understanding tax exemptions, registration benefits, and local growth support systems.',
      thumbnail: 'https://picsum.photos/seed/economy/400/300',
      isMemberOnly: true,
      views: 840
    }
  ];

  return (
    <div className="max-w-screen-md mx-auto py-8 px-4">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-zinc-100 mb-6 relative">
        <button 
          onClick={() => setActiveTab('forYou')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'forYou' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}
        >
          For you
          {activeTab === 'forYou' && <div className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-zinc-900"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('following')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'following' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}
        >
          Following
          {activeTab === 'following' && <div className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-zinc-900"></div>}
        </button>
        <button className="ml-auto text-zinc-400 hover:text-zinc-900 pb-3">
          <i className="fa-solid fa-plus text-xs"></i>
        </button>
      </div>

      {/* Membership Banner */}
      {showBanner && (
        <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-6 flex items-start gap-6 relative mb-8">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
            <i className="fa-solid fa-star text-yellow-400 text-xl"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-zinc-900 mb-1">Your first member-only story is free</h3>
            <p className="text-zinc-500 text-sm mb-3">
              Continue reading the story below or unlock any story with the star icon.
            </p>
            <button className="text-zinc-900 font-bold text-sm underline hover:text-zinc-600 transition-colors">
              Upgrade to access all of usethinkup
            </button>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-zinc-300 hover:text-zinc-900 transition-colors absolute top-4 right-4"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Article List */}
      <div className="space-y-2">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
};

export default Feed;
