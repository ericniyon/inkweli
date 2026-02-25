
import React from 'react';

interface OurStoryViewProps {
  onGetStarted: () => void;
}

const OurStoryView: React.FC<OurStoryViewProps> = ({ onGetStarted }) => {
  return (
    <div className="animate-fade-in">
      <section className="bg-white border-b border-slate-900/10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-12 tracking-tighter Charter">
            Everyone has a story to tell.
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 leading-relaxed Charter mb-16">
            usethinkup is a home for human expression and fresh ideas. A world where anyone with an insight can share it, and anyone with a curious mind can find it.
          </p>
          <button 
            onClick={onGetStarted}
            className="bg-slate-900 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-slate-800 transition shadow-2xl"
          >
            Start reading
          </button>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#FDFCFB]">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">A living network of minds.</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium Charter">
              Rather than selling ads or your data, we’re supported by our readers. This means we can focus on quality over quantity, and depth over distraction.
            </p>
          </div>
          <div className="bg-slate-100 rounded-3xl aspect-video overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&h=800&auto=format&fit=crop" 
              className="w-full h-full object-cover"
              alt="Community"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default OurStoryView;
