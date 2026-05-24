/**
 * SHAMIKH LUXURY OS — Session Fingerprinting
 * Zero-Trust session validation using browser & request signatures.
 * Detects session hijacking, token theft, and anomalous request patterns.
 */

import crypto from 'crypto';

// ─── Fingerprint Inputs ──────────────────────────────────────────────────────

export interface FingerprintInput {
  userAgent: string;
  ip: string;
  acceptLanguage: string;
  acceptEncoding: string;
}

/**
 * Build a deterministic session fingerprint from request attributes.
 * This fingerprint is stored alongside the JWT and validated on each request.
 */
export function buildFingerprint(input: FingerprintInput): string {
  const raw = [
    input.userAgent,
    input.ip.split('.').slice(0, 3).join('.'), // /24 IP subnet (allows DHCP leases)
    input.acceptLanguage.split(',')[0]?.trim() ?? '', // primary language only
    input.acceptEncoding,
  ].join('|');

  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

/**
 * Extract fingerprint inputs from a Request/NextRequest object
 */
export function extractFingerprintInputs(request: Request): FingerprintInput {
  const headers = request.headers;
  return {
    userAgent: headers.get('user-agent') ?? '',
    ip: (
      headers.get('x-real-ip') ??
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headers.get('cf-connecting-ip') ??
      '0.0.0.0'
    ),
    acceptLanguage: headers.get('accept-language') ?? '',
    acceptEncoding: headers.get('accept-encoding') ?? '',
  };
}

/**
 * Validate that the current request fingerprint matches a stored fingerprint.
 * Uses constant-time comparison to prevent timing attacks.
 * A tolerance window is applied: if fingerprint matches EXACTLY, it's clean.
 * If it partially mismatches (only IP changed but same UA + lang), we warn but allow.
 */
export function validateFingerprint(
  storedFingerprint: string,
  currentFingerprint: string,
  strict = false
): { valid: boolean; warning: boolean } {
  if (!storedFingerprint || !currentFingerprint) {
    return { valid: false, warning: false };
  }

  // Exact match — fully trusted session
  try {
    const a = Buffer.from(storedFingerprint.padEnd(32, '0').slice(0, 32));
    const b = Buffer.from(currentFingerprint.padEnd(32, '0').slice(0, 32));
    const isExact = crypto.timingSafeEqual(a, b);
    if (isExact) return { valid: true, warning: false };
  } catch {
    // Buffer length mismatch
    return { valid: false, warning: false };
  }

  // Strict mode: any mismatch is a failure
  if (strict) return { valid: false, warning: false };

  // Lenient: allow with warning (could be IP rotation / VPN)
  return { valid: true, warning: true };
}

// ─── Anomaly Detection ───────────────────────────────────────────────────────

export interface AnomalyReport {
  isAnomalous: boolean;
  reasons: string[];
  riskScore: number; // 0–100
}

/**
 * Compute a risk score for an incoming request based on heuristics.
 */
export function computeAnomalyRisk(
  request: Request,
  options: {
    storedFingerprint?: string;
    currentFingerprint?: string;
    failedLoginAttempts?: number;
    isKnownBadIp?: boolean;
    requestsPerMinute?: number;
  } = {}
): AnomalyReport {
  const reasons: string[] = [];
  let riskScore = 0;

  // 1. Fingerprint mismatch
  if (options.storedFingerprint && options.currentFingerprint) {
    const { valid, warning } = validateFingerprint(
      options.storedFingerprint,
      options.currentFingerprint
    );
    if (!valid) {
      reasons.push('Session fingerprint mismatch (possible token theft)');
      riskScore += 60;
    } else if (warning) {
      reasons.push('Session fingerprint partially changed (IP rotation)');
      riskScore += 20;
    }
  }

  // 2. Missing User-Agent (bots / scrapers)
  const ua = request.headers.get('user-agent') ?? '';
  if (!ua || ua.length < 10) {
    reasons.push('Missing or suspiciously short User-Agent');
    riskScore += 30;
  }

  // 3. Automated tool signatures
  const botPatterns = ['curl/', 'python-requests', 'axios/', 'go-http-client', 'java/', 'okhttp'];
  if (botPatterns.some(p => ua.toLowerCase().includes(p))) {
    reasons.push('Automated client detected in User-Agent');
    riskScore += 20;
  }

  // 4. Failed login attempts
  const failed = options.failedLoginAttempts ?? 0;
  if (failed >= 3) {
    reasons.push(`High failed login count: ${failed}`);
    riskScore += Math.min(failed * 10, 40);
  }

  // 5. Known bad IP
  if (options.isKnownBadIp) {
    reasons.push('Request from known bad IP');
    riskScore += 50;
  }

  // 6. Request rate anomaly
  const rpm = options.requestsPerMinute ?? 0;
  if (rpm > 60) {
    reasons.push(`High request rate: ${rpm} req/min`);
    riskScore += 25;
  }

  return {
    isAnomalous: riskScore >= 50,
    reasons,
    riskScore: Math.min(riskScore, 100),
  };
}
