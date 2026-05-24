/**
 * SHAMIKH LUXURY OS — High-Speed Redis Caching Wrapper
 * Implements cache-aside, automatic ttl expirations, invalidations,
 * and high-fidelity local memory mocks when Redis is disconnected.
 */

import IORedis from 'ioredis';

class ShamakhRedisCache {
  private client: IORedis | null = null;
  private isConnected = false;
  private localCache = new Map<string, { value: string; expiresAt: number }>();

  constructor() {
    const url = process.env.REDIS_URL || '';
    if (url && !url.includes('placeholder')) {
      try {
        this.client = new IORedis(url, {
          maxRetriesPerRequest: 3,
          connectTimeout: 5000,
        });

        this.client.on('connect', () => {
          this.isConnected = true;
          console.info('[SHAMIKH CACHE] Redis client connected successfully.');
        });

        this.client.on('error', (err: any) => {
          this.isConnected = false;
          console.warn('[SHAMIKH CACHE] Redis error reported, switching to in-process memory cache:', err.message);
        });
      } catch (e: any) {
        console.error('[SHAMIKH CACHE] Failed to initialize IORedis client:', e.message);
      }
    }
  }

  /**
   * Fetch item from cache, or retrieve from data function and store (Cache-Aside pattern)
   */
  async getOrStore<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Retrieve from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(key);
        if (raw) {
          return JSON.parse(raw) as T;
        }
      } catch (err: any) {
        console.warn(`[SHAMIKH CACHE] Redis GET failed for key: ${key}`, err.message);
      }
    }

    // ─── MOCK / FALLBACK MODE ─────────────────────────────────────────
    const local = this.localCache.get(key);
    if (local) {
      if (Date.now() < local.expiresAt) {
        return JSON.parse(local.value) as T;
      } else {
        this.localCache.delete(key); // TTL expired
      }
    }

    return null;
  }

  /**
   * Save to cache
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
    const raw = JSON.stringify(value);

    if (this.isConnected && this.client) {
      try {
        await this.client.setex(key, ttlSeconds, raw);
        return true;
      } catch (err: any) {
        console.warn(`[SHAMIKH CACHE] Redis SET failed for key: ${key}`, err.message);
      }
    }

    // ─── MOCK / FALLBACK MODE ─────────────────────────────────────────
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.localCache.set(key, { value: raw, expiresAt });
    return true;
  }

  /**
   * Invalidate cache for a specific key
   */
  async invalidate(key: string): Promise<boolean> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return true;
      } catch (err: any) {
        console.warn(`[SHAMIKH CACHE] Redis DEL failed for key: ${key}`, err.message);
      }
    }

    // ─── MOCK / FALLBACK MODE ─────────────────────────────────────────
    return this.localCache.delete(key);
  }
}

export const redisCache = new ShamakhRedisCache();
