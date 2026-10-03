import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Check system state
    const { data: state, error: stateErr } = await supabaseAdmin
      .from('system_state')
      .select('voting_open, results_released')
      .eq('id', 1)
      .maybeSingle();

    if (stateErr || !state) {
      return res.status(500).json({ error: 'Failed to retrieve system state' });
    }

    if (state.voting_open) {
      return res.status(400).json({ error: 'Cannot release results while voting is still open' });
    }

    if (state.results_released) {
      return res.status(400).json({ error: 'Results have already been released' });
    }

    // 2. Clear previous final results
    await supabaseAdmin.from('final_results').delete().neq('id', 0);

    // 3. Fetch all positions and votes
    const { data: positions, error: posErr } = await supabaseAdmin
      .from('positions')
      .select('id, name')
      .order('id', { ascending: true });

    if (posErr || !positions) {
      return res.status(500).json({ error: 'Failed to fetch positions' });
    }

    const { data: votes, error: votesErr } = await supabaseAdmin
      .from('votes')
      .select('position_id, candidate_id');

    if (votesErr) {
      return res.status(500).json({ error: votesErr.message });
    }

    // 4. Calculate vote counts per candidate per position
    const positionResults: Record<number, { candidate_id: number; count: number }[]> = {};
    for (const pos of positions) {
      const tally: Record<number, number> = {};
      (votes || []).forEach((v) => {
        if (v.position_id === pos.id) {
          tally[v.candidate_id] = (tally[v.candidate_id] || 0) + 1;
        }
      });

      const sortedResults = Object.entries(tally)
        .map(([cId, count]) => ({ candidate_id: Number(cId), count }))
        .sort((a, b) => b.count - a.count);

      positionResults[pos.id] = sortedResults;
    }

    // 5. Conflict resolution algorithm
    // Calculate margin of victory for each position
    const positionPriority: { pos_id: number; diff: number }[] = [];
    for (const [posIdStr, results] of Object.entries(positionResults)) {
      const posId = Number(posIdStr);
      let diff = 0;
      if (results.length >= 2) {
        diff = results[0].count - results[1].count;
      } else if (results.length === 1) {
        diff = results[0].count;
      }
      positionPriority.push({ pos_id: posId, diff });
    }

    // Sort by highest vote difference to prioritize strongest wins
    positionPriority.sort((a, b) => b.diff - a.diff);

    // Assign winners, avoiding duplicate winners across positions
    const winners: Record<number, { candidate_id: number; count: number }> = {};
    const assignedCandidates = new Set<number>();

    for (const { pos_id } of positionPriority) {
      const results = positionResults[pos_id] || [];
      for (const resItem of results) {
        if (!assignedCandidates.has(resItem.candidate_id)) {
          winners[pos_id] = { candidate_id: resItem.candidate_id, count: resItem.count };
          assignedCandidates.add(resItem.candidate_id);
          break;
        }
      }
    }

    // 6. Save final results to database
    const finalResultRecords = Object.entries(winners).map(([posIdStr, winnerInfo]) => ({
      position_id: Number(posIdStr),
      winner_id: winnerInfo.candidate_id,
      vote_count: winnerInfo.count,
    }));

    if (finalResultRecords.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('final_results')
        .insert(finalResultRecords);

      if (insertErr) {
        return res.status(500).json({ error: `Failed to save final results: ${insertErr.message}` });
      }
    }

    // 7. Update system state
    const releasedAt = new Date().toISOString();
    await supabaseAdmin
      .from('system_state')
      .update({
        results_released: true,
        results_released_at: releasedAt,
      })
      .eq('id', 1);

    memoryCache.invalidate('results');
    memoryCache.invalidate('system_state');

    return res.status(200).json({
      success: true,
      message: 'Results have been released',
      released_at: releasedAt,
      results_released: true,
    });
  } catch (err: any) {
    console.error('Error releasing results:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
