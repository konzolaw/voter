import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const voterId = Number(id);

  if (!voterId || isNaN(voterId)) {
    return res.status(400).json({ error: 'Invalid voter ID' });
  }

  try {
    const { data: voter, error: fetchErr } = await supabaseAdmin
      .from('voters')
      .select('id, full_name, has_voted')
      .eq('id', voterId)
      .maybeSingle();

    if (fetchErr || !voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    if (voter.has_voted) {
      return res.status(400).json({ error: 'Cannot delete voter who has already voted' });
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('voters')
      .delete()
      .eq('id', voterId);

    if (deleteErr) {
      return res.status(500).json({ error: deleteErr.message });
    }

    memoryCache.invalidate('voters');
    memoryCache.invalidate('stats');

    return res.status(200).json({
      message: `Voter ${voter.full_name} removed successfully`,
    });

  } catch (err: any) {
    console.error('Error removing voter:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
