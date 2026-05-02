'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import Logo from './Logo';

interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDevResetLink(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please provide your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setEmail(trimmed);
      if (data.devResetLink) setDevResetLink(data.devResetLink as string);
      setIsSent(true);
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
            Account security
          </p>
          <h1 className="text-medium-display font-black tracking-tight text-white leading-[1.1] max-w-[18ch]">
            Reset your password.
          </h1>
          <p className="mt-6 text-medium-body text-slate-300/95 max-w-sm leading-relaxed font-medium">
            We&apos;ll email you a one-time link. It expires after use—choose a strong new password
            afterward.
          </p>
        </div>
        <p className="relative z-[1] mt-8 lg:mt-0 text-medium-small italic text-slate-400 border-t border-white/10 pt-6 lg:pt-8">
          &ldquo;Insights Beyond the Obvious.&rdquo;
        </p>
      </aside>

      {/* Content panel */}
      <div className="flex-1 flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14 xl:px-16 bg-[#FDFCFB]">
        <div className="w-full max-w-[400px] mx-auto lg:mx-0 lg:max-w-none">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-medium-small font-semibold text-slate-500 hover:text-indigo-600 transition-colors group"
            >
              <ArrowLeft
                size={18}
                strokeWidth={2}
                className="transition-transform group-hover:-translate-x-0.5"
                aria-hidden
              />
              Home
            </Link>
            <span className="text-slate-300" aria-hidden>
              /
            </span>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-medium-small font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Sign in
            </button>
          </div>

          {isSent ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <header className="mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mb-6">
                  <CheckCircle2 className="w-6 h-6" aria-hidden />
                </div>
                <h2 className="text-medium-h1 font-black text-slate-900 tracking-tight">
                  Check your inbox
                </h2>
                <p className="mt-2 text-medium-meta text-slate-600 leading-relaxed">
                  If an account exists for <strong className="text-slate-800">{email}</strong>, you
                  will receive a password reset link shortly.
                </p>
              </header>

              <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/80 p-5 space-y-3 text-medium-small text-emerald-900">
                {devResetLink ? (
                  <p className="break-all leading-relaxed">
                    <span className="font-bold block mb-1">Development</span>
                    Email not sent (SMTP not configured).{' '}
                    <a href={devResetLink} className="font-bold text-indigo-700 underline underline-offset-2 hover:text-indigo-900">
                      Open reset link
                    </a>
                  </p>
                ) : (
                  <p className="leading-relaxed text-emerald-900/90">
                    Check your spam folder. If nothing arrives, confirm SMTP settings in{' '}
                    <code className="text-[0.8em] bg-white/60 px-1.5 py-0.5 rounded font-mono">
                      .env
                    </code>{' '}
                    (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM, APP_URL).
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full mt-10 rounded-2xl bg-slate-900 text-white text-medium-meta font-black py-[1.05rem] tracking-wide uppercase hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors shadow-lg shadow-slate-900/20"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <header className="mb-10">
                <h2 className="text-medium-h1 font-black text-slate-900 tracking-tight">
                  Forgot password?
                </h2>
                <p className="mt-2 text-medium-meta text-slate-600">
                  Enter your account email and we&apos;ll send you a reset link.
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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="forgot-email"
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
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      Sending…
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>

                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full mt-4 text-medium-meta font-bold text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline py-2"
                >
                  I remember my password — sign in
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordView;
