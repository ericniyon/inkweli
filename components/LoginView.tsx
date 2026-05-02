'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AlertCircle, ArrowLeft, Loader2, Lock, Mail } from 'lucide-react';
import { User } from '../types';
import Logo from './Logo';
import OAuthSignInButtons from './OAuthSignInButtons';

interface LoginViewProps {
  /** Error message from URL to show on load */
  initialError?: string | null;
  /** Redirect after OAuth (Google / Apple); should match password success path. */
  oauthCallbackUrl?: string;
  onLogin: (user: User) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({
  initialError,
  oauthCallbackUrl = '/dashboard',
  onLogin,
  onRegister,
  onForgotPassword,
}) => {
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
      const jwt = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (jwt?.error) {
        setError('Sign-in succeeded but session could not start. Refresh and try again.');
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
    <div className="w-full max-w-[1200px] mx-auto lg:rounded-[2rem] lg:shadow-[0_25px_80px_-12px_rgba(15,23,42,0.12)] lg:border lg:border-slate-200/90 overflow-hidden bg-white flex flex-col lg:flex-row min-h-[calc(100vh-11rem)] font-charter">
      {/* Brand panel */}
      <aside className="relative lg:w-[46%] min-h-[200px] lg:min-h-0 flex flex-col justify-between px-8 py-10 lg:px-12 lg:py-14 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white shrink-0">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35) 0%, transparent 45%),
              radial-gradient(circle at 80% 60%, rgba(14,165,233,0.12) 0%, transparent 40%),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.06)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-[1]">
          <Logo size="lg" variant="light" className="mb-10 drop-shadow-md" />
          <p className="text-medium-small uppercase tracking-[0.2em] text-indigo-200/90 font-semibold mb-3">
            Member area
          </p>
          <h1 className="text-medium-display font-black tracking-tight text-white leading-[1.1] max-w-[16ch]">
            Welcome back.
          </h1>
          <p className="mt-6 text-medium-body text-slate-300/95 max-w-sm leading-relaxed font-medium">
            Sign in for full articles, your library, and membership benefits.
          </p>
        </div>
        <p className="relative z-[1] mt-8 lg:mt-0 text-medium-small italic text-slate-400 border-t border-white/10 pt-6 lg:pt-8">
          &ldquo;Insights Beyond the Obvious.&rdquo;
        </p>
      </aside>

      {/* Form panel */}
        <div className="flex-1 flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14 xl:px-16 bg-[#FDFCFB]">
        <div className="w-full max-w-[400px] mx-auto lg:mx-0 lg:max-w-none">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-medium-small font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-10 group"
          >
            <ArrowLeft
              size={18}
              strokeWidth={2}
              className="transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            Back to home
          </Link>

          <header className="mb-10">
            <h2 className="text-medium-h1 font-black text-slate-900 tracking-tight">Sign in</h2>
            <p className="mt-2 text-medium-meta text-slate-600">
              Sign in with Google or Apple, or use your ThinkUp email and password.
            </p>
          </header>

          {error && (
            <div
              role="alert"
              className="mb-8 flex gap-3 p-4 rounded-2xl bg-red-50 border border-red-100/90 text-red-800 text-medium-small font-semibold animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-90" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <OAuthSignInButtons callbackUrl={oauthCallbackUrl} variant="primary" className="mb-8" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-medium-small font-bold text-slate-700 uppercase tracking-wider"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200/90 bg-white pl-12 pr-4 py-[0.875rem] text-medium-meta text-slate-900 placeholder:text-slate-400 outline-none shadow-sm shadow-stone-200/40 transition-[border-color,box-shadow] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="login-password"
                  className="block text-medium-small font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-medium-small font-bold text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline transition-colors whitespace-nowrap"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200/90 bg-white pl-12 pr-4 py-[0.875rem] text-medium-meta text-slate-900 placeholder:text-slate-400 outline-none shadow-sm shadow-stone-200/40 transition-[border-color,box-shadow] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 mt-8 rounded-2xl bg-slate-900 text-white text-medium-meta font-black py-[1.05rem] tracking-wide uppercase hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-55 disabled:pointer-events-none disabled:hover:bg-slate-900"
            >
              {loading ? (
                <>
                  <Loader2 className="w-[18px] h-[18px] animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-12 pt-10 border-t border-stone-200/80 text-center text-medium-meta text-slate-600">
            New to usethinkup?{' '}
            <button
              type="button"
              onClick={onRegister}
              className="font-black text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
