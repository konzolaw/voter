import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { FinalResult } from '@/types';

export default function Results() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [released, setReleased] = useState(false);
  const [results, setResults] = useState<FinalResult[]>([]);
  const [message, setMessage] = useState('');

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
      setMessage('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent mb-4"></div>
          <p className="text-gray-300">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!released) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="glass-effect-strong rounded-2xl p-12">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gold/20 border-4 border-gold flex items-center justify-center gold-glow">
                <svg
                  className="w-12 h-12 text-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4 text-gold">Results Pending</h1>
            <p className="text-xl text-gray-300 mb-8">{message}</p>

            <button
              onClick={() => loadResults()}
              className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 gold-glow mb-4"
            >
              Refresh Status
            </button>

            <div className="mt-6">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-gold transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gold via-gold-light to-emerald bg-clip-text text-transparent">
            Election Results
          </h1>
          <p className="text-xl text-gray-300">
            Congratulations to our newly elected leaders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="glass-effect-strong rounded-2xl p-8 transform transition-all duration-500 hover:scale-105"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
              }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gold mb-2">
                  {result.position.display_name}
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-gold to-emerald mx-auto rounded-full"></div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-40 h-40 relative mb-4 rounded-full overflow-hidden border-4 border-gold gold-glow">
                  <Image
                    src={result.winner.image || '/rcc_placeholder.png'}
                    alt={result.winner.full_name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                <h3 className="text-3xl font-bold text-white mb-2">
                  {result.winner.full_name}
                </h3>

                <div className="glass-effect rounded-lg px-6 py-3 mt-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald mb-1">
                      {result.vote_count}
                    </div>
                    <div className="text-sm text-gray-400">
                      {result.vote_count === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 gold-glow"
          >
            Back to Home
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
