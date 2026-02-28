import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/api';
import { SystemState } from '@/types';
import { formatDate } from '@/lib/utils';

export default function ControlPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const state = await apiClient.getSystemState();
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
      await apiClient.closeVoting();
      await loadState();
      alert('Voting has been closed successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to close voting');
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
      await apiClient.releaseResults();
      await loadState();
      alert('Results have been released successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to release results');
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
      await loadState();
      alert(
        `✅ Voting system restarted successfully!\n\n` +
        `Votes deleted: ${response.votes_deleted}\n` +
        `Voters reset: ${response.voters_reset}\n\n` +
        `Voting is now OPEN again.`
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to restart voting');
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
    <AdminLayout title="Voting Control Panel">
      <div className="space-y-6">
        {/* Current Status */}
        <div className="glass-effect-strong rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-gold">Current System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 mb-2">Voting Status</p>
              <div className={`text-3xl font-bold ${systemState?.voting_open ? 'text-emerald' : 'text-red-400'}`}>
                {systemState?.voting_open ? 'OPEN' : 'CLOSED'}
              </div>
              {systemState?.voting_closed_at && (
                <p className="text-sm text-gray-400 mt-2">
                  Closed: {formatDate(systemState.voting_closed_at)}
                </p>
              )}
            </div>
            <div>
              <p className="text-gray-400 mb-2">Results Status</p>
              <div className={`text-3xl font-bold ${systemState?.results_released ? 'text-emerald' : 'text-gold'}`}>
                {systemState?.results_released ? 'RELEASED' : 'PENDING'}
              </div>
              {systemState?.results_released_at && (
                <p className="text-sm text-gray-400 mt-2">
                  Released: {formatDate(systemState.results_released_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action 1: Close Voting */}
        <div className="glass-effect-strong rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-white">Step 1: Close Voting</h3>
              <p className="text-gray-300 mb-4">
                Once all voters have cast their votes, close the voting session to prevent any new votes from being submitted.
              </p>
              <ul className="text-sm text-gray-400 space-y-1 mb-4">
                <li>• No new votes can be submitted after closing</li>
                <li>• This action is irreversible</li>
                <li>• Required before releasing results</li>
              </ul>
            </div>
            <div className="ml-6">
              <button
                onClick={handleCloseVoting}
                disabled={!systemState?.voting_open || actionInProgress}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[200px]"
              >
                {actionInProgress ? 'Processing...' : systemState?.voting_open ? 'Close Voting' : 'Already Closed'}
              </button>
            </div>
          </div>
        </div>

        {/* Action 2: Release Results */}
        <div className="glass-effect-strong rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-white">Step 2: Release Results</h3>
              <p className="text-gray-300 mb-4">
                Calculate final results using the conflict resolution algorithm and make them visible to all users.
              </p>
              <ul className="text-sm text-gray-400 space-y-1 mb-4">
                <li>• Automatically resolves conflicts if a candidate wins multiple positions</li>
                <li>• Results become publicly visible</li>
                <li>• Can only be done after voting is closed</li>
              </ul>
            </div>
            <div className="ml-6">
              <button
                onClick={handleReleaseResults}
                disabled={systemState?.voting_open || systemState?.results_released || actionInProgress}
                className="bg-gradient-to-r from-emerald to-emerald-light hover:from-emerald-dark hover:to-emerald text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[200px] emerald-glow"
              >
                {actionInProgress ? 'Processing...' : systemState?.results_released ? 'Already Released' : 'Release Results'}
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="glass-effect rounded-2xl p-6 border border-gold/30">
          <h4 className="font-semibold text-gold mb-2">Important Notes</h4>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Ensure all voters have completed voting before closing</li>
            <li>• Check the Voters page to see who hasn't voted yet</li>
            <li>• The conflict resolution algorithm will automatically assign positions to prevent one candidate from winning multiple roles</li>
            <li>• Once results are released, they can be viewed at <a href="/results" className="text-emerald hover:underline">/results</a></li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/admin/voters')}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Check Voter Status
          </button>
          <button
            onClick={() => router.push('/admin/votes')}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            View Vote Breakdown
          </button>
          <button
            onClick={() => router.push('/results')}
            className="flex-1 bg-gradient-to-r from-gold to-gold-light text-black font-semibold py-3 px-6 rounded-lg transition-all"
          >
            View Public Results
          </button>
        </div>

        {/* DANGER ZONE - Restart Voting */}
        <div className="glass-effect-strong rounded-2xl p-6 border-2 border-red-600/50 bg-red-900/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-red-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>DANGER ZONE: Restart Voting</span>
              </h3>
              <p className="text-gray-300 mb-4">
                Use this button if errors occurred during testing or if you need to completely reset the voting system.
              </p>
              <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 mb-4">
                <p className="text-red-300 font-semibold mb-2">This will:</p>
                <ul className="text-sm text-red-200 space-y-1">
                  <li>• <strong>DELETE ALL VOTES</strong> permanently</li>
                  <li>• Reset all voters to "not voted" status</li>
                  <li>• Clear all results</li>
                  <li>• Reopen voting</li>
                  <li>• Clear device hashes</li>
                </ul>
              </div>
              <p className="text-yellow-400 text-sm font-semibold">
                ⚠️ This action requires multiple confirmations and cannot be undone!
              </p>
            </div>
            <div className="ml-6">
              <button
                onClick={handleRestartVoting}
                disabled={actionInProgress}
                className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[200px] shadow-lg shadow-red-900/50 border-2 border-red-500"
              >
                {actionInProgress ? 'Processing...' : '🔄 Restart Voting'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
