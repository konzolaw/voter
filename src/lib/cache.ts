// In-memory server-side high performance cache
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const store = new Map<string, CacheEntry<any>>();

export const memoryCache = {
  get<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      store.delete(key);
      return null;
    }
    return entry.data as T;
  },

  set<T>(key: string, data: T, ttlSeconds: number = 30): void {
    store.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  },

  invalidate(prefixOrKey?: string): void {
    if (!prefixOrKey) {
      store.clear();
      return;
    }
    for (const key of store.keys()) {
      if (key.startsWith(prefixOrKey)) {
        store.delete(key);
      }
    }
  },
};
