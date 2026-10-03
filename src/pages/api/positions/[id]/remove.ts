import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const positionId = Number(id);

  if (!positionId || isNaN(positionId)) {
    return res.status(400).json({ error: 'Invalid position ID' });
  }

  try {
    // Check if position has received votes
    const { count, error: voteCountErr } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('position_id', positionId);

    if (voteCountErr) {
      return res.status(500).json({ error: voteCountErr.message });
    }

    if (count && count > 0) {
      return res.status(400).json({ error: 'Cannot delete position that has recorded votes' });
    }

    // Delete position (cascades to candidate_positions)
    const { error: deleteErr } = await supabaseAdmin
      .from('positions')
      .delete()
      .eq('id', positionId);

    if (deleteErr) {
      return res.status(500).json({ error: deleteErr.message });
    }

    memoryCache.invalidate('positions');
    memoryCache.invalidate('candidates');
    memoryCache.invalidate('stats');

    return res.status(200).json({
      success: true,
      message: 'Position deleted successfully',
    });

  } catch (err: any) {
    console.error('Error removing position:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
