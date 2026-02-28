import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/api';
import { SystemState, VotingStats } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [stats, setStats] = useState<VotingStats | null>(null);
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
      setError('Failed to load dashboard data');
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
    <AdminLayout title="Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status Card */}
        <div className="glass-effect-strong rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-gold">System Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Voting Status:</span>
              <span className={`font-bold text-lg ${systemState?.voting_open ? 'text-emerald' : 'text-red-400'}`}>
                {systemState?.voting_open ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Results Status:</span>
              <span className={`font-bold text-lg ${systemState?.results_released ? 'text-emerald' : 'text-gold'}`}>
                {systemState?.results_released ? 'RELEASED' : 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="glass-effect-strong rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-gold">Voting Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Voters:</span>
              <span className="text-white font-bold text-lg">{stats?.total_voters}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Votes Cast:</span>
              <span className="text-emerald font-bold text-lg">{stats?.voted_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Pending:</span>
              <span className="text-gold font-bold text-lg">{stats?.pending_count}</span>
            </div>
          </div>
        </div>

        {/* Turnout Card */}
        <div className="glass-effect-strong rounded-2xl p-6 md:col-span-2">
          <h3 className="text-xl font-semibold mb-4 text-gold">Voter Turnout</h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300">Progress:</span>
            <span className="text-white font-bold text-2xl">{stats?.turnout_percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-6">
            <div
              className="bg-gradient-to-r from-gold to-emerald h-6 rounded-full transition-all duration-500 flex items-center justify-center"
              style={{ width: `${stats?.turnout_percentage || 0}%` }}
            >
              {stats && stats.turnout_percentage > 10 && (
                <span className="text-black font-semibold text-sm">{stats.turnout_percentage}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-effect-strong rounded-2xl p-6 md:col-span-2">
          <h3 className="text-xl font-semibold mb-4 text-gold">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/voters')}
              className="bg-gradient-to-r from-emerald to-emerald-light hover:from-emerald-dark hover:to-emerald text-white font-bold py-4 px-6 rounded-lg transition-all"
            >
              View Voters
            </button>
            <button
              onClick={() => router.push('/admin/votes')}
              className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black font-bold py-4 px-6 rounded-lg transition-all"
            >
              View Votes
            </button>
            <button
              onClick={() => router.push('/admin/control')}
              className="bg-gradient-to-r from-emerald to-emerald-light hover:from-emerald-dark hover:to-emerald text-white font-bold py-4 px-6 rounded-lg transition-all"
            >
              Control Panel
            </button>
            <button
              onClick={() => loadData()}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
