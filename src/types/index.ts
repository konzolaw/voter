export interface Position {
  id: number;
  name: string;
  display_name: string;
  description: string;
  created_at: string;
}

export interface Candidate {
  id: number;
  full_name: string;
  image: string | null;
  eligible: boolean;
  positions: Position[];
  created_at: string;
}

export interface Voter {
  id: number;
  full_name: string;
  first_name: string;
  allowed: boolean;
  has_voted: boolean;
  device_hash: string | null;
  voted_at: string | null;
}

export interface Vote {
  position_id: number;
  candidate_id: number;
}

export interface SystemState {
  voting_open: boolean;
  results_released: boolean;
  voting_closed_at: string | null;
  results_released_at: string | null;
}

export interface FinalResult {
  id: number;
  position: Position;
  winner: Candidate;
  vote_count: number;
  resolved_at: string;
}

export interface VotingStats {
  total_voters: number;
  voted_count: number;
  pending_count: number;
  turnout_percentage: number;
  position_breakdown: {
    position: string;
    votes: {
      candidate__full_name: string;
      count: number;
    }[];
  }[];
}
