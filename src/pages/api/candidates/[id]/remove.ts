import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const candidateId = Number(id);

  if (!candidateId || isNaN(candidateId)) {
    return res.status(400).json({ error: 'Invalid candidate ID' });
  }

  try {
    // Check if candidate exists
    const { data: candidate, error: fetchErr } = await supabaseAdmin
      .from('candidates')
      .select('id, full_name')
      .eq('id', candidateId)
      .maybeSingle();

    if (fetchErr || !candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Check if candidate has received votes
    const { count, error: voteCountErr } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('candidate_id', candidateId);

    if (voteCountErr) {
      return res.status(500).json({ error: voteCountErr.message });
    }

    if (count && count > 0) {
      return res.status(400).json({ error: 'Cannot delete candidate who has received votes' });
    }

    // Delete candidate
    const { error: deleteErr } = await supabaseAdmin
      .from('candidates')
      .delete()
      .eq('id', candidateId);

    if (deleteErr) {
      return res.status(500).json({ error: deleteErr.message });
    }

    memoryCache.invalidate('candidates');
    memoryCache.invalidate('stats');

    return res.status(200).json({
      message: `Candidate ${candidate.full_name} removed successfully`,
    });

  } catch (err: any) {
    console.error('Error removing candidate:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
