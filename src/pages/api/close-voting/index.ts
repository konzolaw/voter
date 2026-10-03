import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: state, error: fetchErr } = await supabaseAdmin
      .from('system_state')
      .select('voting_open')
      .eq('id', 1)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({ error: fetchErr.message });
    }

    if (state && !state.voting_open) {
      return res.status(400).json({ error: 'Voting is already closed' });
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from('system_state')
      .update({
        voting_open: false,
        voting_closed_at: now,
      })
      .eq('id', 1);

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    memoryCache.invalidate('system_state');
    memoryCache.invalidate('stats');

    return res.status(200).json({
      success: true,
      message: 'Voting has been closed',
      closed_at: now,
      voting_open: false,
    });

  } catch (err: any) {
    console.error('Error closing voting:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
