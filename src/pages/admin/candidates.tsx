import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/api';
import { Candidate, Position } from '@/types';

export default function CandidatesPage() {
  // Instant synchronous cache retrieval
  const cachedCandidates = apiClient.getCached<Candidate[]>('candidates');
  const cachedPositions = apiClient.getCached<Position[]>('positions');

  const [candidates, setCandidates] = useState<Candidate[]>(() => cachedCandidates || []);
  const [positions, setPositions] = useState<Position[]>(() => cachedPositions || []);
  const [loading, setLoading] = useState(() => !cachedCandidates || !cachedPositions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state (Candidate name & contesting roles)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!candidates.length) setLoading(true);
      const [candidatesData, positionsData] = await Promise.all([
        apiClient.getCandidates(),
        apiClient.getPositions(),
      ]);
      setCandidates(candidatesData);
      setPositions(positionsData);
    } catch (err) {
      console.error('Failed to load candidates and positions:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;

    setAdding(true);
    try {
      await apiClient.addCandidate(newCandidateName.trim());
      setNewCandidateName('');
      setShowAddForm(false);
      await loadData();
      alert('Candidate registered successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add candidate');
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setEditName(candidate.full_name);
    // Extract currently associated position IDs
    const currentPosIds = (candidate.positions || []).map((p) => p.id);
    setSelectedPositionIds(currentPosIds);
  };

  const togglePosition = (posId: number) => {
    setSelectedPositionIds((prev) =>
      prev.includes(posId) ? prev.filter((id) => id !== posId) : [...prev, posId]
    );
  };

  const selectAllPositions = () => {
    setSelectedPositionIds(positions.map((p) => p.id));
  };

  const clearAllPositions = () => {
    setSelectedPositionIds([]);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate || !editName.trim()) return;

    setUpdating(true);
    try {
      await apiClient.updateCandidate(
        editingCandidate.id,
        editName.trim(),
        selectedPositionIds
      );
      setEditingCandidate(null);
      await loadData();
      alert(`Updated ${editName.trim()} and their contesting roles successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update candidate');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveCandidate = async (candidate: Candidate) => {
    if (!confirm(`Are you sure you want to remove candidate "${candidate.full_name}"?`)) {
      return;
    }

    try {
      await apiClient.removeCandidate(candidate.id);
      await loadData();
      alert('Candidate removed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove candidate');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Candidates">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold mb-4"></div>
            <p className="font-outfit text-xs tracking-widest uppercase text-titanium">Loading candidates &amp; roles...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Candidate Management">
      <div className="glass-panel rounded-3xl p-5 sm:p-8 border border-white/10 shadow-2xl">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div>
            <h2 className="font-syne text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Contesting Candidates &amp; Roles
            </h2>
            <p className="text-xs text-titanium-light mt-1">
              Configure candidate identities and authorize the exact offices each candidate can contest for ({candidates.length} Registered)
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="tap-effect h-12 px-6 rounded-2xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-gold/20 flex items-center gap-2 shrink-0"
          >
            <span>{showAddForm ? 'Close Form' : '+ Add New Candidate'}</span>
          </button>
        </div>

        {/* Add Candidate Form */}
        {showAddForm && (
          <div className="rounded-2xl p-5 mb-6 bg-white/[0.03] border border-white/10 animate-fade-in">
            <h3 className="font-syne text-sm font-bold text-gold uppercase tracking-wider mb-2">Register Contesting Candidate</h3>
            <p className="text-xs text-titanium-light mb-4">Enter candidate name. By default, new candidates are linked to active positions and can be customized below.</p>
            <form onSubmit={handleAddCandidate} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                placeholder="Enter candidate full name (e.g. John Doe)"
                className="flex-1 h-12 px-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm"
                disabled={adding}
                autoFocus
              />
              <button
                type="submit"
                disabled={adding || !newCandidateName.trim()}
                className="tap-effect h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-canvas font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
              >
                {adding ? 'Adding...' : 'Register Candidate'}
              </button>
            </form>
          </div>
        )}

        {/* Candidates Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold text-titanium uppercase tracking-wider">
                <th className="py-4 px-4">#</th>
                <th className="py-4 px-4">Candidate Name</th>
                <th className="py-4 px-4">Contesting Positions</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {candidates.map((candidate, index) => {
                const candPositions = candidate.positions || [];
                const isAllRoles = candPositions.length === positions.length;

                return (
                  <tr key={candidate.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-xs text-titanium font-mono">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center font-syne font-bold text-xs text-gold">
                          {candidate.full_name.charAt(0)}
                        </div>
                        <span className="text-white font-bold text-base tracking-tight">{candidate.full_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {isAllRoles ? (
                          <span className="text-xs text-gold font-semibold flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                            <span>Contesting All {positions.length} Offices</span>
                          </span>
                        ) : candPositions.length > 0 ? (
                          candPositions.map((p) => {
                            const isLead =
                              p.name?.toLowerCase() === 'team_lead' ||
                              p.display_name?.toLowerCase().trim() === 'team lead';

                            return (
                              <span
                                key={p.id}
                                className={`text-[10px] font-outfit font-semibold px-2 py-0.5 rounded-md border ${
                                  isLead
                                    ? 'bg-gold/15 border-gold/40 text-gold'
                                    : 'bg-white/[0.04] border-white/10 text-titanium-light'
                                }`}
                              >
                                {p.display_name}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-rose-400 italic font-medium">
                            No roles authorized (Inactive)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Certified Candidate</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(candidate)}
                          className="tap-effect text-xs text-gold hover:text-white px-3 py-1.5 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/30 transition-all font-semibold flex items-center gap-1.5"
                          title="Edit name and configure roles"
                        >
                          <span>Edit Roles</span>
                          <span>✎</span>
                        </button>
                        <button
                          onClick={() => handleRemoveCandidate(candidate)}
                          className="tap-effect text-xs text-rose-400 hover:text-rose-200 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {candidates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs text-titanium uppercase tracking-widest">No candidates registered</p>
          </div>
        )}
      </div>

      {/* Edit Candidate & Contesting Positions Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4 z-50 animate-fade-in">
          <div className="glass-panel rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-white/15 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="mb-4 pb-3 border-b border-white/5 shrink-0">
              <h3 className="font-syne font-black text-xl sm:text-2xl text-white tracking-tight uppercase">
                Authorize Candidate Roles
              </h3>
              <p className="text-xs text-titanium-light mt-0.5">
                Toggle the exact positions <strong className="text-gold">{editingCandidate.full_name}</strong> is authorized to contest for on the ballot.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0">
              <div className="mb-4 shrink-0">
                <label className="block text-[11px] font-outfit font-bold uppercase tracking-wider text-titanium-light mb-1.5">
                  Candidate Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm font-medium"
                  disabled={updating}
                  autoFocus
                />
              </div>

              {/* Positions Selection Grid */}
              <div className="flex-1 min-h-0 flex flex-col mb-4">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <span className="text-[11px] font-outfit font-bold uppercase tracking-wider text-gold">
                    Authorized Offices ({selectedPositionIds.length} of {positions.length})
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllPositions}
                      className="text-[10px] text-titanium hover:text-white uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-titanium/40 text-[10px]">&bull;</span>
                    <button
                      type="button"
                      onClick={clearAllPositions}
                      className="text-[10px] text-titanium hover:text-white uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                  {positions.map((pos) => {
                    const isSelected = selectedPositionIds.includes(pos.id);
                    const isLead =
                      pos.name?.toLowerCase() === 'team_lead' ||
                      pos.display_name?.toLowerCase().trim() === 'team lead';

                    return (
                      <div
                        key={pos.id}
                        onClick={() => togglePosition(pos.id)}
                        className={`tap-effect p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? isLead
                              ? 'bg-gold/15 border-gold/45 shadow-sm shadow-gold/10'
                              : 'bg-white/[0.06] border-gold/40'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className={`text-[10px] font-outfit uppercase tracking-widest block font-bold ${
                            isLead ? 'text-gold' : 'text-titanium-light'
                          }`}>
                            {isLead ? '★ Supreme Office' : `Position ${pos.id}`}
                          </span>
                          <span className="font-outfit font-semibold text-xs sm:text-sm text-white tracking-tight block truncate mt-0.5">
                            {pos.display_name}
                          </span>
                        </div>

                        {/* Checkbox indicator */}
                        <div className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-gold border-gold text-canvas' : 'border-white/20'
                        }`}>
                          {isSelected && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="tap-effect h-12 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !editName.trim()}
                  className="tap-effect h-12 px-6 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Candidate &amp; Roles</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
