import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const candidateId = Number(id);

  if (!candidateId || isNaN(candidateId)) {
    return res.status(400).json({ error: 'Invalid candidate ID' });
  }

  try {
    const fullName = (req.body?.full_name || '').trim();
    const positionIds: number[] | undefined = req.body?.position_ids;

    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    // Check if candidate exists
    const { data: candidate, error: fetchErr } = await supabaseAdmin
      .from('candidates')
      .select('id, full_name')
      .eq('id', candidateId)
      .maybeSingle();

    if (fetchErr || !candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Update candidate full_name
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('candidates')
      .update({
        full_name: fullName,
      })
      .eq('id', candidateId)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    // If position_ids is provided, update candidate_positions mapping
    if (Array.isArray(positionIds)) {
      // 1. Delete existing associations
      const { error: delErr } = await supabaseAdmin
        .from('candidate_positions')
        .delete()
        .eq('candidate_id', candidateId);

      if (delErr) {
        console.error('Error clearing old candidate positions:', delErr);
      }

      // 2. Insert new associations
      if (positionIds.length > 0) {
        const rowsToInsert = positionIds.map((pId) => ({
          candidate_id: candidateId,
          position_id: pId,
        }));

        const { error: insErr } = await supabaseAdmin
          .from('candidate_positions')
          .insert(rowsToInsert);

        if (insErr) {
          console.error('Error inserting candidate positions:', insErr);
          return res.status(500).json({ error: insErr.message });
        }
      }
    }

    memoryCache.invalidate('candidates');
    memoryCache.invalidate('stats');

    return res.status(200).json({
      success: true,
      message: `Candidate updated successfully`,
      candidate: updated,
    });

  } catch (err: any) {
    console.error('Error updating candidate:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

