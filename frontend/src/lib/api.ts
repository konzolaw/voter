import axios from 'axios';
import { Position, Candidate, Vote, SystemState, FinalResult, VotingStats } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const apiClient = {
  // Public endpoints
  getPositions: async (): Promise<Position[]> => {
    const response = await api.get('/positions/');
    return response.data;
  },

  getCandidates: async (): Promise<Candidate[]> => {
    const response = await api.get('/candidates/');
    return response.data;
  },

  verifyVoter: async (fullName: string, deviceHash: string) => {
    const response = await api.post('/verify-voter/', {
      full_name: fullName,
      device_hash: deviceHash,
    });
    return response.data;
  },

  submitVotes: async (fullName: string, deviceHash: string, votes: Vote[]) => {
    const response = await api.post('/submit-votes/', {
      full_name: fullName,
      device_hash: deviceHash,
      votes: votes,
    });
    return response.data;
  },

  getSystemState: async (): Promise<SystemState> => {
    const response = await api.get('/system-state/');
    return response.data;
  },

  getResults: async () => {
    const response = await api.get('/results/');
    return response.data;
  },

  // Admin endpoints
  closeVoting: async () => {
    const response = await api.post('/close-voting/');
    return response.data;
  },

  releaseResults: async () => {
    const response = await api.post('/release-results/');
    return response.data;
  },

  getStats: async (): Promise<VotingStats> => {
    const response = await api.get('/stats/');
    return response.data;
  },

  getVoters: async () => {
    const response = await api.get('/voters/');
    return response.data;
  },

  addVoter: async (fullName: string) => {
    const response = await api.post('/voters/add/', {
      full_name: fullName,
    });
    return response.data;
  },

  removeVoter: async (voterId: number) => {
    const response = await api.delete(`/voters/${voterId}/remove/`);
    return response.data;
  },
};

export default api;
