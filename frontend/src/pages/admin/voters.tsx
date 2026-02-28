import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Voter {
  id: number;
  full_name: string;
  first_name: string;
  allowed: boolean;
  has_voted: boolean;
  voted_at: string | null;
  device_hash: string | null;
}

export default function VotersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [filter, setFilter] = useState<'all' | 'voted' | 'pending'>('all');

  useEffect(() => {
    loadVoters();
  }, []);

  const loadVoters = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/voters/', {
        credentials: 'include',
      });
      const data = await response.json();
      setVoters(data);
    } catch (err) {
      console.error('Failed to load voters:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVoters = voters.filter((v) => {
    if (filter === 'voted') return v.has_voted;
    if (filter === 'pending') return !v.has_voted;
    return true;
  });

  if (loading) {
    return (
      <AdminLayout title="Voters">
        <div className="flex justify-center items-center h-64">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Registered Voters">
      <div className="glass-effect-strong rounded-2xl p-6">
        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gold text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            All ({voters.length})
          </button>
          <button
            onClick={() => setFilter('voted')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'voted'
                ? 'bg-emerald text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Voted ({voters.filter((v) => v.has_voted).length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-red-600 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Pending ({voters.filter((v) => !v.has_voted).length})
          </button>
        </div>

        {/* Voters Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gold font-semibold">#</th>
                <th className="text-left py-3 px-4 text-gold font-semibold">Full Name</th>
                <th className="text-left py-3 px-4 text-gold font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-gold font-semibold">Voted At</th>
              </tr>
            </thead>
            <tbody>
              {filteredVoters.map((voter, index) => (
                <tr key={voter.id} className="border-b border-gray-800 hover:bg-white/5">
                  <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                  <td className="py-3 px-4 text-white font-medium">{voter.full_name}</td>
                  <td className="py-3 px-4">
                    {voter.has_voted ? (
                      <span className="bg-emerald/20 text-emerald px-3 py-1 rounded-full text-sm font-semibold">
                        Voted
                      </span>
                    ) : (
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-semibold">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {voter.voted_at ? formatDate(voter.voted_at) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVoters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No voters found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
