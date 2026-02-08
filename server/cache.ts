interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new MemoryCache();

export const CACHE_KEYS = {
  CATALOG_ITEMS: "catalog_items",
  POT_TYPES: "pot_types",
  DECORATION_TYPES: "decoration_types",
  ACTIVE_POTS: "active_pots",
  ALL_POTS: "all_pots",
  SETTINGS: "settings",
  SHIPPING_TYPES: "shipping_types",
  PAYMENT_TYPES: "payment_types",
  DASHBOARD_STATS: "dashboard_stats",
} as const;

export const CACHE_TTL = {
  SHORT: 30,
  MEDIUM: 120,
  LONG: 300,
} as const;
