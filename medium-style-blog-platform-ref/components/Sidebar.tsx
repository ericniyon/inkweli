
import React from 'react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const NavItem: React.FC<{ icon: string; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex flex-col items-center py-4 cursor-pointer transition-colors ${active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
  >
    <i className={`fa-solid ${icon} text-xl mb-1`}></i>
    <span className="text-[11px] font-medium">{label}</span>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  const following = [
    { name: 'Jean Bosco', avatar: 'https://picsum.photos/seed/jean/100/100' },
    { name: 'Marie Louise', avatar: 'https://picsum.photos/seed/marie/100/100' }
  ];

  return (
    <aside className="w-20 border-r border-zinc-100 h-screen fixed left-0 top-0 flex flex-col pt-16 bg-white hidden md:flex">
      <div className="flex-1 space-y-2">
        <NavItem icon="fa-house" label="Home" active={activeView === 'home'} onClick={() => onNavigate('home')} />
        <NavItem icon="fa-bookmark" label="Library" active={activeView === 'library'} onClick={() => onNavigate('library')} />
        <NavItem icon="fa-rectangle-list" label="Stories" active={activeView === 'stories'} onClick={() => onNavigate('stories')} />
        <NavItem icon="fa-chart-line" label="Stats" active={activeView === 'stats'} onClick={() => onNavigate('stats')} />
        <NavItem icon="fa-user" label="Profile" active={activeView === 'profile'} onClick={() => onNavigate('profile')} />
      </div>

      <div className="pb-8 px-2">
        <div className="text-[10px] font-bold text-zinc-400 mb-4 text-center uppercase tracking-wider">Following</div>
        <div className="flex flex-col items-center space-y-4">
          {following.map((user, i) => (
            <img 
              key={i} 
              src={user.avatar} 
              alt={user.name} 
              className="w-8 h-8 rounded-full border border-zinc-200 cursor-pointer hover:ring-2 hover:ring-zinc-100 transition-all"
            />
          ))}
          <button className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors">
            <i className="fa-solid fa-plus text-xs"></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
