import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, getPositionDisplayName } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=60');

  const cached = memoryCache.get<any[]>('candidates');
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    // Fetch candidates and associations in parallel
    const [candResult, cpResult] = await Promise.all([
      supabaseAdmin
        .from('candidates')
        .select('*')
        .eq('eligible', true)
        .order('full_name', { ascending: true }),
      supabaseAdmin
        .from('candidate_positions')
        .select('candidate_id, position:positions(*)'),
    ]);

    if (candResult.error) {
      return res.status(500).json({ error: candResult.error.message });
    }

    if (cpResult.error) {
      return res.status(500).json({ error: cpResult.error.message });
    }

    const candidates = candResult.data || [];
    const candidatePositions = cpResult.data || [];

    // Map positions to candidates
    const positionsByCandidate: Record<number, any[]> = {};
    candidatePositions.forEach((item: any) => {
      if (!positionsByCandidate[item.candidate_id]) {
        positionsByCandidate[item.candidate_id] = [];
      }
      if (item.position) {
        positionsByCandidate[item.candidate_id].push({
          ...item.position,
          display_name: getPositionDisplayName(item.position.name),
        });
      }
    });

    const formatted = candidates.map((c) => ({
      id: c.id,
      full_name: c.full_name,
      image: c.image_url || null,
      eligible: c.eligible,
      positions: (positionsByCandidate[c.id] || []).sort((a, b) => a.id - b.id),
      created_at: c.created_at,
    }));

    memoryCache.set('candidates', formatted, 60);

    return res.status(200).json(formatted);
  } catch (err: any) {
    console.error('Error fetching candidates:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
