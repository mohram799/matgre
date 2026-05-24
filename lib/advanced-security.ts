/**
 * SHAMIKH LUXURY OS — Advanced Security & Anti-Fraud Engine
 * Implements token replay checks, geolocation cross-checking, 
 * device fingerprint validations, and secure header builders.
 */

import { getClientIp } from './rate-limit';

interface SecurityEvaluationInput {
  request: Request;
  phone: string;
  action: 'checkout' | 'login' | 'payment';
  clientTimezone?: string;
  deviceFingerprint?: string;
  orderAmount?: number;
}

interface SecurityResult {
  riskScore: number;
  shouldBlock: boolean;
  requiresMfa: boolean;
  reasons: string[];
}

// In-memory token store to prevent replay attacks (Redis fallback)
const seenTokens = new Set<string>();

/**
 * Checks if a token/nonce has been reused within a replay window.
 */
export function isReplayAttack(token: string): boolean {
  if (!token) return true;
  if (seenTokens.has(token)) {
    return true; // Replay detected!
  }
  seenTokens.add(token);
  // Keep store size bounded
  if (seenTokens.size > 5000) {
    const first = Array.from(seenTokens)[0];
    seenTokens.delete(first);
  }
  return false;
}

/**
 * Core Geolocation & Fingerprint Validation Engine
 */
export function evaluateAdvancedSecurity(input: SecurityEvaluationInput): SecurityResult {
  const reasons: string[] = [];
  let riskScore = 0;

  const ip = getClientIp(input.request);
  const ua = input.request.headers.get('user-agent') || '';
  const country = input.request.headers.get('cf-ipcountry') || input.request.headers.get('x-vercel-ip-country') || '';

  // 1. Geolocation anomaly check
  if (country && input.clientTimezone) {
    const tzLower = input.clientTimezone.toLowerCase();
    
    // Anomaly: Client timezone indicates Gulf, but IP country is outside GCC/Egypt region
    const isArabRegion = ['sa', 'eg', 'ae', 'kw', 'qa', 'bh', 'om'].includes(country.toLowerCase());
    const isArabTz = tzLower.includes('riyadh') || tzLower.includes('cairo') || tzLower.includes('dubai') || tzLower.includes('asia/') || tzLower.includes('africa/cairo');
    
    if (isArabTz && !isArabRegion) {
      reasons.push(`Geolocation anomaly: Timezone (${input.clientTimezone}) does not match IP Country (${country})`);
      riskScore += 35;
    }
  }

  // 2. High-value transaction without device fingerprinting
  if (input.action === 'checkout' && (input.orderAmount ?? 0) > 10000 && !input.deviceFingerprint) {
    reasons.push('High-value luxury checkout attempted without device fingerprint telemetry');
    riskScore += 25;
  }

  // 3. User agent spoofing check
  if (ua.toLowerCase().includes('mozilla') && ua.length < 30) {
    reasons.push('Suspicious or truncated browser user agent signature');
    riskScore += 40;
  }

  const normalizedScore = Math.min(riskScore, 100);

  return {
    riskScore: normalizedScore,
    shouldBlock: normalizedScore >= 80,
    requiresMfa: normalizedScore >= 50,
    reasons,
  };
}

/**
 * Enterprise Content Security Policy (CSP) & Secure Headers Builder
 */
export function getSecureHeaders(): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production';

  const cspRules = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://images.unsplash.com https://images.ae.com https://*.supabase.co",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co ws: wss: localhost:*",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    isProduction ? "upgrade-insecure-requests" : "",
  ].filter(Boolean).join('; ');

  return {
    'Content-Security-Policy': cspRules,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}
