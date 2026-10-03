import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, getPositionDisplayName } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const fullName = (req.body?.full_name || '').trim();

    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    // Check duplicate
    const { data: existing } = await supabaseAdmin
      .from('candidates')
      .select('id')
      .ilike('full_name', fullName)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Candidate with this name already exists' });
    }

    // Create candidate
    const { data: candidate, error: insertError } = await supabaseAdmin
      .from('candidates')
      .insert({ full_name: fullName, eligible: true })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    // Associate with all positions
    const { data: positions } = await supabaseAdmin.from('positions').select('id, name, description, created_at');
    if (positions && positions.length > 0) {
      const cpInserts = positions.map((p) => ({
        candidate_id: candidate.id,
        position_id: p.id,
      }));
      await supabaseAdmin.from('candidate_positions').insert(cpInserts);
    }

    memoryCache.invalidate('candidates');
    memoryCache.invalidate('stats');

    return res.status(201).json({
      id: candidate.id,
      full_name: candidate.full_name,
      image: candidate.image_url || null,
      eligible: candidate.eligible,
      positions: (positions || []).map((p) => ({
        ...p,
        display_name: getPositionDisplayName(p.name),
      })),
      created_at: candidate.created_at,
    });

  } catch (err: any) {
    console.error('Error adding candidate:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
