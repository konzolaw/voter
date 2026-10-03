import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Server-side Supabase client for API routes (uses Service Role Key to bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Position code to human-readable title mapping
export const POSITION_DISPLAY_NAMES: Record<string, string> = {
  team_lead: 'Team Lead',
  program_coordinator: 'Program Coordinator',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  events_coordinator: 'Events Coordinator',
  welfare: 'Welfare Lead',
  logistics_and_equipment_custodian: 'Logistics & Equipment Custodian',
};

export function getPositionDisplayName(name: string): string {
  return POSITION_DISPLAY_NAMES[name] || name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
