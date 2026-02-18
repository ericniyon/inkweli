
import React, { useState } from 'react';
import { User, Article, Category } from '../types';
import { PLACEHOLDER_IMAGE } from '../constants';

interface StoryEditorProps {
  currentUser: User;
  onSave: (story: Article) => void;
  onCancel: () => void;
}

const StoryEditor: React.FC<StoryEditorProps> = ({ currentUser, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('General');
  const [excerpt, setExcerpt] = useState('');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&h=600&auto=format&fit=crop');

  const handlePublish = () => {
    if (!title || !content) return;

    // Fix: Adding the missing 'highlights' property to ensure compliance with the Article interface.
    const newStory: Article = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      slug: title.toLowerCase().replace(/ /g, '-'),
      excerpt: excerpt || content.substring(0, 100) + '...',
      content: content.split('\n').map(p => `<p>${p}</p>`).join(''),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      publishDate: new Date().toISOString().split('T')[0],
      status: 'PUBLISHED',
      featuredImage: image,
      readingTime: Math.ceil(content.split(' ').length / 200),
      category,
      claps: 0,
      responses: [],
      highlights: [],
      tags: [category]
    };

    onSave(newStory);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in">
      <header className="flex justify-between items-center mb-16">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
               <img src={currentUser.avatar || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
            </div>
            <span className="text-sm font-medium text-slate-500 italic">Draft in {currentUser.name}</span>
         </div>
         <div className="flex items-center gap-4">
            <button 
              onClick={handlePublish}
              className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-emerald-700 transition"
            >
              Publish
            </button>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-900 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" /></svg></button>
         </div>
      </header>

      <div className="space-y-8">
         <textarea 
           placeholder="Title"
           className="w-full text-5xl font-black outline-none border-none resize-none Charter placeholder:text-slate-100 text-slate-900 leading-tight"
           rows={1}
           value={title}
           onChange={(e) => setTitle(e.target.value)}
         />

         <div className="flex items-center gap-4 py-4 border-y border-slate-50">
            <select 
              className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs font-bold outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option>Politics</option>
              <option>Economy</option>
              <option>Culture</option>
              <option>Technology</option>
              <option>Science</option>
              <option>Opinion</option>
              <option>General</option>
            </select>
            <input 
              type="text" 
              placeholder="Featured Image URL" 
              className="flex-grow bg-slate-50 border-none rounded-lg px-4 py-2 text-xs font-bold outline-none" 
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
         </div>

         <textarea 
           placeholder="Tell your story..."
           className="w-full text-xl outline-none border-none resize-none Charter placeholder:text-slate-100 text-slate-800 leading-relaxed min-h-[500px]"
           value={content}
           onChange={(e) => setContent(e.target.value)}
         />
      </div>
    </div>
  );
};

export default StoryEditor;
