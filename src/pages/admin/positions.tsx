import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/api';
import { Position } from '@/types';

export default function PositionsPage() {
  // Instant synchronous cache retrieval
  const cachedPositions = apiClient.getCached<Position[]>('positions');

  const [positions, setPositions] = useState<Position[]>(() => cachedPositions || []);
  const [loading, setLoading] = useState(() => !cachedPositions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      if (!positions.length) setLoading(true);
      const data = await apiClient.getPositions();
      setPositions(data);
    } catch (err) {
      console.error('Failed to load positions:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setAdding(true);
    try {
      await apiClient.addPosition(newTitle.trim(), newDescription.trim());
      setNewTitle('');
      setNewDescription('');
      setShowAddForm(false);
      await loadPositions();
      alert('Position added successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add position');
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = (position: Position) => {
    setEditingPosition(position);
    setEditTitle(position.display_name || position.name);
    setEditDescription(position.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosition || !editTitle.trim() || !editDescription.trim()) return;

    setUpdating(true);
    try {
      await apiClient.updatePosition(editingPosition.id, editTitle.trim(), editDescription.trim());
      setEditingPosition(null);
      await loadPositions();
      alert('Position updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update position');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemovePosition = async (position: Position) => {
    if (!confirm(`Are you sure you want to delete position "${position.display_name || position.name}"?`)) {
      return;
    }

    try {
      await apiClient.removePosition(position.id);
      await loadPositions();
      alert('Position deleted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete position');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Positions">
        <div className="flex justify-center items-center h-64">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Position Management">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div>
            <h2 className="font-syne text-xl font-bold text-white tracking-tight">Contested Positions</h2>
            <p className="text-xs text-titanium-light mt-0.5">
              Configure open leadership positions available for voting ({positions.length} Total)
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="tap-effect h-11 px-5 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-canvas font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-gold/20 flex items-center gap-2"
          >
            <span>{showAddForm ? 'Close Form' : '+ Add New Position'}</span>
          </button>
        </div>

        {/* Add Position Form */}
        {showAddForm && (
          <div className="rounded-2xl p-5 mb-6 bg-white/[0.03] border border-white/10">
            <h3 className="font-syne text-sm font-bold text-gold uppercase tracking-wider mb-3">Create Leadership Position</h3>
            <form onSubmit={handleAddPosition} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-titanium-light mb-1.5">
                  Position Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Welfare Lead"
                  className="w-full h-12 px-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm"
                  disabled={adding}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-titanium-light mb-1.5">
                  Responsibilities / Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detailed description of responsibilities for this role..."
                  rows={3}
                  className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm"
                  disabled={adding}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={adding || !newTitle.trim() || !newDescription.trim()}
                  className="tap-effect h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-canvas font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  {adding ? 'Creating...' : 'Create Position'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Positions Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {positions.map((pos, index) => (
            <div
              key={pos.id}
              className="rounded-2xl p-5 bg-white/[0.02] border border-white/10 hover:border-gold/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-semibold text-titanium uppercase tracking-widest">
                    Position {index + 1}
                  </span>
                  <span className="text-[10px] text-gold font-mono uppercase bg-gold/10 px-2 py-0.5 rounded-md">
                    {pos.name}
                  </span>
                </div>
                <h3 className="font-syne text-lg font-bold text-white mb-1.5">
                  {pos.display_name || pos.name}
                </h3>
                <p className="text-titanium-light text-xs leading-relaxed mb-4">
                  {pos.description}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => handleStartEdit(pos)}
                  className="tap-effect text-xs text-gold hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  Edit Role
                </button>
                <button
                  onClick={() => handleRemovePosition(pos)}
                  className="tap-effect text-xs text-rose-400 hover:text-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {positions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs text-titanium uppercase tracking-widest">No positions configured</p>
          </div>
        )}
      </div>

      {/* Edit Position Modal */}
      {editingPosition && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/15 shadow-2xl">
            <h3 className="font-syne text-xl font-bold text-white mb-1">Edit Position Definition</h3>
            <p className="text-xs text-titanium-light mb-5">Update title and role description</p>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-titanium-light mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm"
                  disabled={updating}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-titanium-light mb-1.5">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-titanium focus:outline-none focus:border-gold text-sm"
                  disabled={updating}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPosition(null)}
                  className="tap-effect h-11 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !editTitle.trim() || !editDescription.trim()}
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
