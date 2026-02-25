import React, { useState } from 'react';

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
      if (data.devResetLink) setDevResetLink(data.devResetLink);
      setIsSent(true);
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
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Recover Access</h1>
          <p className="text-sm text-slate-400 font-medium leading-relaxed px-4">Enter your email to receive a secure password reset link.</p>
        </div>

        {isSent ? (
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-3">
                <p className="text-sm font-bold text-emerald-800 leading-relaxed">
                  If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                </p>
                {devResetLink ? (
                  <p className="text-xs text-emerald-800 break-all">
                    <span className="font-semibold">Development:</span> Email not sent (SMTP not configured). Use this link to reset: <a href={devResetLink} className="underline">Reset password</a>
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700">
                    Check your spam folder. If you don&apos;t receive it, ensure SMTP is configured in .env (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM, APP_URL).
                  </p>
                )}
             </div>
             <button 
               type="button"
               onClick={onBackToLogin}
               className="w-full bg-slate-900 text-white text-xs font-black py-5 rounded-3xl tracking-[0.2em] uppercase hover:bg-indigo-600 transition shadow-xl"
             >
               Back to Login
             </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-xs font-bold text-red-500 px-4">{error}</p>}
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

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white text-xs font-black py-5 rounded-3xl tracking-[0.2em] uppercase hover:bg-indigo-600 transition shadow-xl shadow-slate-100 mt-4 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            
            <button 
              type="button"
              onClick={onBackToLogin}
              className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition mt-4"
            >
              Wait, I remember it
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordView;
