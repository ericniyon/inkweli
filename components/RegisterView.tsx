'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AlertCircle, ArrowLeft, Loader2, Lock, Mail, User } from 'lucide-react';
import { User as AppUser } from '../types';
import Logo from './Logo';
import OAuthSignInButtons from './OAuthSignInButtons';

const PENDING_REGISTRATION_KEY = 'thinkup_pending_registration';

export interface PendingRegistration {
  name: string;
  email: string;
  password: string;
}

export function getPendingRegistration(): PendingRegistration | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingRegistration;
    if (data?.name && data?.email && data?.password) return data;
  } catch {
    // ignore
  }
  return null;
}

export function clearPendingRegistration(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
}

interface RegisterViewProps {
  onRegister: (user: AppUser) => void;
  onLogin: () => void;
  /** Redirect after OAuth signup (Google / Apple). */
  oauthCallbackUrl?: string;
  /** Hide social signup when user must complete email/password (e.g. claim a payment). */
  showOAuth?: boolean;
  /** Called after saving registration data; user must complete payment to finish. */
  onProceedToPayment?: () => void;
  /** After external payment (no email on webhook): user must finish signup here; POST includes this ref. */
  forcedPaymentReference?: string;
}

const RegisterView: React.FC<RegisterViewProps> = ({
  onRegister,
  onLogin,
  oauthCallbackUrl = '/dashboard',
  showOAuth = true,
  onProceedToPayment,
  forcedPaymentReference,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitLabelLoading = forcedPaymentReference
    ? 'Linking payment…'
    : 'Redirecting…';
  const submitLabelIdle = forcedPaymentReference
    ? 'Create account & claim access'
    : onProceedToPayment
      ? 'Proceed to payment'
      : 'Create account';

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
      if (onProceedToPayment && !forcedPaymentReference) {
        sessionStorage.setItem(
          PENDING_REGISTRATION_KEY,
          JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password })
        );
        onProceedToPayment();
        return;
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          ...(forcedPaymentReference
            ? { paymentReference: forcedPaymentReference.trim() }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }
      const sessionStarted = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (sessionStarted?.error) {
        setError('Account created — please sign in with your email and password.');
      }
      onRegister(data as AppUser);
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
            Join ThinkUp
          </p>
          <h1 className="text-medium-display font-black tracking-tight text-white leading-[1.1] max-w-[14ch]">
            Create your account.
          </h1>
          <p className="mt-6 text-medium-body text-slate-300/95 max-w-sm leading-relaxed font-medium">
            {forcedPaymentReference
              ? 'Link this signup to your payment so we can unlock your plan.'
              : 'Members get the full archive, briefing, and tools to go deeper.'}
          </p>
        </div>
        <p className="relative z-[1] mt-8 lg:mt-0 text-medium-small italic text-slate-400 border-t border-white/10 pt-6 lg:pt-8">
          &ldquo;Insights Beyond the Obvious.&rdquo;
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14 xl:px-16 bg-[#FDFCFB]">
        <div className="w-full max-w-[440px] mx-auto lg:mx-0 lg:max-w-none">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-8">
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
              onClick={onLogin}
              className="text-medium-small font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Sign in
            </button>
          </div>

          <header className="mb-8">
            <h2 className="text-medium-h1 font-black text-slate-900 tracking-tight">Join usethinkup</h2>
            {!forcedPaymentReference && (
              <p className="mt-2 text-medium-meta text-slate-600">
                Start your membership journey—one account for reading and upgrades.
              </p>
            )}
          </header>

          {forcedPaymentReference && (
            <div className="mb-8 rounded-2xl border border-amber-200/90 bg-amber-50 px-5 py-4 space-y-2 text-medium-small text-amber-950">
              <p className="font-bold leading-relaxed">
                Finish creating your account so we can link this payment reference and unlock your plan:
              </p>
              <p className="font-mono text-[0.8rem] leading-relaxed break-all bg-white/60 rounded-lg px-3 py-2 border border-amber-100">
                {forcedPaymentReference}
              </p>
              <p className="text-medium-small text-amber-900/85 leading-relaxed">
                Use the email you’ll use for member updates (same as checkout if UrubutoPay collected it).
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-8 flex gap-3 p-4 rounded-2xl bg-red-50 border border-red-100/90 text-red-800 text-medium-small font-semibold animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-90" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          {showOAuth && !forcedPaymentReference ? (
            <OAuthSignInButtons callbackUrl={oauthCallbackUrl} variant="primary" className="mb-8" />
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="register-name"
                className="block text-medium-small font-bold text-slate-700 uppercase tracking-wider"
              >
                Full name
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200/90 bg-white pl-12 pr-4 py-[0.875rem] text-medium-meta text-slate-900 placeholder:text-slate-400 outline-none shadow-sm shadow-stone-200/40 transition-[border-color,box-shadow] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="register-email"
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
                  id="register-email"
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
              <label
                htmlFor="register-password"
                className="block text-medium-small font-bold text-slate-700 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200/90 bg-white pl-12 pr-4 py-[0.875rem] text-medium-meta text-slate-900 placeholder:text-slate-400 outline-none shadow-sm shadow-stone-200/40 transition-[border-color,box-shadow] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group rounded-xl p-2 -mx-2 hover:bg-stone-100/80 transition-colors">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                checked={newsletter}
                onChange={() => setNewsletter(!newsletter)}
              />
              <span className="text-medium-small font-medium text-slate-600 group-hover:text-slate-800 transition leading-snug">
                I agree to the Terms of Service and would like to receive the Weekly Briefing newsletter.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 mt-8 rounded-2xl bg-slate-900 text-white text-medium-meta font-black py-[1.05rem] tracking-wide uppercase hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-55 disabled:pointer-events-none disabled:hover:bg-slate-900"
            >
              {loading ? (
                <>
                  <Loader2 className="w-[18px] h-[18px] animate-spin" aria-hidden />
                  {submitLabelLoading}
                </>
              ) : (
                submitLabelIdle
              )}
            </button>
          </form>

          <p className="mt-12 pt-10 border-t border-stone-200/80 text-center text-medium-meta text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onLogin}
              className="font-black text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline"
            >
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
