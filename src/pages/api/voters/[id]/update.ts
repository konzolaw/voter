import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const voterId = Number(id);

  if (!voterId || isNaN(voterId)) {
    return res.status(400).json({ error: 'Invalid voter ID' });
  }

  try {
    const fullName = (req.body?.full_name || '').trim();

    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const firstName = fullName.split(/\s+/)[0].trim();
    const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    // Check if voter exists
    const { data: voter, error: fetchErr } = await supabaseAdmin
      .from('voters')
      .select('id, full_name')
      .eq('id', voterId)
      .maybeSingle();

    if (fetchErr || !voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    // Update voter
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('voters')
      .update({
        full_name: fullName,
        first_name: capitalizedFirstName,
      })
      .eq('id', voterId)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    memoryCache.invalidate('voters');

    return res.status(200).json({
      success: true,
      message: `Voter updated to ${fullName}`,
      voter: updated,
    });

  } catch (err: any) {
    console.error('Error updating voter:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
