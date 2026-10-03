import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { Position, Candidate, Vote } from '@/types';

// Helper to identify and place Team Lead strictly last
const sortBallotPositions = (positionsData: Position[]) => {
  const isTeamLead = (p: Position) =>
    p.name?.toLowerCase() === 'team_lead' ||
    p.display_name?.toLowerCase().trim() === 'team lead';

  const nonLeadPositions = (positionsData || []).filter((p) => !isTeamLead(p));
  const leadPositions = (positionsData || []).filter((p) => isTeamLead(p));
  return [...nonLeadPositions, ...leadPositions];
};

export default function Ballot() {
  const router = useRouter();
  
  // Synchronous initial cache retrieval for instant 0ms rendering
  const cachedPositions = apiClient.getCached<Position[]>('positions');
  const cachedCandidates = apiClient.getCached<Candidate[]>('candidates');

  const [positions, setPositions] = useState<Position[]>(() =>
    cachedPositions ? sortBallotPositions(cachedPositions) : []
  );
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    cachedCandidates || []
  );
  const [selections, setSelections] = useState<{ [key: number]: number }>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(() => !cachedPositions || !cachedCandidates);
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

      const orderedPositions = sortBallotPositions(positionsData || []);

      setPositions(orderedPositions);
      setCandidates(candidatesData || []);
    } catch (err) {
      if (!positions.length) {
        setError('Failed to load ballot data');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleSelectCandidate = (candidateId: number) => {
    const currentPosition = positions[currentStep];
    if (!currentPosition) return;

    setError('');
    setSelections((prev) => ({
      ...prev,
      [currentPosition.id]: candidateId,
    }));

    // Auto-advance to next position smoothly if not on the final step
    if (currentStep < positions.length - 1) {
      setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, positions.length - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 350);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setError('');
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    const currentPosition = positions[currentStep];
    if (!currentPosition) return;

    if (selections[currentPosition.id] === undefined) {
      setError(`Please select a candidate for ${currentPosition.display_name} to continue.`);
      return;
    }

    setError('');
    if (currentStep < positions.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handleJumpToStep = (stepIdx: number) => {
    setError('');
    setCurrentStep(stepIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAllSelected = () => {
    return positions.length > 0 && positions.every((pos) => selections[pos.id] !== undefined);
  };

  const handleSubmit = () => {
    if (!isAllSelected()) {
      // Find the first unselected position and jump there
      const unselectedIdx = positions.findIndex((pos) => selections[pos.id] === undefined);
      if (unselectedIdx !== -1) {
        setCurrentStep(unselectedIdx);
        setError(`Please select a candidate for ${positions[unselectedIdx].display_name}.`);
        return;
      }
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
      <div className="min-h-screen ambient-bg flex items-center justify-center p-4">
        <div className="py-8 flex flex-col items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold mb-4"></div>
          <p className="font-outfit text-xs tracking-widest uppercase text-titanium">Loading official ballot ledger...</p>
        </div>
      </div>
    );
  }

  const currentPosition = positions[currentStep];
  const isFinalStep = currentStep === positions.length - 1;
  const isLeadPosition =
    currentPosition?.name?.toLowerCase() === 'team_lead' ||
    currentPosition?.display_name?.toLowerCase().trim() === 'team lead';

  const positionCandidates = currentPosition
    ? candidates.filter((c) => c.positions.some((p) => p.id === currentPosition.id))
    : [];

  const currentSelection = currentPosition ? selections[currentPosition.id] : undefined;

  return (
    <div className="min-h-screen ambient-bg flex flex-col justify-between pt-8 sm:pt-12 pb-8 sm:pb-12 px-3 sm:px-6">
      <main className="max-w-3xl w-full mx-auto pb-10">
        {/* Minimal Position-First Header & Stepper */}
        <div className="mb-4 sm:mb-6 pt-1 sm:pt-3">
          <div className="flex items-center justify-between text-xs mb-2 px-1">
            <span className="font-outfit font-black text-xs sm:text-sm tracking-widest uppercase text-titanium-light">
              Position {String(currentStep + 1).padStart(2, '0')} of {String(positions.length).padStart(2, '0')}
            </span>
            <span className="font-outfit font-bold text-xs sm:text-sm tracking-wider uppercase text-gold">
              {Object.keys(selections).length} of {positions.length} Selected
            </span>
          </div>

          {/* Segmented Step Indicator Bar */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {positions.map((pos, idx) => {
              const isFilled = selections[pos.id] !== undefined;
              const isCurrent = idx === currentStep;
              const isLead =
                pos.name?.toLowerCase() === 'team_lead' ||
                pos.display_name?.toLowerCase().trim() === 'team lead';

              return (
                <button
                  key={pos.id}
                  onClick={() => handleJumpToStep(idx)}
                  title={`${pos.display_name}${isFilled ? ' (Selected)' : ''}`}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 relative ${
                    isCurrent
                      ? 'bg-gold ring-2 ring-gold/40 shadow-sm shadow-gold/50'
                      : isFilled
                      ? 'bg-emerald-400/80 hover:bg-emerald-400'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {isLead && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-gold font-bold">
                      ★
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notice / Error Feedback */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 max-w-xl mx-auto">
            <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs text-rose-200/90 leading-snug">{error}</p>
            </div>
          </div>
        )}

        {/* Active Position Card Container */}
        {currentPosition && (
          <section className="glass-panel rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Ambient flare for Team Lead grand finale */}
            {isLeadPosition && (
              <div className="absolute top-0 right-0 w-72 h-72 bg-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            )}

            {/* Position Header Details - Clean & Direct */}
            <div className="text-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/5">
              {isLeadPosition && (
                <div className="font-outfit font-black text-[11px] sm:text-xs tracking-[0.25em] uppercase text-gold mb-1 flex items-center justify-center gap-1.5">
                  <span>★</span>
                  <span>FINAL POSITION &bull; SUPREME LEADERSHIP</span>
                  <span>★</span>
                </div>
              )}

              <h1 className="font-syne font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
                {currentPosition.display_name}
              </h1>

              {currentPosition.description && (
                <p className="text-[11px] sm:text-xs text-titanium-light mt-1 max-w-xl mx-auto leading-relaxed line-clamp-2">
                  {currentPosition.description}
                </p>
              )}

              {currentSelection !== undefined && (
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-emerald-400 font-outfit font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    Selected: <strong className="text-white">{candidates.find((c) => c.id === currentSelection)?.full_name}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Candidate Cards Grid - 3 columns on phone, 3 on tablet, 4 on desktop */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
              {positionCandidates.map((candidate) => {
                const isSelected = currentSelection === candidate.id;

                return (
                  <div
                    key={candidate.id}
                    onClick={() => handleSelectCandidate(candidate.id)}
                    className={`tap-effect relative rounded-xl sm:rounded-2xl p-2 sm:p-3.5 md:p-4 cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between ${
                      isSelected
                        ? 'border-gold bg-gold/15 ring-2 ring-gold/40 shadow-xl shadow-gold/20 scale-[1.02]'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/25'
                    }`}
                  >
                    <div className="aspect-square relative w-full mb-1.5 sm:mb-2.5 rounded-lg sm:rounded-xl overflow-hidden bg-black/40 border border-white/5">
                      {candidate.image ? (
                        <Image
                          src={candidate.image}
                          alt={candidate.full_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/15 to-white/[0.02]">
                          <span className="font-syne text-xl sm:text-2xl md:text-3xl font-bold text-gold">
                            {candidate.full_name.charAt(0)}
                          </span>
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gold text-canvas flex items-center justify-center shadow-md animate-scale">
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-auto">
                      <span className="font-outfit font-bold text-[11px] sm:text-sm md:text-base text-white tracking-tight line-clamp-1">
                        {candidate.full_name}
                      </span>
                      <div
                        className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-gold bg-gold' : 'border-white/30'
                        }`}
                      >
                        {isSelected && <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-canvas" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* In-Card Stepper Action Buttons */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="tap-effect w-full sm:w-auto px-5 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs sm:text-sm transition-all border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Previous Position</span>
              </button>

              <div className="text-[11px] font-outfit text-titanium/70 uppercase tracking-widest hidden sm:block">
                Auto-advances on selection
              </div>

              {isFinalStep ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="tap-effect w-full sm:w-auto px-7 h-12 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold text-xs sm:text-sm tracking-wide shadow-xl shadow-gold/25 hover:brightness-105 transition-all flex items-center justify-center gap-2"
                >
                  <span>Review &amp; Cast Ballot</span>
                  <svg className="w-4 h-4 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentSelection === undefined}
                  className="tap-effect w-full sm:w-auto px-6 h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm tracking-wide transition-all border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>Next Position</span>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Confirmation Review Modal - Multi-Column Card Grid */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="glass-panel rounded-3xl p-4 sm:p-6 max-w-2xl w-full border border-white/15 shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="text-center mb-3.5 pb-3 border-b border-white/5 shrink-0">
              <h3 className="font-syne font-black text-xl sm:text-2xl text-white tracking-tight uppercase">
                Confirm Your Vote
              </h3>
              <p className="text-[11px] sm:text-xs text-titanium-light mt-0.5 max-w-sm mx-auto leading-relaxed">
                Review your 7 selections below. Tap any card to adjust your vote before submitting.
              </p>
            </div>

            {/* Scrollable Columnar Grid of Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 overflow-y-auto pr-1 flex-1 min-h-0">
              {positions.map((position, idx) => {
                const selectedCandidate = candidates.find((c) => c.id === selections[position.id]);
                const isLead =
                  position.name?.toLowerCase() === 'team_lead' ||
                  position.display_name?.toLowerCase().trim() === 'team lead';

                return (
                  <div
                    key={position.id}
                    onClick={() => {
                      setShowConfirmModal(false);
                      handleJumpToStep(idx);
                    }}
                    className={`tap-effect rounded-2xl p-3 sm:p-3.5 border transition-all cursor-pointer flex flex-col justify-between group ${
                      isLead
                        ? 'col-span-2 bg-gold/10 border-gold/45 hover:bg-gold/15 ring-1 ring-gold/30 shadow-lg shadow-gold/10'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-gold/30'
                    }`}
                  >
                    {/* Top Row: Prominent, High-Contrast Position Name */}
                    <div className="flex items-start justify-between gap-1.5 mb-2.5 pb-2 border-b border-white/10">
                      <div>
                        <span className="text-[9px] font-outfit uppercase tracking-widest text-titanium-light block font-semibold">
                          {isLead ? 'SUPREME OFFICE' : `POSITION ${idx + 1}`}
                        </span>
                        <h4
                          className={`font-outfit font-black text-xs sm:text-sm tracking-wide uppercase leading-snug mt-0.5 ${
                            isLead ? 'text-gold' : 'text-gold-light'
                          }`}
                        >
                          {position.display_name}
                        </h4>
                      </div>
                      <span className="text-xs text-titanium/50 group-hover:text-gold shrink-0 transition-colors">
                        ✎
                      </span>
                    </div>

                    {/* Bottom Row: Candidate Avatar & Full Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`rounded-lg sm:rounded-xl overflow-hidden bg-black/60 border border-white/15 shrink-0 relative flex items-center justify-center ${
                          isLead ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-8 h-8 sm:w-9 sm:h-9'
                        }`}
                      >
                        {selectedCandidate?.image ? (
                          <Image
                            src={selectedCandidate.image}
                            alt={selectedCandidate.full_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/20 to-white/[0.02]">
                            <span className="font-syne text-xs sm:text-sm font-bold text-gold">
                              {selectedCandidate ? selectedCandidate.full_name.charAt(0) : '?'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[9px] font-outfit text-emerald-400 font-semibold uppercase tracking-wider block">
                          Selected
                        </span>
                        <div className="font-outfit font-bold text-xs sm:text-sm text-white tracking-tight truncate">
                          {selectedCandidate ? (
                            selectedCandidate.full_name
                          ) : (
                            <span className="text-rose-400 italic">Not Selected</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-4 pt-3.5 border-t border-white/5 flex gap-2.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="tap-effect flex-1 h-11 sm:h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs sm:text-sm transition-all border border-white/10"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                disabled={submitting}
                className="tap-effect flex-1 h-11 sm:h-12 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xl shadow-gold/25 hover:brightness-105 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas"></div>
                    <span>Casting...</span>
                  </>
                ) : (
                  <>
                    <span>Cast Official Ballot</span>
                    <svg className="w-4 h-4 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Footer - Pure Naked Typography */}
      <footer className="w-full max-w-3xl mx-auto pt-6 pb-2 text-center">
        <div className="text-[10px] sm:text-[11px] text-titanium/50 tracking-[0.25em] uppercase font-medium">
          OFFICIAL SECRET BALLOT &bull; ENCRYPTED PROTOCOL
        </div>
      </footer>
    </div>
  );
}

