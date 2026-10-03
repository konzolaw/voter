import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Count votes before deleting
    const { count: voteCount } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact', head: true });

    // 2. Delete all votes
    await supabaseAdmin.from('votes').delete().neq('id', 0);

    // 3. Delete all final results
    await supabaseAdmin.from('final_results').delete().neq('id', 0);

    // 4. Count voters to reset
    const { count: voterCount } = await supabaseAdmin
      .from('voters')
      .select('id', { count: 'exact', head: true })
      .eq('has_voted', true);

    // 5. Reset all voters
    await supabaseAdmin
      .from('voters')
      .update({
        has_voted: false,
        voted_at: null,
        device_hash: null,
      })
      .neq('id', 0);

    // 6. Reset system state
    await supabaseAdmin
      .from('system_state')
      .update({
        voting_open: true,
        results_released: false,
        voting_closed_at: null,
        results_released_at: null,
      })
      .eq('id', 1);

    memoryCache.invalidate(); // Clear all caches

    return res.status(200).json({
      success: true,
      message: 'Voting system has been restarted',
      votes_deleted: voteCount || 0,
      voters_reset: voterCount || 0,
    });

  } catch (err: any) {
    console.error('Error restarting voting:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
