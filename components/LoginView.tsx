import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Logo from './Logo';

interface LoginViewProps {
  /** Error message from URL to show on load */
  initialError?: string | null;
  onLogin: (user: User) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ initialError, onLogin, onRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialError != null) setError(initialError);
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email?.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Sign in failed. Please try again.');
        return;
      }
      onLogin(data as User);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Password
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white text-xs font-black py-5 rounded-3xl tracking-[0.2em] uppercase hover:bg-indigo-600 transition-all shadow-xl mt-4 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? 'Signing in…' : 'Sign In'}
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
