import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/api';
import { SystemState, VotingStats } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();

  // Instant synchronous cache inspection
  const cachedState = apiClient.getCached<SystemState>('system_state');
  const cachedStats = apiClient.getCached<VotingStats>('stats');

  const [loading, setLoading] = useState(() => !cachedState || !cachedStats);
  const [systemState, setSystemState] = useState<SystemState | null>(() => cachedState);
  const [stats, setStats] = useState<VotingStats | null>(() => cachedStats);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stateData, statsData] = await Promise.all([
        apiClient.getSystemState(),
        apiClient.getStats(),
      ]);
      setSystemState(stateData);
      setStats(statsData);
    } catch (err: any) {
      if (!stats) {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <AdminLayout title="Overview">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent mb-4"></div>
            <p className="text-gray-300">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Overview">
        <div className="glass-effect-strong rounded-2xl p-8 text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-gradient-to-r from-gold to-gold-light text-black font-bold py-3 px-8 rounded-lg"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Metric 1: Total Voters */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-lg">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-titanium block mb-1">
            Registered Roster
          </span>
          <div className="font-syne text-3xl font-black text-white">
            {stats?.total_voters || 0}
          </div>
          <span className="text-xs text-titanium-light mt-1 block">Operatives authorized</span>
        </div>

        {/* Metric 2: Votes Cast */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-lg">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-titanium block mb-1">
            Ballots Cast
          </span>
          <div className="font-syne text-3xl font-black text-emerald-400">
            {stats?.voted_count || 0}
          </div>
          <span className="text-xs text-titanium-light mt-1 block">Verified submissions</span>
        </div>

        {/* Metric 3: Pending */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-lg">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-titanium block mb-1">
            Pending Turnout
          </span>
          <div className="font-syne text-3xl font-black text-gold">
            {stats?.pending_count || 0}
          </div>
          <span className="text-xs text-titanium-light mt-1 block">Awaiting vote</span>
        </div>

        {/* Metric 4: System State */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-lg">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-titanium block mb-1">
            Election State
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-block h-3 w-3 rounded-full ${
              systemState?.voting_open ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`} />
            <span className="font-syne text-xl font-bold text-white uppercase tracking-tight">
              {systemState?.voting_open ? 'Ballot Open' : 'Closed'}
            </span>
          </div>
          <span className="text-xs text-titanium-light mt-1 block">
            Results: {systemState?.results_released ? 'Published' : 'Pending Sign-off'}
          </span>
        </div>
      </div>

      {/* Turnout Meter */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-syne text-lg sm:text-xl font-bold text-white tracking-tight">
              Live Voter Participation
            </h2>
            <p className="text-xs text-titanium-light mt-0.5">
              Real-time turnout percentage across all registered squad operatives
            </p>
          </div>
          <div className="font-syne text-3xl sm:text-4xl font-black text-gold">
            {stats?.turnout_percentage || 0}%
          </div>
        </div>

        <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-gold via-gold-light to-gold h-full rounded-full transition-all duration-500"
            style={{ width: `${stats?.turnout_percentage || 0}%` }}
          />
        </div>
      </div>

      {/* Live Position Standings - Real-time Election Intelligence */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="font-syne font-black text-2xl sm:text-3xl text-white tracking-tight uppercase">
              Live Position Standings
            </h2>
            <p className="font-outfit font-bold text-xs uppercase tracking-[0.25em] text-gold mt-1">
              Real-time vote tallies across all 7 leadership offices
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/votes')}
            className="tap-effect text-xs font-semibold text-titanium-light hover:text-gold uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto transition-colors"
          >
            <span>Full Vote Ledger</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Flagship: Team Lead Race Card */}
        {(() => {
          const isTeamLead = (posName: string) =>
            posName?.toLowerCase().includes('team lead') || posName?.toLowerCase() === 'team_lead';

          const teamLeadPosition = stats?.position_breakdown.find((p) => isTeamLead(p.position));
          const otherPositions = stats?.position_breakdown.filter((p) => !isTeamLead(p.position)) || [];

          return (
            <>
              {teamLeadPosition && (
                <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-gold/35 shadow-xl bg-gold/[0.03] mb-5 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gold/15">
                    <div>
                      <span className="font-outfit font-black text-[10px] sm:text-xs tracking-[0.3em] uppercase text-gold block mb-1">
                        ★ SUPREME OFFICE SPOTLIGHT
                      </span>
                      <h3 className="font-syne font-black text-2xl sm:text-3xl text-white tracking-tight">
                        {teamLeadPosition.position}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-outfit uppercase tracking-widest text-titanium block">Total Ballots</span>
                        <span className="font-syne text-lg sm:text-xl font-bold text-gold">
                          {teamLeadPosition.votes.reduce((acc, v) => acc + v.count, 0)} Votes Cast
                        </span>
                      </div>
                    </div>
                  </div>

                  {teamLeadPosition.votes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {teamLeadPosition.votes.map((vote, vIdx) => {
                        const totalLeadVotes = teamLeadPosition.votes.reduce((acc, v) => acc + v.count, 0) || 1;
                        const percentage = Math.round((vote.count / totalLeadVotes) * 100);
                        const isLeader = vIdx === 0 && vote.count > 0;

                        return (
                          <div
                            key={vIdx}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              isLeader
                                ? 'bg-gold/15 border-gold/40 shadow-lg shadow-gold/10'
                                : 'bg-black/40 border-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isLeader && <span className="text-sm">👑</span>}
                                <span className="font-outfit font-bold text-sm text-white truncate">
                                  {vote.candidate__full_name}
                                </span>
                              </div>
                              <span className="font-syne font-bold text-sm text-gold shrink-0">
                                {vote.count} <span className="text-[10px] text-titanium/80 font-normal">({percentage}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
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
                    <div className="text-center py-6 text-titanium text-xs font-outfit uppercase tracking-widest">
                      No ballots recorded yet for Team Lead
                    </div>
                  )}
                </div>
              )}

              {/* 6 Departmental Positions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherPositions.map((pos, idx) => {
                  const totalPosVotes = pos.votes.reduce((acc, v) => acc + v.count, 0) || 1;

                  return (
                    <div key={idx} className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-white/5">
                          <div>
                            <span className="text-[9px] font-outfit uppercase tracking-widest text-titanium block font-bold">
                              POSITION {idx + 1}
                            </span>
                            <h4 className="font-syne font-bold text-base sm:text-lg text-white tracking-tight mt-0.5">
                              {pos.position}
                            </h4>
                          </div>
                          <span className="font-syne text-xs font-bold text-gold shrink-0 mt-0.5">
                            {pos.votes.reduce((acc, v) => acc + v.count, 0)} Votes
                          </span>
                        </div>

                        {pos.votes.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {pos.votes.map((vote, vIdx) => {
                              const percentage = Math.round((vote.count / totalPosVotes) * 100);
                              const isLeader = vIdx === 0 && vote.count > 0;

                              return (
                                <div key={vIdx} className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-outfit font-semibold text-white flex items-center gap-1.5 truncate">
                                      {isLeader && <span className="text-[10px]">👑</span>}
                                      <span className="truncate">{vote.candidate__full_name}</span>
                                    </span>
                                    <span className="font-syne font-bold text-gold shrink-0 ml-2">
                                      {vote.count} <span className="text-[10px] text-titanium-light font-normal">({percentage}%)</span>
                                    </span>
                                  </div>
                                  <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
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
                          <div className="text-center py-6 text-titanium/60 text-xs font-outfit uppercase tracking-wider">
                            No votes cast yet
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* Navigation Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/admin/voters')}
          className="tap-effect h-14 rounded-2xl glass-panel hover:border-gold/40 border border-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg"
        >
          <span>Manage Voters Roster</span>
          <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>

        <button
          onClick={() => router.push('/admin/candidates')}
          className="tap-effect h-14 rounded-2xl glass-panel hover:border-gold/40 border border-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg"
        >
          <span>Manage Candidates</span>
          <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        <button
          onClick={() => router.push('/admin/positions')}
          className="tap-effect h-14 rounded-2xl glass-panel hover:border-gold/40 border border-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg"
        >
          <span>Manage Positions</span>
          <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>

        <button
          onClick={() => router.push('/admin/control')}
          className="tap-effect h-14 rounded-2xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-gold/20"
        >
          <span>Command &amp; Control</span>
          <svg className="w-4 h-4 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>
    </AdminLayout>
  );
}
