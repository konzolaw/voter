import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, getPositionDisplayName } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=15');

  const cached = memoryCache.get<any>('stats');
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    // Run all 4 queries in parallel via Promise.all
    const [allowedVotersRes, votedVotersRes, positionsRes, votesRes] = await Promise.all([
      supabaseAdmin
        .from('voters')
        .select('id', { count: 'exact', head: true })
        .eq('allowed', true),
      supabaseAdmin
        .from('voters')
        .select('id', { count: 'exact', head: true })
        .eq('has_voted', true),
      supabaseAdmin
        .from('positions')
        .select('id, name')
        .order('id', { ascending: true }),
      supabaseAdmin
        .from('votes')
        .select('position_id, candidate:candidates(full_name)'),
    ]);

    if (allowedVotersRes.error) throw allowedVotersRes.error;
    if (votedVotersRes.error) throw votedVotersRes.error;
    if (positionsRes.error) throw positionsRes.error;
    if (votesRes.error) throw votesRes.error;

    const total = allowedVotersRes.count || 0;
    const voted = votedVotersRes.count || 0;
    const pending = total - voted;
    const turnout = total > 0 ? Math.round((voted / total) * 10000) / 100 : 0;

    const positions = positionsRes.data || [];
    const votes = votesRes.data || [];

    // Aggregate votes by position
    const positionBreakdown = positions.map((pos) => {
      const tally: Record<string, number> = {};
      votes.forEach((v: any) => {
        if (v.position_id === pos.id && v.candidate?.full_name) {
          tally[v.candidate.full_name] = (tally[v.candidate.full_name] || 0) + 1;
        }
      });

      const sortedVotes = Object.entries(tally)
        .map(([candidateName, count]) => ({
          candidate__full_name: candidateName,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        position: getPositionDisplayName(pos.name),
        votes: sortedVotes,
      };
    });

    const result = {
      total_voters: total,
      voted_count: voted,
      pending_count: pending,
      turnout_percentage: turnout,
      position_breakdown: positionBreakdown,
    };

    memoryCache.set('stats', result, 10);

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in stats endpoint:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

