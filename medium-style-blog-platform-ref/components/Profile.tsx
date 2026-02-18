
import React from 'react';

const Profile: React.FC = () => {
  return (
    <div className="max-w-screen-lg mx-auto py-12 px-4 flex flex-col md:flex-row gap-16">
      {/* Left Column: Content */}
      <div className="flex-1">
        <h1 className="text-4xl font-bold text-zinc-900 mb-8">User Name</h1>
        <div className="flex items-center gap-8 border-b border-zinc-100 mb-8">
          <button className="pb-3 text-sm font-medium border-b border-zinc-900 text-zinc-900">Home</button>
          <button className="pb-3 text-sm font-medium text-zinc-400 hover:text-zinc-900">About</button>
        </div>
        
        <div className="py-20 text-center border border-dashed border-zinc-200 rounded-lg">
          <p className="text-zinc-400 text-sm">You haven't published any stories yet.</p>
          <button className="mt-4 text-green-700 font-medium text-sm hover:underline">Write your first story</button>
        </div>
      </div>

      {/* Right Column: User Info */}
      <div className="w-full md:w-72 space-y-6">
        <img 
          src="https://picsum.photos/seed/user-me/200/200" 
          alt="Profile" 
          className="w-24 h-24 rounded-full border border-zinc-100 mb-4"
        />
        <div>
          <h2 className="font-bold text-zinc-900">User Name</h2>
          <p className="text-zinc-500 text-sm mt-1 leading-relaxed">Digital enthusiast and writer sharing insights on technology and lifestyle in Rwanda.</p>
        </div>
        <button className="text-green-700 text-sm font-medium hover:text-green-800 transition-colors">Edit profile</button>
        
        <div className="pt-6 border-t border-zinc-100">
          <div className="text-sm font-bold text-zinc-900">0 Followers</div>
          <button className="mt-4 text-xs text-zinc-400 hover:text-zinc-900">Help · Status · About · Careers</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
