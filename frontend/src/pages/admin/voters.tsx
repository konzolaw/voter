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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVoterName, setNewVoterName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadVoters();
  }, []);

  const loadVoters = async () => {
    try {
      const response = await apiClient.getVoters();
      setVoters(response);
    } catch (err) {
      console.error('Failed to load voters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoterName.trim()) return;

    setAdding(true);
    try {
      await apiClient.addVoter(newVoterName.trim());
      setNewVoterName('');
      setShowAddForm(false);
      await loadVoters();
      alert('Voter added successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add voter');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveVoter = async (voter: Voter) => {
    if (voter.has_voted) {
      alert('Cannot delete voter who has already voted');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${voter.full_name}?`)) {
      return;
    }

    try {
      await apiClient.removeVoter(voter.id);
      await loadVoters();
      alert('Voter removed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove voter');
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
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gold">Voter Management</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gold hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg transition-all"
          >
            {showAddForm ? 'Cancel' : '+ Add Voter'}
          </button>
        </div>

        {/* Add Voter Form */}
        {showAddForm && (
          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <form onSubmit={handleAddVoter} className="flex gap-4">
              <input
                type="text"
                value={newVoterName}
                onChange={(e) => setNewVoterName(e.target.value)}
                placeholder="Enter full name (e.g., John Doe)"
                className="flex-1 bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                disabled={adding}
              />
              <button
                type="submit"
                disabled={adding || !newVoterName.trim()}
                className="bg-emerald hover:bg-green-600 text-white font-bold py-2 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>
        )}

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
                <th className="text-left py-3 px-4 text-gold font-semibold">Actions</th>
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
                  <td className="py-3 px-4">
                    {!voter.has_voted && (
                      <button
                        onClick={() => handleRemoveVoter(voter)}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1 px-4 rounded transition-all"
                      >
                        Remove
                      </button>
                    )}
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
