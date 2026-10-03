import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/api';
import { VotingStats } from '@/types';

export default function VotesPage() {
  const router = useRouter();

  // Instant synchronous cache retrieval
  const cachedStats = apiClient.getCached<VotingStats>('stats');

  const [loading, setLoading] = useState(() => !cachedStats);
  const [stats, setStats] = useState<VotingStats | null>(() => cachedStats);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      if (!stats) setLoading(true);
      setError('');
      const data = await apiClient.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      if (!stats) {
        setError('Failed to load official voting statistics');
      }
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <AdminLayout title="Vote Breakdown">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold mb-4"></div>
            <p className="font-outfit text-xs tracking-widest uppercase text-titanium">Loading vote tallies...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Vote Breakdown">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md mx-auto border border-rose-500/20">
          <p className="text-rose-300 text-sm mb-4 font-outfit">{error}</p>
          <button
            onClick={loadStats}
            className="tap-effect bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Separate Team Lead from other positions
  const isTeamLead = (posName: string) =>
    posName?.toLowerCase().includes('team lead') || posName?.toLowerCase() === 'team_lead';

  const teamLeadPosition = stats?.position_breakdown.find((p) => isTeamLead(p.position));
  const otherPositions = stats?.position_breakdown.filter((p) => !isTeamLead(p.position)) || [];

  return (
    <AdminLayout title="Vote Breakdown by Position">
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <h1 className="font-syne font-black text-2xl sm:text-3xl text-white tracking-tight uppercase">
              Live Vote Ledger
            </h1>
            <p className="font-outfit text-xs text-titanium-light tracking-wider uppercase mt-1">
              Real-time candidate tallies and ballot distribution
            </p>
          </div>
          <button
            onClick={loadStats}
            className="tap-effect self-start sm:self-auto px-5 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs tracking-wider uppercase transition-all border border-white/10 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.03 8.03 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Flagship Spotlight: Team Lead */}
        {teamLeadPosition && (
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-gold/30 shadow-xl bg-gold/[0.04] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold/15">
              <div>
                <span className="font-outfit font-black text-[10px] sm:text-xs tracking-[0.25em] text-gold uppercase block mb-1">
                  ★ SUPREME OFFICE SPOTLIGHT
                </span>
                <h2 className="font-syne font-black text-2xl sm:text-3xl text-white tracking-tight">
                  {teamLeadPosition.position}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-outfit uppercase tracking-widest text-titanium block">Total Ballots</span>
                <span className="font-syne text-xl font-bold text-gold">
                  {teamLeadPosition.votes.reduce((acc, v) => acc + v.count, 0)} Votes
                </span>
              </div>
            </div>

            {teamLeadPosition.votes.length > 0 ? (
              <div className="space-y-3">
                {teamLeadPosition.votes.map((vote, vIdx) => {
                  const totalPosVotes = teamLeadPosition.votes.reduce((acc, v) => acc + v.count, 0) || 1;
                  const percentage = Math.round((vote.count / totalPosVotes) * 100);
                  const isLeader = vIdx === 0 && vote.count > 0;

                  return (
                    <div key={vIdx} className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isLeader && <span className="text-xs">👑</span>}
                          <span className="font-outfit font-bold text-sm sm:text-base text-white">
                            {vote.candidate__full_name}
                          </span>
                        </div>
                        <span className="font-syne font-bold text-sm sm:text-base text-gold">
                          {vote.count} {vote.count === 1 ? 'vote' : 'votes'}{' '}
                          <span className="text-xs text-titanium/80 font-normal">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-gold via-gold-light to-gold h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-titanium text-xs uppercase tracking-widest font-outfit">
                No ballots recorded yet for Team Lead
              </div>
            )}
          </div>
        )}

        {/* Other 6 Departmental Positions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {otherPositions.map((position, idx) => {
            const totalPosVotes = position.votes.reduce((acc, v) => acc + v.count, 0) || 1;

            return (
              <div key={idx} className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 shadow-lg">
                <div className="flex items-start justify-between mb-4 pb-2.5 border-b border-white/5">
                  <div>
                    <span className="text-[10px] font-outfit uppercase tracking-widest text-titanium block font-semibold mb-0.5">
                      POSITION {idx + 1}
                    </span>
                    <h3 className="font-syne font-bold text-lg sm:text-xl text-white tracking-tight">
                      {position.position}
                    </h3>
                  </div>
                  <span className="text-xs font-syne font-bold text-gold shrink-0">
                    {position.votes.reduce((acc, v) => acc + v.count, 0)} Votes
                  </span>
                </div>

                {position.votes.length > 0 ? (
                  <div className="space-y-2.5">
                    {position.votes.map((vote, vIdx) => {
                      const percentage = Math.round((vote.count / totalPosVotes) * 100);
                      const isLeader = vIdx === 0 && vote.count > 0;

                      return (
                        <div key={vIdx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-outfit font-semibold text-white flex items-center gap-1.5">
                              {isLeader && <span className="text-[10px]">👑</span>}
                              <span>{vote.candidate__full_name}</span>
                            </span>
                            <span className="font-syne font-bold text-gold">
                              {vote.count} <span className="text-[10px] text-titanium-light font-normal">({percentage}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-gold via-gold-light to-gold h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-titanium/70 text-xs font-outfit uppercase tracking-wider">
                    No votes cast yet for this position
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

