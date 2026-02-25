"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Missing reset link. Please use the link from your email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="w-full max-w-md bg-white rounded-[3.5rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 animate-in fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Password reset</h1>
          <p className="text-sm text-slate-500 mb-8">Your password has been updated. You can sign in now.</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full bg-slate-900 text-white text-xs font-black py-5 rounded-3xl tracking-[0.2em] uppercase hover:bg-indigo-600 transition shadow-xl"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full max-w-md bg-white rounded-[3.5rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-4">Invalid reset link</h1>
          <p className="text-sm text-slate-500 mb-8">This link is missing or invalid. Request a new password reset from the login page.</p>
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="w-full bg-slate-900 text-white text-xs font-black py-5 rounded-3xl tracking-[0.2em] uppercase"
          >
            Request new link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-[3.5rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 animate-in fade-in">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Set new password</h1>
        <p className="text-sm text-slate-400">Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="reset-password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="reset-confirm" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Confirm password
          </label>
          <input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white text-xs font-black py-5 rounded-3xl tracking-[0.2em] uppercase hover:bg-indigo-600 transition shadow-xl disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? "Updating…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 py-12 animate-fade-up">
      <Suspense fallback={<div className="w-full max-w-md h-64 bg-slate-100 rounded-[3.5rem] animate-pulse" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
