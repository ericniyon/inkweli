
import React from 'react';

const RightPanel: React.FC = () => {
  const staffPicks = [
    { 
      author: 'Jean Bosco', 
      title: 'The Future of Digital Media in East Africa',
      avatar: 'https://picsum.photos/seed/jean/50/50'
    },
    { 
      author: 'Marie Louise', 
      title: 'Navigating Rwandan Economic Policies for Startups',
      avatar: 'https://picsum.photos/seed/marie/50/50'
    }
  ];

  const topics = [
    'Data Science', 'Self Improvement', 'Writing', 
    'Technology', 'Relationships', 'Politics', 'Cryptocurrency'
  ];

  const suggestions = [
    { 
      name: 'Jean Bosco', 
      bio: 'Specializing in technological evolution and policy across...',
      avatar: 'https://picsum.photos/seed/jean/100/100'
    },
    { 
      name: 'Marie Louise', 
      bio: 'An expert in macro-economic frameworks and regional tra...',
      avatar: 'https://picsum.photos/seed/marie/100/100'
    }
  ];

  return (
    <aside className="hidden lg:block w-80 min-h-screen border-l border-zinc-100 p-8 space-y-10">
      {/* Staff Picks */}
      <section className="space-y-4">
        <h3 className="font-bold text-sm text-zinc-900">Staff Picks</h3>
        <div className="space-y-4">
          {staffPicks.map((pick, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <img src={pick.avatar} alt="" className="w-5 h-5 rounded-full" />
                <span className="text-xs font-bold text-zinc-800">{pick.author}</span>
              </div>
              <h4 className="font-bold text-sm leading-snug group-hover:underline">{pick.title}</h4>
            </div>
          ))}
        </div>
        <button className="text-xs text-green-700 hover:text-green-800 transition-colors">See the full list</button>
      </section>

      {/* Recommended Topics */}
      <section className="space-y-4">
        <h3 className="font-bold text-sm text-zinc-900">Recommended topics</h3>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, i) => (
            <button 
              key={i} 
              className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-full text-xs font-medium text-zinc-800 transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
        <button className="text-xs text-green-700 hover:text-green-800 transition-colors">See more topics</button>
      </section>

      {/* Who to follow */}
      <section className="space-y-4">
        <h3 className="font-bold text-sm text-zinc-900">Who to follow</h3>
        <div className="space-y-6">
          {suggestions.map((user, i) => (
            <div key={i} className="flex gap-3">
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-sm font-bold truncate text-zinc-900">{user.name}</span>
                  <button className="px-4 py-1 border border-zinc-200 hover:border-zinc-900 rounded-full text-xs font-medium transition-colors">
                    Follow
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {user.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button className="text-xs text-green-700 hover:text-green-800 transition-colors">See suggestions</button>
      </section>
    </aside>
  );
};

export default RightPanel;
