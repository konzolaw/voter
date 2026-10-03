import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, getPositionDisplayName } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const title = (req.body?.title || req.body?.name || '').trim();
    const description = (req.body?.description || '').trim();

    if (!title) {
      return res.status(400).json({ error: 'Position title is required' });
    }

    if (!description) {
      return res.status(400).json({ error: 'Position description is required' });
    }

    // Generate code/slug
    const code = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Check if code exists
    const { data: existing } = await supabaseAdmin
      .from('positions')
      .select('id')
      .or(`name.eq.${code},description.ilike.${description}`)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Position with this title already exists' });
    }

    // Insert position
    const { data: newPosition, error: insertErr } = await supabaseAdmin
      .from('positions')
      .insert({
        name: code,
        description,
      })
      .select()
      .single();

    if (insertErr) {
      return res.status(500).json({ error: insertErr.message });
    }

    // Associate all existing eligible candidates with this new position
    const { data: candidates } = await supabaseAdmin
      .from('candidates')
      .select('id')
      .eq('eligible', true);

    if (candidates && candidates.length > 0) {
      const links = candidates.map((c) => ({
        candidate_id: c.id,
        position_id: newPosition.id,
      }));
      await supabaseAdmin.from('candidate_positions').insert(links);
    }

    memoryCache.invalidate('positions');
    memoryCache.invalidate('candidates');
    memoryCache.invalidate('stats');

    return res.status(201).json({
      ...newPosition,
      display_name: getPositionDisplayName(newPosition.name),
    });

  } catch (err: any) {
    console.error('Error adding position:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
