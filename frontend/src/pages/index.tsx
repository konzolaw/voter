import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { apiClient } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [votingOpen, setVotingOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVotingStatus();
  }, []);

  const checkVotingStatus = async () => {
    try {
      const state = await apiClient.getSystemState();
      setVotingOpen(state.voting_open);
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-8 relative w-full h-64 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/hero.png"
              alt="Reign City Security Team"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-gold via-gold-light to-emerald bg-clip-text text-transparent">
            Reign City Security Team
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-white">
            Internal Elections
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Exercise your right to vote and help shape the future leadership of our team. 
            Your voice matters in selecting our next leaders.
          </p>
        </div>

        {/* Action Card */}
        <div className="glass-effect-strong rounded-2xl p-8 md:p-12">
          {loading ? (
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
              <p className="mt-4 text-gray-300">Loading...</p>
            </div>
          ) : votingOpen ? (
            <>
              <h3 className="text-2xl font-semibold mb-4 text-center text-gold">
                Voting is Now Open
              </h3>
              <p className="text-gray-300 text-center mb-8">
                Select your preferred candidates for each of the four positions. 
                Ensure you complete all selections before submitting.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleStartVoting}
                  className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black font-bold py-4 px-12 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 gold-glow"
                >
                  Start Voting
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-semibold mb-4 text-center text-gray-400">
                Voting is Closed
              </h3>
              <p className="text-gray-300 text-center mb-8">
                The voting period has ended. Results will be announced shortly by the administrator.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleViewResults}
                  className="bg-gradient-to-r from-emerald to-emerald-light hover:from-emerald-dark hover:to-emerald text-white font-bold py-4 px-12 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 emerald-glow"
                >
                  View Results
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-effect rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gold mb-2">4</div>
            <div className="text-sm text-gray-300">Positions</div>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-emerald mb-2">12</div>
            <div className="text-sm text-gray-300">Candidates</div>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gold mb-2">25</div>
            <div className="text-sm text-gray-300">Voters</div>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-emerald mb-2">1</div>
            <div className="text-sm text-gray-300">Vote Per Position</div>
          </div>
        </div>
      </div>
    </div>
  );
}
