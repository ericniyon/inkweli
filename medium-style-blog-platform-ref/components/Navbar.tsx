
import React from 'react';

interface NavbarProps {
  onNavigate: (view: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  return (
    <nav className="h-14 border-b border-zinc-100 flex items-center justify-between px-4 fixed top-0 left-0 right-0 bg-white z-50">
      <div className="flex items-center gap-4 flex-1">
        <div 
          onClick={() => onNavigate('home')}
          className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-black text-xl italic shrink-0 cursor-pointer"
        >
          U
        </div>
        <div className="relative max-w-md w-full group">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900"></i>
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-zinc-50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-200 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => onNavigate('stories')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 text-sm font-medium transition-colors"
        >
          <i className="fa-regular fa-pen-to-square"></i>
          <span className="hidden sm:inline">Write</span>
        </button>
        <button className="text-zinc-500 hover:text-zinc-900 relative transition-colors">
          <i className="fa-regular fa-bell text-lg"></i>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <img 
          onClick={() => onNavigate('profile')}
          src="https://picsum.photos/seed/user-me/100/100" 
          alt="Profile" 
          className="w-8 h-8 rounded-full border border-zinc-100 cursor-pointer"
        />
      </div>
    </nav>
  );
};

export default Navbar;
