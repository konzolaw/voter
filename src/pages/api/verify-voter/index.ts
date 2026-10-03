import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const fullName = (req.body?.full_name || '').trim();
    const deviceHash = req.body?.device_hash || '';

    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    // 1. Check voting state
    const { data: state, error: stateErr } = await supabaseAdmin
      .from('system_state')
      .select('voting_open')
      .eq('id', 1)
      .maybeSingle();

    if (stateErr || !state?.voting_open) {
      return res.status(403).json({ error: 'Voting is currently closed' });
    }

    // 2. Fetch all voters to perform smart name matching
    const { data: voters, error: votersErr } = await supabaseAdmin
      .from('voters')
      .select('*');

    if (votersErr) {
      return res.status(500).json({ error: votersErr.message });
    }

    const inputNames = fullName.toLowerCase().split(/\s+/).filter(Boolean);
    const matchedVoter = (voters || []).find((v) => {
      const dbNames = new Set(v.full_name.toLowerCase().split(/\s+/).filter(Boolean));
      return inputNames.some((name) => dbNames.has(name));
    });

    if (!matchedVoter) {
      return res.status(404).json({ error: 'You are not registered to vote' });
    }

    if (!matchedVoter.allowed) {
      return res.status(403).json({ error: 'You are not allowed to vote' });
    }

    if (matchedVoter.has_voted) {
      return res.status(403).json({ error: 'You have already voted' });
    }

    if (matchedVoter.device_hash && matchedVoter.device_hash !== deviceHash) {
      return res.status(403).json({ error: 'You must use the same device you started with' });
    }

    return res.status(200).json({
      voter_id: matchedVoter.id,
      full_name: matchedVoter.full_name,
      can_vote: true,
    });
  } catch (err: any) {
    console.error('Error in verify-voter:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
