import axios from 'axios';
import { Position, Candidate, Vote, SystemState, FinalResult, VotingStats } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Client-side in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const clientCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export function getCached<T>(key: string): T | null {
  const entry = clientCache.get(key);
  if (!entry) return null;
  return entry.data as T;
}

export function hasCached(key: string): boolean {
  return clientCache.has(key);
}

export function invalidateClientCache(prefixOrKey?: string): void {
  if (!prefixOrKey) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    if (key.startsWith(prefixOrKey)) {
      clientCache.delete(key);
    }
  }
}

async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 30000
): Promise<T> {
  const cached = clientCache.get(key);
  const now = Date.now();

  // If cache is fresh, return immediately (0ms!)
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  // If we have stale cache, return it immediately and revalidate in background
  if (cached) {
    if (!inFlightRequests.has(key)) {
      const revalidatePromise = fetcher()
        .then((fresh) => {
          clientCache.set(key, { data: fresh, timestamp: Date.now() });
          return fresh;
        })
        .catch((err) => {
          console.warn(`Background revalidation failed for ${key}:`, err);
          return cached.data;
        })
        .finally(() => {
          inFlightRequests.delete(key);
        });
      inFlightRequests.set(key, revalidatePromise);
    }
    return cached.data;
  }

  // In-flight request deduplication
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  const promise = fetcher()
    .then((data) => {
      clientCache.set(key, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
}

export const apiClient = {
  // Synchronous cache inspection for instant initial page rendering
  getCached: <T>(key: string): T | null => getCached<T>(key),
  hasCached: (key: string): boolean => hasCached(key),
  invalidateCache: (prefixOrKey?: string) => invalidateClientCache(prefixOrKey),

  // Background prefetcher for common data
  prefetchCommon: async () => {
    try {
      await Promise.allSettled([
        apiClient.getPositions(),
        apiClient.getCandidates(),
        apiClient.getSystemState(),
      ]);
    } catch {
      // Ignore prefetch failures
    }
  },

  // Public endpoints
  getPositions: async (): Promise<Position[]> => {
    return cachedFetch('positions', async () => {
      const response = await api.get('/positions');
      return response.data;
    }, 60000); // 60s cache
  },

  getCandidates: async (): Promise<Candidate[]> => {
    return cachedFetch('candidates', async () => {
      const response = await api.get('/candidates');
      return response.data;
    }, 60000); // 60s cache
  },

  verifyVoter: async (fullName: string, deviceHash: string) => {
    const response = await api.post('/verify-voter', {
      full_name: fullName,
      device_hash: deviceHash,
    });
    return response.data;
  },

  submitVotes: async (fullName: string, deviceHash: string, votes: Vote[]) => {
    const response = await api.post('/submit-votes', {
      full_name: fullName,
      device_hash: deviceHash,
      votes: votes,
    });
    // Invalidate stats, results, and voters on vote submission
    invalidateClientCache('stats');
    invalidateClientCache('results');
    invalidateClientCache('voters');
    return response.data;
  },

  getSystemState: async (forceFresh = false): Promise<SystemState> => {
    if (forceFresh) {
      invalidateClientCache('system_state');
      const response = await api.get('/system-state?fresh=1');
      clientCache.set('system_state', { data: response.data, timestamp: Date.now() });
      return response.data;
    }
    return cachedFetch('system_state', async () => {
      const response = await api.get('/system-state');
      return response.data;
    }, 5000); // 5s cache
  },

  getResults: async () => {
    return cachedFetch('results', async () => {
      const response = await api.get('/results');
      return response.data;
    }, 15000); // 15s cache
  },

  // Admin endpoints
  closeVoting: async () => {
    const response = await api.post('/close-voting');
    invalidateClientCache('system_state');
    invalidateClientCache('stats');
    return response.data;
  },

  restartVoting: async () => {
    const response = await api.post('/restart-voting');
    invalidateClientCache(); // clear everything on system reset
    return response.data;
  },

  releaseResults: async () => {
    const response = await api.post('/release-results');
    invalidateClientCache('system_state');
    invalidateClientCache('results');
    return response.data;
  },

  getStats: async (): Promise<VotingStats> => {
    return cachedFetch('stats', async () => {
      const response = await api.get('/stats');
      return response.data;
    }, 8000); // 8s cache
  },

  getVoters: async () => {
    return cachedFetch('voters', async () => {
      const response = await api.get('/voters');
      return response.data;
    }, 30000); // 30s cache
  },

  addVoter: async (fullName: string) => {
    const response = await api.post('/voters/add', {
      full_name: fullName,
    });
    invalidateClientCache('voters');
    invalidateClientCache('stats');
    return response.data;
  },

  removeVoter: async (voterId: number) => {
    const response = await api.delete(`/voters/${voterId}/remove`);
    invalidateClientCache('voters');
    invalidateClientCache('stats');
    return response.data;
  },

  updateVoter: async (voterId: number, fullName: string) => {
    const response = await api.put(`/voters/${voterId}/update`, {
      full_name: fullName,
    });
    invalidateClientCache('voters');
    return response.data;
  },

  addCandidate: async (fullName: string) => {
    const response = await api.post('/candidates/add', {
      full_name: fullName,
    });
    invalidateClientCache('candidates');
    invalidateClientCache('stats');
    return response.data;
  },

  updateCandidate: async (candidateId: number, fullName: string, positionIds?: number[]) => {
    const response = await api.put(`/candidates/${candidateId}/update`, {
      full_name: fullName,
      position_ids: positionIds,
    });
    invalidateClientCache('candidates');
    invalidateClientCache('stats');
    return response.data;
  },

  removeCandidate: async (candidateId: number) => {
    const response = await api.delete(`/candidates/${candidateId}/remove`);
    invalidateClientCache('candidates');
    invalidateClientCache('stats');
    return response.data;
  },

  addPosition: async (title: string, description: string) => {
    const response = await api.post('/positions/add', {
      title,
      description,
    });
    invalidateClientCache('positions');
    invalidateClientCache('candidates');
    invalidateClientCache('stats');
    return response.data;
  },

  updatePosition: async (positionId: number, title: string, description: string) => {
    const response = await api.put(`/positions/${positionId}/update`, {
      title,
      description,
    });
    invalidateClientCache('positions');
    invalidateClientCache('candidates');
    invalidateClientCache('stats');
    return response.data;
  },

  removePosition: async (positionId: number) => {
    const response = await api.delete(`/positions/${positionId}/remove`);
    invalidateClientCache('positions');
    invalidateClientCache('candidates');
    invalidateClientCache('stats');
    return response.data;
  },
};

export default api;

