import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { FinalResult } from '@/types';
import ConfettiEffect from '@/components/ConfettiEffect';

// Micro-animation component that smoothly counts up to the certified vote total
function AnimatedVoteCount({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200; // 1.2s smooth count-up

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for energetic deceleration
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(ease * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function Results() {
  const router = useRouter();

  // Instant synchronous cache retrieval
  const cachedResults = apiClient.getCached<any>('results');

  const [loading, setLoading] = useState(() => !cachedResults);
  const [released, setReleased] = useState(() => cachedResults?.released || false);
  const [results, setResults] = useState<FinalResult[]>(() => cachedResults?.results || []);
  const [message, setMessage] = useState(() => cachedResults?.message || '');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await apiClient.getResults();
      setReleased(response.released);
      
      if (response.released) {
        setResults(response.results);
      } else {
        setMessage(response.message);
      }
    } catch (err) {
      if (!results.length) {
        setMessage('Failed to load results');
      }
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen ambient-bg flex items-center justify-center p-4">
        <div className="py-8 flex flex-col items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold mb-4"></div>
          <p className="font-outfit text-xs tracking-widest uppercase text-titanium">Tabulating certified returns...</p>
        </div>
      </div>
    );
  }

  if (!released) {
    return (
      <div className="min-h-screen ambient-bg flex flex-col justify-between py-6 px-4 sm:px-6">
        <main className="max-w-lg w-full mx-auto my-auto text-center">
          {/* Top Header - Pure Naked Typography */}
          <div className="pt-2 sm:pt-4 mb-6 sm:mb-8">
            <h1 className="font-syne font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-none">
              RESULTS PENDING
            </h1>
            <p className="font-outfit font-bold text-xs sm:text-sm tracking-[0.28em] uppercase text-gold mt-2 sm:mt-3">
              Official Tally in Progress
            </p>
          </div>

          <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center gold-glow">
                <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h2 className="font-syne text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              Awaiting Official Release
            </h2>
            <p className="text-xs sm:text-sm text-titanium-light mb-8 leading-relaxed">
              {message || 'The election commissioner is currently auditing the final ballots. Results will be published immediately upon sign-off.'}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => loadResults()}
                className="tap-effect w-full h-14 rounded-2xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-semibold text-base tracking-wide shadow-lg shadow-gold/20 hover:brightness-105 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Refresh Live Status</span>
                <svg className="w-4 h-4 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={() => router.push('/')}
                className="tap-effect w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10 cursor-pointer"
              >
                Return to Overview
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full max-w-lg mx-auto pt-8 pb-2 text-center">
          <div className="text-[10px] sm:text-[11px] text-titanium/50 tracking-[0.25em] uppercase font-medium">
            OFFICIAL SECRET BALLOT &bull; ENCRYPTED PROTOCOL
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen ambient-bg flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-x-hidden">
      {/* Dynamic Victory Confetti Cannon: fires 3 times, every 5 seconds */}
      <ConfettiEffect />

      <main className="max-w-5xl w-full mx-auto pb-16 relative z-10">
        {/* Top Header - Pure Naked Typography */}
        <div className="text-center pt-2 sm:pt-4 mb-8 sm:mb-12">
          <h1 className="font-syne font-black text-3xl sm:text-6xl uppercase tracking-tight text-white leading-none">
            CERTIFIED RESULTS
          </h1>
          <p className="font-outfit font-bold text-xs sm:text-sm tracking-[0.28em] uppercase text-gold mt-2 sm:mt-3">
            Reign City Security Team &bull; 2026 Leadership Outcomes
          </p>
        </div>

        {/* Podium Results Grid with Staggered Cascade Entrance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result, idx) => (
            <div
              key={result.id}
              className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between podium-card-animate hover:border-gold/30 transition-all duration-300 group"
              style={{ animationDelay: `${idx * 140}ms` }}
            >
              {/* Shimmer Light Reflection */}
              <div className="shimmer-effect" />

              {/* Gold Top Light Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/30 via-gold to-gold/30 group-hover:h-1.5 transition-all" />

              <div>
                {/* Position Title */}
                <div className="text-center mb-6">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-titanium block mb-1">
                    Elected Role
                  </span>
                  <h2 className="font-syne text-lg sm:text-xl font-bold text-white tracking-tight">
                    {result.position.display_name}
                  </h2>
                </div>

                {/* Winner Podium Circle */}
                <div className="flex flex-col items-center mb-4">
                  <div className="relative mb-4">
                    <div className="w-28 h-28 relative rounded-full overflow-hidden border-2 border-gold gold-glow bg-black/50 group-hover:scale-105 transition-transform duration-300">
                      {result.winner.image ? (
                        <Image
                          src={result.winner.image}
                          alt={result.winner.full_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/20 to-transparent">
                          <span className="font-syne text-3xl font-black text-gold">
                            {result.winner.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Victor Crown Badge with Ambient Pulse */}
                    <div
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-gradient-to-tr from-gold to-gold-light text-canvas flex items-center justify-center shadow-lg font-bold crown-pulse"
                      title="Certified Majority Winner"
                    >
                      <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="font-syne text-xl sm:text-2xl font-bold text-white tracking-tight text-center">
                    {result.winner.full_name}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mt-1 inline-flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Elected By Majority</span>
                  </span>
                </div>
              </div>

              {/* Vote Tally Metric Card with Animated Counter */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-titanium block">Certified Votes</span>
                  <span className="font-syne text-2xl font-black text-gold">
                    <AnimatedVoteCount value={result.vote_count} />
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-titanium block">Status</span>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Validated</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="mt-12 text-center">
          <button
            onClick={() => router.push('/')}
            className="tap-effect inline-flex items-center gap-2 px-8 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Return to Overview</span>
          </button>
        </div>
      </main>


      {/* Minimalist Footer */}
      <footer className="w-full max-w-5xl mx-auto pt-8 pb-2 text-center relative z-10">
        <div className="text-[10px] sm:text-[11px] text-titanium/50 tracking-[0.25em] uppercase font-medium">
          OFFICIAL SECRET BALLOT &bull; ENCRYPTED PROTOCOL
        </div>
      </footer>
    </div>
  );
}

