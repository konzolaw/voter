import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { SystemState, Position, Candidate, VotingStats } from '@/types';

export default function Home() {
  const router = useRouter();

  // Instant synchronous cache inspection
  const cachedState = apiClient.getCached<SystemState>('system_state');
  const cachedPositions = apiClient.getCached<Position[]>('positions');
  const cachedCandidates = apiClient.getCached<Candidate[]>('candidates');
  const cachedStats = apiClient.getCached<VotingStats>('stats');

  const [votingOpen, setVotingOpen] = useState(() => (cachedState ? cachedState.voting_open : true));
  const [loading, setLoading] = useState(() => !cachedState);
  const [positionsCount, setPositionsCount] = useState<number>(() =>
    cachedPositions ? cachedPositions.length : 7
  );
  const [candidatesCount, setCandidatesCount] = useState<number>(() =>
    cachedCandidates ? cachedCandidates.length : 13
  );
  const [votersCount, setVotersCount] = useState<number>(() =>
    cachedStats ? cachedStats.total_voters : 22
  );

  useEffect(() => {
    // Prefetch destination routes so page opening is instant
    router.prefetch('/verify');
    router.prefetch('/ballot');
    router.prefetch('/results');

    checkVotingStatus();
  }, [router]);

  const checkVotingStatus = async () => {
    try {
      const [stateRes, posRes, candRes, statsRes] = await Promise.allSettled([
        apiClient.getSystemState(),
        apiClient.getPositions(),
        apiClient.getCandidates(),
        apiClient.getStats(),
      ]);

      if (stateRes.status === 'fulfilled') setVotingOpen(stateRes.value.voting_open);
      if (posRes.status === 'fulfilled') setPositionsCount(posRes.value.length);
      if (candRes.status === 'fulfilled') setCandidatesCount(candRes.value.length);
      if (statsRes.status === 'fulfilled') setVotersCount(statsRes.value.total_voters);
    } catch (error) {
      console.error('Error checking voting status:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleStartVoting = () => {
    router.push('/verify');
  };

  const handleViewResults = () => {
    router.push('/results');
  };

  return (
    <div className="min-h-screen ambient-bg flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Main Content Area */}
      <main className="max-w-xl w-full mx-auto my-auto">
        {/* Prominent Header at the Very Top */}
        <div className="text-center pt-2 sm:pt-4 mb-5 sm:mb-6">
          <h1 className="font-syne font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white leading-none">
            REIGN CITY
          </h1>
          <p className="font-outfit font-bold text-xs sm:text-sm md:text-base tracking-[0.3em] uppercase text-gold mt-2 sm:mt-3">
            Security Team &bull; 2026 Leadership Elections
          </p>
        </div>

        {/* Hero Crest Section */}
        <div className="text-center mb-6">
          <div className="relative mx-auto max-w-[340px] sm:max-w-md w-full mb-6 px-2">
            {/* Ambient luxury aura behind crest */}
            <div className="absolute -inset-2 bg-gradient-to-b from-gold/25 via-gold/5 to-transparent rounded-3xl blur-2xl -z-10" />
            
            {/* Full uncropped image viewport with intrinsic aspect ratio */}
            <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-sm p-1.5 sm:p-2">
              <Image
                src="/hero.png"
                alt="Reign City Security Team Crest"
                width={804}
                height={580}
                priority
                className="w-full h-auto object-contain block rounded-xl sm:rounded-2xl"
                sizes="(max-width: 640px) 90vw, 448px"
              />
            </div>
          </div>

          {/* Live Election Status - Pure Naked Typography */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {loading ? (
              <div className="flex items-center gap-2 text-xs font-medium text-titanium-light">
                <span className="h-1.5 w-1.5 rounded-full bg-titanium animate-pulse"></span>
                <span className="tracking-widest uppercase">Connecting to election ledger...</span>
              </div>
            ) : votingOpen ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="tracking-[0.2em] uppercase">Ballot Active &amp; Open</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-titanium-light">
                <span className="h-2 w-2 rounded-full bg-titanium-dark"></span>
                <span className="tracking-[0.2em] uppercase">Polls Concluded</span>
              </div>
            )}
          </div>

          {/* Subcopy */}
          <p className="text-xs sm:text-sm text-titanium-light max-w-md mx-auto leading-relaxed px-4 font-normal">
            Cast your verified vote across all {positionsCount} leadership positions. 
            Every voice counts toward shaping our squad.
          </p>
        </div>

        {/* Action Card */}
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-lg mx-auto text-center border border-white/10 shadow-2xl">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-gold"></div>
              <p className="mt-4 text-xs tracking-wider uppercase text-titanium">Connecting to election ledger...</p>
            </div>
          ) : votingOpen ? (
            <>
              <h2 className="font-outfit text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                Official Ballot Access
              </h2>
              <p className="text-xs sm:text-sm text-titanium-light mb-6 leading-relaxed">
                Voter verification required. Ensure you complete candidate selections for all open positions before submitting.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleStartVoting}
                  className="tap-effect w-full sm:w-auto min-w-[240px] h-14 px-8 inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-semibold text-base sm:text-lg tracking-wide shadow-lg shadow-gold/20 hover:brightness-105 transition-all duration-200"
                >
                  <span>Proceed to Verification</span>
                  <svg className="w-5 h-5 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-outfit text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                Voting Period Ended
              </h2>
              <p className="text-xs sm:text-sm text-titanium-light mb-6 leading-relaxed">
                The ballot box is sealed. You can inspect the tabulated tallies and verified election outcomes below.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleViewResults}
                  className="tap-effect w-full sm:w-auto min-w-[240px] h-14 px-8 inline-flex items-center justify-center gap-3 rounded-2xl glass-pill hover:bg-white/10 text-white font-semibold text-base sm:text-lg tracking-wide border border-white/15 transition-all duration-200"
                >
                  <span>View Certified Results</span>
                  <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Stats - Pure Typography (No container box) */}
        <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10 text-center">
          <div>
            <div className="font-syne text-2xl sm:text-3xl font-bold text-white">{positionsCount}</div>
            <div className="text-[10px] sm:text-xs font-medium tracking-widest text-titanium uppercase mt-0.5">Positions</div>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div>
            <div className="font-syne text-2xl sm:text-3xl font-bold text-gold">{candidatesCount}</div>
            <div className="text-[10px] sm:text-xs font-medium tracking-widest text-titanium uppercase mt-0.5">Candidates</div>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div>
            <div className="font-syne text-2xl sm:text-3xl font-bold text-white">{votersCount}</div>
            <div className="text-[10px] sm:text-xs font-medium tracking-widest text-titanium uppercase mt-0.5">Voters</div>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div>
            <div className="font-syne text-2xl sm:text-3xl font-bold text-titanium-light">1</div>
            <div className="text-[10px] sm:text-xs font-medium tracking-widest text-titanium uppercase mt-0.5">Per Role</div>
          </div>
        </div>
      </main>

      {/* Minimalist Footer - Pure text */}
      <footer className="w-full max-w-xl mx-auto pt-8 pb-2 text-center">
        <div className="text-[10px] sm:text-[11px] text-titanium/50 tracking-[0.25em] uppercase font-medium">
          OFFICIAL SECRET BALLOT &bull; ENCRYPTED PROTOCOL
        </div>
      </footer>
    </div>
  );
}
