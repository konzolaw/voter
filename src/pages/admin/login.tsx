import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check hardcoded credentials
    if (username === 'admin' && password === 'admin') {
      // Store session
      sessionStorage.setItem('admin_logged_in', 'true');
      // Redirect to admin dashboard
      router.push('/admin');
    } else {
      setError('Invalid username or password');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen ambient-bg flex flex-col justify-between py-8 px-4 sm:px-6">
      <main className="max-w-md w-full mx-auto my-auto">
        {/* Top Header - Pure Naked Typography */}
        <div className="text-center pt-2 sm:pt-4 mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/')}
            className="tap-effect inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-titanium hover:text-white transition-colors mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Return to Site</span>
          </button>

          <h1 className="font-syne font-black text-3xl sm:text-4xl uppercase tracking-tight text-white leading-none">
            COMMAND PORTAL
          </h1>
          <p className="font-outfit font-bold text-xs sm:text-sm tracking-[0.28em] uppercase text-gold mt-2">
            Directorate Authentication
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-titanium-light mb-2">
                Administrator Identifier
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-13 px-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm"
                placeholder="Enter username"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-titanium-light mb-2">
                Security Key
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-13 px-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm"
                placeholder="Enter password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-rose-300 text-xs">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="tap-effect w-full h-13 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold/20 hover:brightness-105 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Access Console</span>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="w-full max-w-md mx-auto pt-8 pb-2 text-center">
        <div className="text-[10px] text-titanium/50 tracking-[0.25em] uppercase font-medium">
          REIGN CITY SECURITY &bull; RESTRICTED ACCESS
        </div>
      </footer>
    </div>
  );
}
