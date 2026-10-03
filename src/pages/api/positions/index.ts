import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, getPositionDisplayName } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=60');

  const cached = memoryCache.get<any[]>('positions');
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    const { data: positions, error } = await supabaseAdmin
      .from('positions')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase error fetching positions:', error);
      return res.status(500).json({ error: error.message });
    }

    const formattedPositions = (positions || []).map((pos) => ({
      ...pos,
      display_name: getPositionDisplayName(pos.name),
    }));

    memoryCache.set('positions', formattedPositions, 60);

    return res.status(200).json(formattedPositions);
  } catch (err: any) {
    console.error('Error in positions handler:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
