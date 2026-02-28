import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';
import { getDeviceFingerprint } from '@/lib/utils';

export default function Verify() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="glass-effect-strong rounded-2xl p-8 md:p-10">
          <h1 className="text-3xl font-bold mb-2 text-center text-gold">
            Voter Verification
          </h1>
          <p className="text-gray-300 text-center mb-8">
            Enter your full name to proceed with voting
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                placeholder="Enter your name as registered"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none gold-glow"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-black border-r-transparent mr-2"></span>
                  Verifying...
                </span>
              ) : (
                'Continue to Ballot'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-gold transition-colors text-sm"
            >
              ← Back to Home
            </button>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-emerald/10 border border-emerald/30">
            <p className="text-xs text-gray-400 text-center">
              Your device will be registered for this voting session.
              You must use the same device to complete your vote.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
