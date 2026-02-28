import { useRouter } from 'next/router';

export default function ThankYou() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="glass-effect-strong rounded-2xl p-12">
          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-emerald/20 border-4 border-emerald flex items-center justify-center emerald-glow">
              <svg
                className="w-12 h-12 text-emerald"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-gold">
            Thank You for Voting
          </h1>

          <p className="text-xl text-gray-300 mb-8">
            Your votes have been recorded successfully
          </p>

          <div className="glass-effect rounded-lg p-6 mb-8">
            <p className="text-gray-300 leading-relaxed">
              Please stay put as the administrator will review the votes and release the results shortly. 
              Your participation in this democratic process is greatly appreciated.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/results')}
              className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 gold-glow"
            >
              View Results Status
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all"
            >
              Return to Home
            </button>
          </div>
        </div>

        <div className="mt-8 glass-effect rounded-lg p-4">
          <p className="text-sm text-gray-400">
            Reign City Security Team - Internal Elections 2026
          </p>
        </div>
      </div>
    </div>
  );
}
