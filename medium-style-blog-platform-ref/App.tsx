
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import RightPanel from './components/RightPanel';
import Library from './components/Library';
import Profile from './components/Profile';
import Stories from './components/Stories';
import Stats from './components/Stats';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('home');

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return (
          <div className="w-full flex">
            <div className="flex-1 min-w-0">
              <Feed />
            </div>
            <RightPanel />
          </div>
        );
      case 'library':
        return <Library />;
      case 'profile':
        return <Profile />;
      case 'stories':
        return <Stories />;
      case 'stats':
        return <Stats />;
      default:
        return <Feed />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onNavigate={setActiveView} />
      
      <div className="flex pt-14">
        {/* Left Sidebar (fixed) */}
        <Sidebar activeView={activeView} onNavigate={setActiveView} />

        {/* Main Content Scrollable Area */}
        <main className="flex-1 md:ml-20 flex justify-center">
          <div className="w-full">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
