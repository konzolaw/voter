import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, getPositionDisplayName } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');

  const cached = memoryCache.get<any>('results');
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    // 1. Check system state
    const { data: state, error: stateErr } = await supabaseAdmin
      .from('system_state')
      .select('results_released')
      .eq('id', 1)
      .maybeSingle();

    if (stateErr || !state?.results_released) {
      const pendingResult = {
        released: false,
        message: 'Results have not been released yet',
      };
      memoryCache.set('results', pendingResult, 10);
      return res.status(200).json(pendingResult);
    }

    // 2. Fetch final results with position and candidate joins
    const { data: results, error: resErr } = await supabaseAdmin
      .from('final_results')
      .select(`
        id,
        vote_count,
        resolved_at,
        position:positions(*),
        winner:candidates(*)
      `)
      .order('position_id', { ascending: true });

    if (resErr) {
      return res.status(500).json({ error: resErr.message });
    }

    const formattedResults = (results || []).map((r: any) => ({
      id: r.id,
      position: r.position
        ? {
            ...r.position,
            display_name: getPositionDisplayName(r.position.name),
          }
        : null,
      winner: r.winner
        ? {
            id: r.winner.id,
            full_name: r.winner.full_name,
            image: r.winner.image_url || null,
            eligible: r.winner.eligible,
          }
        : null,
      vote_count: r.vote_count,
      resolved_at: r.resolved_at,
    }));

    const finalResult = {
      released: true,
      results: formattedResults,
    };

    memoryCache.set('results', finalResult, 60);

    return res.status(200).json(finalResult);
  } catch (err: any) {
    console.error('Error fetching results:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

