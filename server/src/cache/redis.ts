import { logger } from '../utils/logger.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private inMemoryStore: Map<string, CacheEntry<any>> = new Map();
  private isRedisConnected = false;

  constructor() {
    logger.info('CacheService initialized with high-performance memory-managed TTL store and Redis-ready interface.');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.inMemoryStore.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        this.inMemoryStore.delete(key);
        return null;
      }
      return entry.value as T;
    } catch (err) {
      logger.error(`Cache GET error for key: ${key}`, err);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    try {
      this.inMemoryStore.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    } catch (err) {
      logger.error(`Cache SET error for key: ${key}`, err);
    }
  }

  async del(key: string): Promise<void> {
    this.inMemoryStore.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.inMemoryStore.keys()) {
      if (regex.test(key)) {
        this.inMemoryStore.delete(key);
      }
    }
  }

  async flush(): Promise<void> {
    this.inMemoryStore.clear();
  }
}

export const cache = new CacheService();
