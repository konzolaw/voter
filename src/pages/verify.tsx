import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';
import { getDeviceFingerprint } from '@/lib/utils';

export default function Verify() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Prefetch ballot route and candidate/position data
    router.prefetch('/ballot');
    apiClient.prefetchCommon();
  }, [router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const deviceHash = await getDeviceFingerprint();
      const response = await apiClient.verifyVoter(fullName, deviceHash);

      if (response.can_vote) {
        // Store voter info in sessionStorage
        sessionStorage.setItem('voter_name', fullName);
        sessionStorage.setItem('device_hash', deviceHash);
        sessionStorage.setItem('voter_id', response.voter_id);
        
        // Redirect to ballot
        router.push('/ballot');
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ambient-bg flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Main Content Area */}
      <main className="max-w-lg w-full mx-auto my-auto">
        {/* Top Header Section - Pure Naked Typography */}
        <div className="text-center pt-2 sm:pt-4 mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/')}
            className="tap-effect inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-titanium hover:text-white transition-colors mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Return to Overview</span>
          </button>
          
          <h1 className="font-syne font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-none">
            VOTER AUTHENTICATION
          </h1>
          <p className="font-outfit font-bold text-xs sm:text-sm tracking-[0.28em] uppercase text-gold mt-2 sm:mt-3">
            Official 2026 Leadership Ballot
          </p>
        </div>

        {/* Verification Form Card */}
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold tracking-widest uppercase text-titanium-light mb-2">
                Registered Operative Name
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-titanium">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-14 pl-12 pr-10 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-titanium-dark focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/60 text-base sm:text-lg font-medium transition-all"
                  placeholder="Enter your name as registered"
                  autoComplete="off"
                  autoCapitalize="words"
                  spellCheck="false"
                  required
                  disabled={loading}
                />

                {fullName && !loading && (
                  <button
                    type="button"
                    onClick={() => setFullName('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-titanium hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="mt-2 text-[11px] text-titanium/80 leading-relaxed">
                Type your first or registered surname as listed in the squad roster.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
                <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider">Verification Error</p>
                  <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="tap-effect w-full h-14 rounded-2xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-semibold text-base sm:text-lg tracking-wide shadow-lg shadow-gold/20 hover:brightness-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas"></div>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Continue to Ballot</span>
                  <svg className="w-5 h-5 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Device Fingerprint Security Notice */}
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-3 text-titanium/70 text-xs">
            <svg className="w-4 h-4 text-gold/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-[11px] leading-relaxed">
              This terminal is cryptographic-locked to your session upon verification.
            </span>
          </div>
        </div>
      </main>

      {/* Minimalist Footer - Pure Naked Typography */}
      <footer className="w-full max-w-lg mx-auto pt-8 pb-2 text-center">
        <div className="text-[10px] sm:text-[11px] text-titanium/50 tracking-[0.25em] uppercase font-medium">
          OFFICIAL SECRET BALLOT &bull; ENCRYPTED PROTOCOL
        </div>
      </footer>
    </div>
  );
}
