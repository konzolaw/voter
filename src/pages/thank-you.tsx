import { useRouter } from 'next/router';

export default function ThankYou() {
  const router = useRouter();

  return (
    <div className="min-h-screen ambient-bg flex flex-col justify-between py-6 px-4 sm:px-6">
      <main className="max-w-lg w-full mx-auto my-auto text-center">
        {/* Top Header Section - Pure Naked Typography */}
        <div className="pt-2 sm:pt-4 mb-6 sm:mb-8">
          <h1 className="font-syne font-black text-3xl sm:text-5xl uppercase tracking-tight text-white leading-none">
            BALLOT SEALED
          </h1>
          <p className="font-outfit font-bold text-xs sm:text-sm tracking-[0.28em] uppercase text-gold mt-2 sm:mt-3">
            Official Submission Recorded
          </p>
        </div>

        {/* Confirmation Card */}
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl">
          {/* Animated Success Seal */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="font-syne text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
            Thank You For Voting
          </h2>

          <p className="text-xs sm:text-sm text-titanium-light mb-8 leading-relaxed">
            Your votes across all positions have been cryptographically verified and recorded in the election ledger.
            Official results will be published once tallies are concluded.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/results')}
              className="tap-effect w-full h-14 rounded-2xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-semibold text-base tracking-wide shadow-lg shadow-gold/20 hover:brightness-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>View Results Status</span>
              <svg className="w-5 h-5 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/')}
              className="tap-effect w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10"
            >
              Return to Overview
            </button>
          </div>
        </div>
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full max-w-lg mx-auto pt-8 pb-2 text-center">
        <div className="text-[10px] sm:text-[11px] text-titanium/50 tracking-[0.25em] uppercase font-medium">
          OFFICIAL SECRET BALLOT &bull; ENCRYPTED PROTOCOL
        </div>
      </footer>
    </div>
  );
}
