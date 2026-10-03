import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/api';
import { SystemState } from '@/types';
import { formatDate } from '@/lib/utils';

export default function ControlPage() {
  const router = useRouter();

  // Instant synchronous cache retrieval
  const cachedState = apiClient.getCached<SystemState>('system_state');

  const [loading, setLoading] = useState(() => !cachedState);
  const [systemState, setSystemState] = useState<SystemState | null>(() => cachedState);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async (forceFresh = false) => {
    try {
      const state = await apiClient.getSystemState(forceFresh);
      setSystemState(state);
    } catch (err: any) {
      console.error('Failed to load state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVoting = async () => {
    if (!confirm('Are you sure you want to close voting? This action cannot be undone.')) {
      return;
    }

    setActionInProgress(true);
    try {
      const res = await apiClient.closeVoting();
      // Optimistically update system state immediately so Release Results button activates instantly
      setSystemState((prev) => ({
        voting_open: false,
        results_released: prev?.results_released || false,
        voting_closed_at: res?.closed_at || new Date().toISOString(),
        results_released_at: prev?.results_released_at || null,
      }));
      await loadState(true);
      alert('Voting has been closed successfully. You can now release the certified results.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to close voting');
      await loadState(true);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReleaseResults = async () => {
    if (!confirm('Are you sure you want to release the results? This will run conflict resolution and make results public.')) {
      return;
    }

    setActionInProgress(true);
    try {
      const res = await apiClient.releaseResults();
      // Optimistically update system state immediately
      setSystemState((prev) => ({
        voting_open: false,
        results_released: true,
        voting_closed_at: prev?.voting_closed_at || null,
        results_released_at: res?.released_at || new Date().toISOString(),
      }));
      await loadState(true);
      alert('Results have been released and certified successfully! Public podium is now active.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to release results');
      await loadState(true);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRestartVoting = async () => {
    const confirmed = confirm(
      '⚠️ DANGER: This will DELETE ALL VOTES and RESET ALL VOTERS!\n\n' +
      'This action is useful if errors occurred during testing.\n\n' +
      '• All votes will be permanently deleted\n' +
      '• All voters will be reset to "not voted"\n' +
      '• Voting will be reopened\n' +
      '• Results will be cleared\n\n' +
      'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) return;

    const doubleConfirm = confirm('Final confirmation: Type YES in the next prompt to proceed');
    if (!doubleConfirm) return;

    const userInput = prompt('Type YES to confirm restart:');
    if (userInput !== 'YES') {
      alert('Restart cancelled - confirmation text did not match');
      return;
    }

    setActionInProgress(true);
    try {
      const response = await apiClient.restartVoting();
      // Optimistically reset state immediately
      setSystemState({
        voting_open: true,
        results_released: false,
        voting_closed_at: null,
        results_released_at: null,
      });
      await loadState(true);
      alert(
        `✅ Voting system restarted successfully!\n\n` +
        `Votes deleted: ${response.votes_deleted}\n` +
        `Voters reset: ${response.voters_reset}\n\n` +
        `Voting is now OPEN again.`
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to restart voting');
      await loadState(true);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Control Panel">
        <div className="flex justify-center items-center h-64">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Command &amp; Control">
      <div className="space-y-6">
        {/* Current Status Overview */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div>
              <h2 className="font-syne text-xl font-bold text-white tracking-tight">System State</h2>
              <p className="text-xs text-titanium-light mt-0.5">Live status of the election ledger and tally engine</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-titanium block mb-1">
                Ballot Box State
              </span>
              <div className="flex items-center gap-2.5">
                <span className={`h-3 w-3 rounded-full ${systemState?.voting_open ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="font-syne text-2xl font-bold text-white uppercase tracking-tight">
                  {systemState?.voting_open ? 'Open &amp; Accepting Votes' : 'Closed &amp; Sealed'}
                </span>
              </div>
              {systemState?.voting_closed_at && (
                <p className="text-xs text-titanium-light font-mono mt-2">
                  Closed at: {formatDate(systemState.voting_closed_at)}
                </p>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-titanium block mb-1">
                Public Results State
              </span>
              <div className="flex items-center gap-2.5">
                <span className={`h-3 w-3 rounded-full ${systemState?.results_released ? 'bg-emerald-400' : 'bg-gold'}`} />
                <span className="font-syne text-2xl font-bold text-white uppercase tracking-tight">
                  {systemState?.results_released ? 'Published to Public' : 'Pending Certification'}
                </span>
              </div>
              {systemState?.results_released_at && (
                <p className="text-xs text-titanium-light font-mono mt-2">
                  Released at: {formatDate(systemState.results_released_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action 1: Close Voting */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-gold uppercase tracking-wider">Step 01</span>
              <h3 className="font-syne text-lg font-bold text-white tracking-tight">Close Ballot Box</h3>
            </div>
            <p className="text-xs text-titanium-light leading-relaxed mb-3">
              Once all squad operatives have cast their votes, close the voting session to lock the ledger and prevent further ballots.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-titanium">
              <span>&bull; Irreversible action</span>
              <span>&bull; Required before results calculation</span>
            </div>
          </div>

          <button
            onClick={handleCloseVoting}
            disabled={!systemState?.voting_open || actionInProgress}
            className="tap-effect h-14 px-8 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-950/60 border border-rose-400/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 min-w-[220px] flex items-center justify-center gap-2.5 cursor-pointer ring-1 ring-white/10"
          >
            <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>
              {actionInProgress ? 'Processing...' : systemState?.voting_open ? 'Close Ballot Box' : 'Ballot Closed'}
            </span>
          </button>
        </div>

        {/* Action 2: Release Results */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-gold uppercase tracking-wider">Step 02</span>
              <h3 className="font-syne text-lg font-bold text-white tracking-tight">Release Certified Results</h3>
            </div>
            <p className="text-xs text-titanium-light leading-relaxed mb-3">
              Execute the conflict resolution algorithm, calculate majority winners across all positions, and release results to the public podium.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-titanium">
              <span>&bull; Automatic multi-position resolution</span>
              <span>&bull; Publishes results to /results</span>
            </div>
          </div>

          <button
            onClick={handleReleaseResults}
            disabled={systemState?.voting_open || systemState?.results_released || actionInProgress}
            className="tap-effect h-14 px-8 rounded-2xl bg-gradient-to-r from-gold via-gold-light to-gold hover:brightness-110 text-canvas font-black text-xs uppercase tracking-widest shadow-xl shadow-gold/30 border border-gold/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 min-w-[220px] flex items-center justify-center gap-2.5 cursor-pointer ring-1 ring-white/20"
          >
            <svg className="w-4 h-4 text-canvas shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {actionInProgress ? 'Executing Algorithm...' : systemState?.results_released ? 'Results Published' : 'Release Results'}
            </span>
          </button>
        </div>

        {/* DANGER ZONE - Restart Voting */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/25 bg-rose-500/[0.03] shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <h3 className="font-syne text-lg font-bold text-rose-300 tracking-tight">Danger Zone: System Reset</h3>
              </div>
              <p className="text-xs text-rose-200/80 leading-relaxed mb-3">
                Completely purge all cast ballots, reset all voter statuses to "not voted", clear device bindings, and reopen polls. Only use for dry-run testing.
              </p>
              <div className="text-[11px] text-rose-400 font-semibold tracking-wide">
                ⚠️ Requires multi-step confirmation. Permanent deletion cannot be undone.
              </div>
            </div>

            <button
              onClick={handleRestartVoting}
              disabled={actionInProgress}
              className="tap-effect h-14 px-8 rounded-2xl bg-gradient-to-r from-rose-950 to-red-950 hover:from-rose-900 hover:to-red-900 text-rose-200 hover:text-white border-2 border-rose-500/50 hover:border-rose-400 font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-950/70 transition-all disabled:opacity-30 shrink-0 min-w-[220px] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>
                {actionInProgress ? 'Purging...' : 'Reset & Restart Polls'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
