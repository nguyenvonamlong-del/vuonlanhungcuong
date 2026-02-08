import { Redis } from "@upstash/redis";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface ICacheAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttlSeconds: number): void;
  invalidate(key: string): void;
  invalidatePattern(pattern: string): void;
  clear(): void;
}

class MemoryCache implements ICacheAdapter {
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
    const keys = Array.from(this.store.keys());
    for (const key of keys) {
      if (key.startsWith(pattern)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

class RedisBackedCache implements ICacheAdapter {
  private memory = new MemoryCache();
  private redis: Redis;
  private prefix = "orchid:";

  private connected = false;

  constructor(redis: Redis) {
    this.redis = redis;
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    try {
      await this.redis.ping();
      this.connected = true;
      console.log("[cache] Redis connection verified");
      const allKeys = Object.values(CACHE_KEYS);
      for (const key of allKeys) {
        const data = await this.redis.get<string>(this.prefix + key);
        if (data) {
          const parsed = typeof data === "string" ? JSON.parse(data) : data;
          this.memory.set(key, parsed, CACHE_TTL.MEDIUM);
        }
      }
      console.log("[cache] Warmed up from Redis successfully");
    } catch (err) {
      this.connected = false;
      console.warn("[cache] Redis connection failed, using in-memory only:", (err as Error).message);
    }
  }

  get<T>(key: string): T | null {
    const memResult = this.memory.get<T>(key);
    if (memResult !== null) return memResult;

    if (this.connected) {
      this.redis.get<string>(this.prefix + key).then((data) => {
        if (data) {
          const parsed = typeof data === "string" ? JSON.parse(data) : data;
          this.memory.set(key, parsed, CACHE_TTL.MEDIUM);
        }
      }).catch(() => {});
    }

    return null;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.memory.set(key, data, ttlSeconds);
    if (this.connected) {
      this.redis.set(this.prefix + key, JSON.stringify(data), { ex: ttlSeconds }).catch((err) => {
        console.warn("[cache] Redis set failed:", (err as Error).message);
      });
    }
  }

  invalidate(key: string): void {
    this.memory.invalidate(key);
    if (this.connected) {
      this.redis.del(this.prefix + key).catch(() => {});
    }
  }

  invalidatePattern(pattern: string): void {
    this.memory.invalidatePattern(pattern);
    if (this.connected) {
      this.redis.keys(this.prefix + pattern + "*").then((keys) => {
        if (keys.length > 0) {
          this.redis.del(...keys).catch(() => {});
        }
      }).catch(() => {});
    }
  }

  clear(): void {
    this.memory.clear();
    if (this.connected) {
      this.redis.keys(this.prefix + "*").then((keys) => {
        if (keys.length > 0) {
          this.redis.del(...keys).catch(() => {});
        }
      }).catch(() => {});
    }
  }
}

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

function createCache(): ICacheAdapter {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const redis = new Redis({ url, token });
      console.log("[cache] Using Redis-backed cache (Upstash)");
      return new RedisBackedCache(redis);
    } catch (err) {
      console.warn("[cache] Redis init failed, falling back to in-memory:", (err as Error).message);
    }
  }

  console.log("[cache] Using in-memory cache");
  return new MemoryCache();
}

export const cache = createCache();
