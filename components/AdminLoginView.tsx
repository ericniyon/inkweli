
import React, { useState } from 'react';
import Logo from './Logo';
import Footer from './Footer';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock admin authentication
    setTimeout(() => {
      if (email === 'admin@usethinkup.com' && password === 'admin') {
        onLoginSuccess();
      } else {
        setError('Invalid administrator credentials. Access restricted to authorized staff.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 animate-fade-in">
      {/* Header */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-slate-900/10 bg-white sticky top-0 z-[100]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onCancel}>
          <Logo size="sm" />
          <span className="text-2xl font-black tracking-tighter">usethinkup</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="text-sm font-medium text-slate-500 hover:text-slate-900">Back to site</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 animate-fade-up">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-100">
              <Logo size="md" variant="light" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Staff Portal</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Authorized Personnel Only</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3 animate-shake">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Editor Email</label>
              <input 
                type="email" 
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                placeholder="editor@usethinkup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Passkey</label>
              <input 
                type="password" 
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Test Credentials Helper */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Test Access</span>
              </div>
              <p className="text-[11px] text-indigo-700 font-medium">
                Email: <span className="font-bold select-all">admin@usethinkup.com</span><br/>
                Password: <span className="font-bold select-all">admin</span>
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white text-[10px] font-black py-5 rounded-2xl tracking-[0.2em] uppercase hover:bg-slate-800 transition shadow-xl disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Enter Dashboard'}
            </button>
            
            <button 
              type="button"
              onClick={onCancel}
              className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition"
            >
              Cancel and Return
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminLoginView;
