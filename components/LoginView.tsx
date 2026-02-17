
import React, { useState } from 'react';
import { User, UserRole, SubscriptionTier } from '../types';
import Logo from './Logo';

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

    if (email === 'admin@usethinkup.com' && password === 'admin') {
      onLogin({
        id: 'user_admin',
        name: 'Administrator',
        email: email,
        role: UserRole.ADMIN,
        tier: SubscriptionTier.UNLIMITED,
        articlesViewedThisMonth: []
      });
    } else if (email === 'sub@usethinkup.com' && password === 'sub') {
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
          <Logo size="xl" className="mx-auto mb-8 shadow-2xl shadow-indigo-100 p-4 bg-slate-50 rounded-[2.5rem]" />
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

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white text-xs font-black py-5 rounded-3xl tracking-[0.2em] uppercase hover:bg-indigo-600 transition-all shadow-xl mt-4"
          >
            Sign In
          </button>
        </form>

        <div className="mt-14 pt-8 border-t border-slate-50 text-center">
           <p className="text-sm text-slate-400 font-medium">New to usethinkup? <button onClick={onRegister} className="text-indigo-600 font-black hover:underline ml-1">Create an account</button></p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
