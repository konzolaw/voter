import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  const isForceFresh = req.query.fresh === '1';
  if (!isForceFresh) {
    const cached = memoryCache.get<any>('system_state');
    if (cached) {
      return res.status(200).json(cached);
    }
  }


  try {
    const { data: state, error } = await supabaseAdmin
      .from('system_state')
      .select('voting_open, results_released, voting_closed_at, results_released_at')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const result = state || {
      voting_open: true,
      results_released: false,
      voting_closed_at: null,
      results_released_at: null,
    };

    memoryCache.set('system_state', result, 15);

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error fetching system state:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

