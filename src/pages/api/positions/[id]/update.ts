import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, getPositionDisplayName } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const positionId = Number(id);

  if (!positionId || isNaN(positionId)) {
    return res.status(400).json({ error: 'Invalid position ID' });
  }

  try {
    const description = req.body?.description?.trim();
    const title = req.body?.title?.trim() || req.body?.display_name?.trim();

    const updates: Record<string, any> = {};
    if (description !== undefined && description !== '') updates.description = description;

    if (title) {
      // Update code/name if provided
      const code = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      updates.name = code;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('positions')
      .update(updates)
      .eq('id', positionId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    memoryCache.invalidate('positions');
    memoryCache.invalidate('candidates');
    memoryCache.invalidate('stats');

    return res.status(200).json({
      ...updated,
      display_name: getPositionDisplayName(updated.name),
    });

  } catch (err: any) {
    console.error('Error updating position:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
