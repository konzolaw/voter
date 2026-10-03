import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');

  const cached = memoryCache.get<any[]>('voters');
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    const { data: voters, error } = await supabaseAdmin
      .from('voters')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const result = voters || [];
    memoryCache.set('voters', result, 60);

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error fetching voters:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

