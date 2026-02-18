
import React from 'react';

const Stats: React.FC = () => {
  const stats = [
    { label: 'Views', count: '1.2K', sub: 'Last 30 days' },
    { label: 'Reads', count: '840', sub: 'Last 30 days' },
    { label: 'Fans', count: '42', sub: 'Last 30 days' }
  ];

  // Dummy chart data
  const chartData = [20, 45, 30, 60, 40, 70, 55, 90, 65, 80, 45, 50, 60, 30, 20];

  return (
    <div className="max-w-screen-md mx-auto py-12 px-4">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900">Stats</h1>
          <p className="text-zinc-500 text-sm mt-2">Check your performance over time.</p>
        </div>
        <button className="text-sm font-medium text-green-700 hover:underline">Audience stats</button>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="space-y-1">
            <div className="text-3xl font-bold text-zinc-900">{stat.count}</div>
            <div className="text-xs font-bold text-zinc-800 uppercase tracking-tight">{stat.label}</div>
            <div className="text-[10px] text-zinc-400">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="mb-16">
        <div className="flex items-end gap-1 h-32 w-full">
          {chartData.map((val, i) => (
            <div 
              key={i} 
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-t" 
              style={{ height: `${val}%` }}
              title={`${val} views`}
            ></div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-zinc-400 font-medium">
          <span>May 1</span>
          <span>May 15</span>
          <span>May 30</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-2">
          <span>Story</span>
          <div className="flex gap-12">
            <span>Views</span>
            <span>Reads</span>
            <span>Fans</span>
          </div>
        </div>
        
        <div className="py-4 text-center">
          <p className="text-zinc-400 text-sm">No stories published in this period.</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
