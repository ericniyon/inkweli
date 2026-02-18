import React, { useState } from 'react';
import { User } from '../types';

interface RegisterViewProps {
  onRegister: (user: User) => void;
  onLogin: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegister, onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name?.trim() || !email?.trim() || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }
      onRegister(data as User);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-slate-50/30">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100">
            <span className="text-white font-black text-3xl">U</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Join usethinkup</h1>
          <p className="text-sm text-slate-400 font-medium leading-relaxed px-4">Start your subscription journey and unlock deep-dive analysis.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-in slide-in-from-top-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
            <input 
              type="email" 
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <label className="flex items-start gap-3 px-2 cursor-pointer group">
             <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer" 
              checked={newsletter}
              onChange={() => setNewsletter(!newsletter)}
             />
             <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition leading-relaxed">
               I agree to the Terms of Service and would like to receive the Weekly Briefing newsletter.
             </span>
          </label>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white text-xs font-black py-5 rounded-3xl tracking-[0.2em] uppercase hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200 mt-4 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="mt-12 text-center pt-8 border-t border-slate-50">
           <p className="text-sm text-slate-400 font-medium">Already have an account? <button onClick={onLogin} className="text-indigo-600 font-black hover:underline ml-1">Sign in instead</button></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
