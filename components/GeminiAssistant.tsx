
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Article } from '../types';

interface GeminiAssistantProps {
  article: Article;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ article }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const askGemini = async (prompt: string) => {
    setLoading(true);
    setResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fullPrompt = `
        Context: You are an expert analyst for a premium Rwandan publication called Inkwell.
        Article Title: ${article.title}
        Article Content: ${article.content.replace(/<[^>]*>?/gm, '')}
        
        Task: ${prompt}
        
        Keep the tone professional, insightful, and concise.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt,
      });

      setResponse(result.text || "I couldn't generate an answer right now.");
    } catch (error) {
      console.error("Gemini Error:", error);
      setResponse("An error occurred while connecting to the AI assistant.");
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = () => askGemini("Summarize this article in 3 key bullet points.");

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all transform hover:scale-110 z-[60] group"
      >
        <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-[60] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                <span className="text-[10px] font-bold">AI</span>
              </div>
              <span className="font-bold text-sm tracking-tight">Inkwell Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="p-4 flex-grow max-h-[400px] overflow-y-auto bg-slate-50">
            {!response && !loading && (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm mb-4">How can I help you understand this story better?</p>
                <button 
                  onClick={generateSummary}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition"
                >
                  ✨ Summarize Article
                </button>
              </div>
            )}

            {loading && (
              <div className="space-y-3 py-4">
                <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded animate-pulse w-full"></div>
                <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3"></div>
              </div>
            )}

            {response && (
              <div className="prose prose-sm text-slate-700 leading-relaxed">
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  {response.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ask a specific question..." 
                className="w-full bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition outline-none pr-12"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askGemini(query)}
              />
              <button 
                onClick={() => askGemini(query)}
                disabled={!query.trim() || loading}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiAssistant;
