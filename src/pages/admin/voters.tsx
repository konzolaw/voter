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

  // Instant synchronous cache retrieval
  const cachedVoters = apiClient.getCached<Voter[]>('voters');

  const [loading, setLoading] = useState(() => !cachedVoters);
  const [voters, setVoters] = useState<Voter[]>(() => cachedVoters || []);
  const [filter, setFilter] = useState<'all' | 'voted' | 'pending'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVoterName, setNewVoterName] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [editName, setEditName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadVoters();
  }, []);

  const loadVoters = async () => {
    try {
      if (!voters.length) setLoading(true);
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

  const handleStartEdit = (voter: Voter) => {
    setEditingVoter(voter);
    setEditName(voter.full_name);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoter || !editName.trim()) return;

    setUpdating(true);
    try {
      await apiClient.updateVoter(editingVoter.id, editName.trim());
      setEditingVoter(null);
      await loadVoters();
      alert('Voter updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update voter');
    } finally {
      setUpdating(false);
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
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div>
            <h2 className="font-syne text-xl font-bold text-white tracking-tight">Voter Directory</h2>
            <p className="text-xs text-titanium-light mt-0.5">Manage squad operatives authorized to cast ballots</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="tap-effect h-11 px-5 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-gold/20 flex items-center gap-2"
          >
            <span>{showAddForm ? 'Close Form' : '+ Add New Operative'}</span>
          </button>
        </div>

        {/* Add Voter Form */}
        {showAddForm && (
          <div className="rounded-2xl p-5 mb-6 bg-white/[0.03] border border-white/10">
            <h3 className="font-syne text-sm font-bold text-gold uppercase tracking-wider mb-3">Register New Voter</h3>
            <form onSubmit={handleAddVoter} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newVoterName}
                onChange={(e) => setNewVoterName(e.target.value)}
                placeholder="Enter full name (e.g. John Doe)"
                className="flex-1 h-12 px-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm"
                disabled={adding}
              />
              <button
                type="submit"
                disabled={adding || !newVoterName.trim()}
                className="tap-effect h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-canvas font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
              >
                {adding ? 'Saving...' : 'Confirm Register'}
              </button>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`tap-effect px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              filter === 'all'
                ? 'bg-white/15 text-white border border-white/20'
                : 'text-titanium hover:text-white hover:bg-white/5'
            }`}
          >
            All Operatives ({voters.length})
          </button>
          <button
            onClick={() => setFilter('voted')}
            className={`tap-effect px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              filter === 'voted'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-titanium hover:text-white hover:bg-white/5'
            }`}
          >
            Voted ({voters.filter((v) => v.has_voted).length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`tap-effect px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              filter === 'pending'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-titanium hover:text-white hover:bg-white/5'
            }`}
          >
            Pending ({voters.filter((v) => !v.has_voted).length})
          </button>
        </div>

        {/* Voters Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold text-titanium uppercase tracking-wider">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Operative Name</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredVoters.map((voter, index) => (
                <tr key={voter.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-xs text-titanium font-mono">{index + 1}</td>
                  <td className="py-3 px-4 text-white font-medium">{voter.full_name}</td>
                  <td className="py-3 px-4">
                    {voter.has_voted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Ballot Cast</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-titanium font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-titanium-dark" />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-titanium font-mono">
                    {voter.voted_at ? formatDate(voter.voted_at) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(voter)}
                        className="tap-effect text-xs text-gold hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-all"
                      >
                        Edit
                      </button>
                      {!voter.has_voted && (
                        <button
                          onClick={() => handleRemoveVoter(voter)}
                          className="tap-effect text-xs text-rose-400 hover:text-rose-200 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVoters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs text-titanium uppercase tracking-widest">No matching operatives found</p>
          </div>
        )}
      </div>

      {/* Edit Voter Modal */}
      {editingVoter && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/15 shadow-2xl">
            <h3 className="font-syne text-xl font-bold text-white mb-1">Edit Operative Record</h3>
            <p className="text-xs text-titanium-light mb-5">Update voter name as recognized in the system</p>
            <form onSubmit={handleSaveEdit}>
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-titanium-light mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm"
                  disabled={updating}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingVoter(null)}
                  className="tap-effect h-11 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !editName.trim()}
                  className="tap-effect h-11 px-6 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold/20 transition-all disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
