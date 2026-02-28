import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { VotingStats } from '@/types';

export default function VotesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VotingStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/stats/', {
        credentials: 'include',
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Vote Breakdown">
        <div className="flex justify-center items-center h-64">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Vote Breakdown by Position">
      <div className="space-y-6">
        {stats?.position_breakdown.map((position, idx) => (
          <div key={idx} className="glass-effect-strong rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-4 text-gold">{position.position}</h3>
            
            {position.votes.length > 0 ? (
              <div className="space-y-4">
                {position.votes.map((vote, vIdx) => {
                  const maxVotes = Math.max(...position.votes.map((v) => v.count));
                  const percentage = (vote.count / maxVotes) * 100;
                  
                  return (
                    <div key={vIdx} className="glass-effect rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold text-lg">
                          {vote.candidate__full_name}
                        </span>
                        <span className="text-emerald font-bold text-2xl">
                          {vote.count} {vote.count === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-gold to-emerald h-4 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No votes cast yet for this position</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={loadStats}
          className="bg-gradient-to-r from-gold to-gold-light text-black font-bold py-3 px-8 rounded-lg transition-all hover:scale-105"
        >
          Refresh Data
        </button>
      </div>
    </AdminLayout>
  );
}
