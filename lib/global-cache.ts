/**
 * SHAMIKH LUXURY OS — Global Edge Caching & Cache Invalidation Engine
 * Adds tag-based cache grouping, edge invalidation triggers, and purging listeners.
 */

import { redisCache } from './redis-cache';
import { eventBus } from './event-bus';

class ShamakhGlobalCache {
  // Local tag mapping for when Redis is operating in mock mode
  private localTags = new Map<string, Set<string>>();

  constructor() {
    this.registerEventBusListeners();
  }

  /**
   * Store a value in the cache and associate it with one or more tags.
   */
  async setTagged(
    key: string,
    value: any,
    ttlSeconds: number,
    tags: string[]
  ): Promise<boolean> {
    const success = await redisCache.set(key, value, ttlSeconds);
    if (!success) return false;

    // Associate key with tags
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const client = (redisCache as any).client;
      const isConnected = (redisCache as any).isConnected;

      if (isConnected && client) {
        try {
          await client.sadd(tagKey, key);
          await client.expire(tagKey, ttlSeconds + 3600); // Tag mapping persists slightly longer than data
        } catch (err: any) {
          console.warn('[GLOBAL CACHE] Redis SADD failed for tag:', tag, err.message);
        }
      } else {
        let keys = this.localTags.get(tagKey);
        if (!keys) {
          keys = new Set();
          this.localTags.set(tagKey, keys);
        }
        keys.add(key);
      }
    }

    return true;
  }

  /**
   * Invalidate all cache entries associated with a specific tag.
   */
  async invalidateTag(tag: string): Promise<boolean> {
    const tagKey = `tag:${tag}`;
    const client = (redisCache as any).client;
    const isConnected = (redisCache as any).isConnected;

    console.info(`[GLOBAL CACHE] Invalidating all cache keys tagged with: "${tag}"`);

    if (isConnected && client) {
      try {
        const keys = await client.smembers(tagKey);
        if (keys && keys.length > 0) {
          // Delete all cached keys associated with the tag
          await client.del(...keys);
        }
        // Delete the tag list itself
        await client.del(tagKey);
        return true;
      } catch (err: any) {
        console.warn('[GLOBAL CACHE] Redis tag invalidation failed:', tag, err.message);
        return false;
      }
    } else {
      const keys = this.localTags.get(tagKey);
      if (keys) {
        keys.forEach(key => redisCache.invalidate(key));
        this.localTags.delete(tagKey);
      }
      return true;
    }
  }

  /**
   * Helper to build optimal headers for Vercel/Cloudflare edge CDN routing.
   */
  getCDNHeaders(sMaxAge = 60, staleWhileRevalidate = 120): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
      'CDN-Cache-Control': `max-age=${sMaxAge * 2}`,
      'Cloudflare-CDN-Cache-Control': `max-age=${sMaxAge * 5}`,
    };
  }

  /**
   * Register automatic invalidation hook listeners on the central EventBus.
   */
  private registerEventBusListeners(): void {
    // Automatically purge product-related caches when inventory updates or reviews are posted
    eventBus.on('INVENTORY_LOW', async (event) => {
      const payload = event.payload as any;
      if (payload && payload.productId) {
        await this.invalidateTag(`product:${payload.productId}`);
        await this.invalidateTag('catalog');
      }
    });

    eventBus.on('ORDER_CREATED', async (event) => {
      const payload = event.payload as any;
      if (payload && payload.items) {
        for (const item of payload.items) {
          await this.invalidateTag(`product:${item.id}`);
        }
      }
      await this.invalidateTag('catalog');
    });
  }
}

export const globalCache = new ShamakhGlobalCache();
