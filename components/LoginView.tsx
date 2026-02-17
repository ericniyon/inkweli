
import React, { useState } from 'react';
import { User, UserRole, SubscriptionTier } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    // Simulation: demo accounts
    if (email === 'admin@inkwell.rw' && password === 'admin') {
      onLogin({
        id: 'user_admin',
        name: 'Administrator',
        email: email,
        role: UserRole.ADMIN,
        tier: SubscriptionTier.UNLIMITED,
        articlesViewedThisMonth: []
      });
    } else if (email === 'sub@inkwell.rw' && password === 'sub') {
      onLogin({
        id: 'user_subscriber',
        name: 'John Doe',
        email: email,
        role: UserRole.SUBSCRIBER,
        tier: SubscriptionTier.UNLIMITED,
        articlesViewedThisMonth: []
      });
    } else {
      onLogin({
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0],
        email: email,
        role: UserRole.FREE_USER,
        tier: SubscriptionTier.NONE,
        articlesViewedThisMonth: []
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-slate-50/30">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-100">
            <span className="text-white font-black text-4xl">I</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Welcome back</h1>
          <p className="text-sm text-slate-400 font-medium leading-relaxed px-4">
            Sign in to continue reading independent, deep-dive journalism.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-in slide-in-from-top-4 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
            <input 
              type="email" 
              className="w-full bg-slate-50 border border-transparent rounded-2xl px-6 py-4.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center ml-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
            </div>
            <input 
              type="password" 
              className="w-full bg-slate-50 border border-transparent rounded-2xl px-6 py-4.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-2 cursor-pointer group">
               <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer" 
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
               />
               <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition">Remember me</span>
            </label>
            <button 
              type="button" 
              onClick={onForgotPassword}
              className="text-xs font-black text-indigo-600 uppercase tracking-wider hover:text-indigo-800 transition"
            >
              Forgot?
            </button>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white text-xs font-black py-5 rounded-3xl tracking-[0.2em] uppercase hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-100 mt-4"
          >
            Sign In
          </button>
        </form>

        <div className="mt-12 flex items-center gap-4">
          <div className="flex-grow h-px bg-slate-100" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">Secure Login</span>
          <div className="flex-grow h-px bg-slate-100" />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
           <button className="flex items-center justify-center gap-3 bg-white border border-slate-100 rounded-2xl py-4 hover:bg-slate-50 hover:border-slate-200 transition shadow-sm group">
              <svg className="w-5 h-5 group-hover:scale-110 transition" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span className="text-xs font-bold text-slate-700">Google</span>
           </button>
           <button className="flex items-center justify-center gap-3 bg-white border border-slate-100 rounded-2xl py-4 hover:bg-slate-50 hover:border-slate-200 transition shadow-sm group">
              <svg className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg>
              <span className="text-xs font-bold text-slate-700">Facebook</span>
           </button>
        </div>

        <div className="mt-14 pt-8 border-t border-slate-50 text-center">
           <p className="text-sm text-slate-400 font-medium">New to Inkwell? <button onClick={onRegister} className="text-indigo-600 font-black hover:underline ml-1">Create an account</button></p>
        </div>

        {/* Demo info help */}
        <div className="mt-8 text-center">
          <div className="inline-flex flex-col gap-2 p-4 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Demo Access</p>
            <div className="flex flex-col gap-1.5 text-[10px] text-slate-500 font-bold">
              <span className="bg-white px-3 py-1.5 rounded-xl shadow-sm ring-1 ring-slate-100">Admin: admin@inkwell.rw / admin</span>
              <span className="bg-white px-3 py-1.5 rounded-xl shadow-sm ring-1 ring-slate-100">Subscriber: sub@inkwell.rw / sub</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
