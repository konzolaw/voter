import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { Position, Candidate, Vote } from '@/types';

export default function Ballot() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selections, setSelections] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    // Check if voter is verified
    const voterName = sessionStorage.getItem('voter_name');
    if (!voterName) {
      router.push('/verify');
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [positionsData, candidatesData] = await Promise.all([
        apiClient.getPositions(),
        apiClient.getCandidates(),
      ]);
      setPositions(positionsData);
      setCandidates(candidatesData);
    } catch (err) {
      setError('Failed to load ballot data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (positionId: number, candidateId: number) => {
    setSelections((prev) => ({
      ...prev,
      [positionId]: candidateId,
    }));
  };

  const isAllSelected = () => {
    return positions.every((pos) => selections[pos.id] !== undefined);
  };

  const handleSubmit = () => {
    if (!isAllSelected()) {
      setError('Please select a candidate for all positions');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const voterName = sessionStorage.getItem('voter_name') || '';
      const deviceHash = sessionStorage.getItem('device_hash') || '';

      const votes: Vote[] = Object.entries(selections).map(([positionId, candidateId]) => ({
        position_id: parseInt(positionId),
        candidate_id: candidateId,
      }));

      await apiClient.submitVotes(voterName, deviceHash, votes);
      
      // Clear session and redirect to thank you page
      sessionStorage.clear();
      router.push('/thank-you');
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to submit votes. Please try again.');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent mb-4"></div>
          <p className="text-gray-300">Loading ballot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gold">Cast Your Vote</h1>
          <p className="text-gray-300">Select one candidate for each position</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 max-w-2xl mx-auto">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="glass-effect rounded-lg p-4 mb-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Progress:</span>
            <span className="text-gold font-semibold">
              {Object.keys(selections).length} / {positions.length} positions selected
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-gold to-emerald h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Object.keys(selections).length / positions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Positions and Candidates */}
        <div className="space-y-12">
          {positions.map((position) => {
            const positionCandidates = candidates.filter((c) =>
              c.positions.some((p) => p.id === position.id)
            );

            return (
              <div key={position.id} className="glass-effect-strong rounded-2xl p-4 md:p-6 lg:p-8">
                <div className="mb-4 md:mb-6">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3 text-gold">
                    {position.display_name}
                  </h2>
                  <p className="text-sm md:text-base text-gray-300 leading-relaxed">{position.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                  {positionCandidates.map((candidate) => {
                    const isSelected = selections[position.id] === candidate.id;

                    return (
                      <div
                        key={candidate.id}
                        onClick={() => handleSelectCandidate(position.id, candidate.id)}
                        className={`glass-effect rounded-lg md:rounded-xl p-2 md:p-4 cursor-pointer card-hover ${
                          isSelected ? 'selected-card' : ''
                        }`}
                      >
                        <div className="aspect-square relative mb-2 md:mb-3 rounded-lg overflow-hidden bg-gray-800">
                          <Image
                            src={candidate.image || '/rcc_placeholder.png'}
                            alt={candidate.full_name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <h3 className="text-xs md:text-lg font-semibold text-center text-white">
                          {candidate.full_name}
                        </h3>
                        {isSelected && (
                          <div className="mt-1 md:mt-2 flex justify-center">
                            <span className="text-[10px] md:text-xs bg-gold text-black px-2 md:px-3 py-0.5 md:py-1 rounded-full font-semibold">
                              Selected
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="mt-12 max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isAllSelected() || submitting}
            className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none gold-glow"
          >
            {submitting ? 'Submitting...' : 'Submit My Votes'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="glass-effect-strong rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4 text-gold text-center">Confirm Your Votes</h3>
            <p className="text-gray-300 mb-6 text-center">
              Are you sure you want to submit your votes? This action cannot be undone.
            </p>
            <div className="space-y-3">
              {positions.map((position) => {
                const selectedCandidate = candidates.find((c) => c.id === selections[position.id]);
                return (
                  <div key={position.id} className="flex justify-between items-center">
                    <span className="text-gray-400">{position.display_name}:</span>
                    <span className="text-white font-semibold">{selectedCandidate?.full_name}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 bg-gradient-to-r from-emerald to-emerald-light hover:from-emerald-dark hover:to-emerald text-white font-bold py-3 px-6 rounded-lg transition-all emerald-glow"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
