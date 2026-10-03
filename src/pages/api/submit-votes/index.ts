import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const fullName = (req.body?.full_name || '').trim();
    const deviceHash = req.body?.device_hash || '';
    const votes = req.body?.votes || [];

    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    // 0. Count active positions
    const { count: totalPositions } = await supabaseAdmin
      .from('positions')
      .select('id', { count: 'exact', head: true });

    const requiredCount = totalPositions || 7;
    if (!Array.isArray(votes) || votes.length !== requiredCount) {
      return res.status(400).json({ error: `You must vote for all ${requiredCount} positions` });
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

    // 2. Find voter
    const { data: voters, error: votersErr } = await supabaseAdmin.from('voters').select('*');
    if (votersErr) {
      return res.status(500).json({ error: votersErr.message });
    }

    const inputNames = fullName.toLowerCase().split(/\s+/).filter(Boolean);
    const matchedVoter = (voters || []).find((v) => {
      const dbNames = new Set(v.full_name.toLowerCase().split(/\s+/).filter(Boolean));
      return inputNames.some((name) => dbNames.has(name));
    });

    if (!matchedVoter) {
      return res.status(404).json({ error: 'Voter not found' });
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

    // 3. Validate uniqueness of positions
    const positionIds = new Set<number>();
    for (const v of votes) {
      const posId = Number(v.position_id);
      if (positionIds.has(posId)) {
        return res.status(400).json({ error: 'Duplicate position in votes' });
      }
      positionIds.add(posId);
    }

    // 4. Try atomic RPC function first
    const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('submit_votes_atomic', {
      p_voter_id: matchedVoter.id,
      p_device_hash: deviceHash,
      p_votes: votes,
    });

    if (!rpcErr && rpcResult) {
      if (rpcResult.success) {
        memoryCache.invalidate('stats');
        memoryCache.invalidate('voters');
        memoryCache.invalidate('results');
        return res.status(200).json({
          success: true,
          message: 'Your votes have been recorded successfully',
        });
      } else {
        return res.status(400).json({ error: rpcResult.error || 'Failed to submit votes' });
      }
    }

    // Fallback: direct Supabase insert & update
    const voteRecords = votes.map((v) => ({
      voter_id: matchedVoter.id,
      position_id: Number(v.position_id),
      candidate_id: Number(v.candidate_id),
    }));

    const { error: insertErr } = await supabaseAdmin.from('votes').insert(voteRecords);
    if (insertErr) {
      return res.status(500).json({ error: `Failed to insert votes: ${insertErr.message}` });
    }

    const { error: updateErr } = await supabaseAdmin
      .from('voters')
      .update({
        has_voted: true,
        device_hash: matchedVoter.device_hash || deviceHash,
        voted_at: new Date().toISOString(),
      })
      .eq('id', matchedVoter.id);

    if (updateErr) {
      return res.status(500).json({ error: `Failed to update voter record: ${updateErr.message}` });
    }

    memoryCache.invalidate('stats');
    memoryCache.invalidate('voters');
    memoryCache.invalidate('results');

    return res.status(200).json({
      success: true,
      message: 'Your votes have been recorded successfully',
    });
  } catch (err: any) {

    console.error('Error submitting votes:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
