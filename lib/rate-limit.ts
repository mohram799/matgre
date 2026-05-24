/**
 * SHAMIKH LUXURY OS — Rate Limiter (Sliding Window Algorithm)
 * Protects login, checkout, admin, and scraper routes.
 */

type RequestRecord = {
  timestamp: number;
};

// In-memory store (use Redis in distributed multi-instance production)
const store = new Map<string, RequestRecord[]>();

// Cleanup task to prevent memory leaks by removing old records (older than 1 hour)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    store.forEach((records, key) => {
      const filtered = records.filter(r => now - r.timestamp < 3600000);
      if (filtered.length === 0) {
        store.delete(key);
      } else {
        store.set(key, filtered);
      }
    });
  }, 300000); // every 5 minutes
}

/**
 * Sliding window rate limiting check
 */
export function rateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const requests = store.get(ip) || [];

  // Filter out requests older than the sliding window
  const filtered = requests.filter(r => now - r.timestamp < windowMs);

  if (filtered.length >= limit) {
    return false;
  }

  filtered.push({ timestamp: now });
  store.set(ip, filtered);
  return true;
}

/**
 * Helper to extract client IP from headers
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('cf-connecting-ip') ??
    '0.0.0.0'
  );
}

/**
 * Preset configuration mapping
 */
const PRESETS = {
  AUTH: { limit: 10, windowMs: 900000 },       // 10 requests / 15 minutes
  CHECKOUT: { limit: 5, windowMs: 60000 },      // 5 requests / 1 minute
  SCRAPER: { limit: 3, windowMs: 60000 },       // 3 requests / 1 minute
  ADMIN: { limit: 30, windowMs: 60000 },        // 30 requests / 1 minute
  API: { limit: 100, windowMs: 60000 },         // 100 requests / 1 minute
} as const;

export type RateLimitPreset = keyof typeof PRESETS;

/**
 * Route-level wrapper to easily apply rate limiting in Next.js endpoints
 */
export function applyRateLimit(
  request: Request,
  route: string,
  preset: RateLimitPreset = 'API'
): Response | null {
  const ip = getClientIp(request);
  const key = `${route}:${ip}`;
  const config = PRESETS[preset];
  
  const allowed = rateLimit(key, config.limit, config.windowMs);
  
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'تم تجاوز الحد الأقصى للمحاولات المقبولة. يرجى الانتظار والمحاولة لاحقاً.'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(config.windowMs / 1000))
        }
      }
    );
  }
  
  return null;
}
