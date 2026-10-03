import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
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

    const firstName = fullName.split(/\s+/)[0].trim();
    const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    // Check if voter already exists
    const { data: existing } = await supabaseAdmin
      .from('voters')
      .select('id')
      .or(`first_name.ilike.${capitalizedFirstName},full_name.ilike.${fullName}`)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Voter with this name already exists' });
    }

    const { data: newVoter, error: insertError } = await supabaseAdmin
      .from('voters')
      .insert({
        full_name: fullName,
        first_name: capitalizedFirstName,
        allowed: true,
        has_voted: false,
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    memoryCache.invalidate('voters');
    memoryCache.invalidate('stats');

    return res.status(201).json(newVoter);

  } catch (err: any) {
    console.error('Error adding voter:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
