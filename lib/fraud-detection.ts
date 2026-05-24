/**
 * SHAMIKH LUXURY OS — Fraud Detection Engine
 * Real-time fraud scoring for orders, payments, and account actions.
 * Powered by rule-based heuristics + behavioral signals.
 */

import { getClientIp } from './rate-limit';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FraudCheckInput {
  /** The order or action being evaluated */
  action: 'checkout' | 'login' | 'account_change' | 'coupon_use' | 'bulk_review';
  /** Customer phone number */
  phone: string;
  /** Request object for IP/UA extraction */
  request: Request;
  /** Order amount in SAR */
  orderAmount?: number;
  /** Number of items in cart */
  itemCount?: number;
  /** VIP tier of the customer */
  vipTier?: string;
  /** Whether customer is new (no prior orders) */
  isNewCustomer?: boolean;
  /** Number of orders placed in the last 24 hours */
  recentOrderCount?: number;
  /** Known email/phone variation (multiple accounts with same device) */
  deviceOrderCount?: number;
  /** Has promo code been applied */
  hasCoupon?: boolean;
  /** Shipping country */
  shippingCountry?: string;
  /** Cart contains high-value items */
  hasHighValueItems?: boolean;
}

export interface FraudResult {
  /** 0–100 risk score */
  riskScore: number;
  /** Whether to block this action outright */
  shouldBlock: boolean;
  /** Whether to flag for manual review */
  requiresReview: boolean;
  /** Human-readable reasons for the score */
  reasons: string[];
  /** Suggested action */
  action: 'allow' | 'review' | 'block' | 'challenge';
  /** Timestamp of evaluation */
  evaluatedAt: string;
}

// ─── High-Risk Countries ─────────────────────────────────────────────────────

const HIGH_RISK_COUNTRIES = new Set([
  'Nigeria', 'Ghana', 'Ukraine', 'Russia', 'Belarus', 'Venezuela', 'Iran',
  'North Korea', 'Syria', 'Libya',
]);

// ─── In-Memory Velocity Store (replace with Redis in production) ──────────────

const velocityStore = new Map<string, { count: number; firstSeen: number }>();

function getVelocity(key: string, windowMs = 86400000): number {
  const now = Date.now();
  const entry = velocityStore.get(key);
  if (!entry || now - entry.firstSeen > windowMs) {
    velocityStore.set(key, { count: 1, firstSeen: now });
    return 1;
  }
  entry.count++;
  return entry.count;
}

// ─── Core Fraud Scoring Engine ────────────────────────────────────────────────

export function evaluateFraud(input: FraudCheckInput): FraudResult {
  const reasons: string[] = [];
  let riskScore = 0;

  const ip = getClientIp(input.request);
  const ua = input.request.headers.get('user-agent') ?? '';

  // ── RULE 1: Missing or bot User-Agent ──────────────────────────
  if (!ua || ua.length < 10) {
    reasons.push('Missing or invalid User-Agent');
    riskScore += 35;
  }

  // ── RULE 2: Known automated clients ────────────────────────────
  const botSignatures = ['curl', 'python-requests', 'axios', 'java/', 'go-http', 'httpie'];
  if (botSignatures.some(sig => ua.toLowerCase().includes(sig))) {
    reasons.push('Automated HTTP client detected');
    riskScore += 25;
  }

  // ── RULE 3: New customer, high-value order ──────────────────────
  const amount = input.orderAmount ?? 0;
  if (input.isNewCustomer && amount > 5000) {
    reasons.push(`New customer attempting high-value order (SAR ${amount.toLocaleString()})`);
    riskScore += 30;
  }

  // ── RULE 4: Extremely high order amount ────────────────────────
  if (amount > 50000) {
    reasons.push(`Exceptionally large order amount: SAR ${amount.toLocaleString()}`);
    riskScore += 20;
  }

  // ── RULE 5: High-velocity orders from same phone ───────────────
  const phoneVelocity = getVelocity(`phone:${input.phone}`);
  if (phoneVelocity > 5) {
    reasons.push(`High order velocity from phone: ${phoneVelocity} orders/24h`);
    riskScore += Math.min(phoneVelocity * 5, 30);
  }

  // ── RULE 6: High-velocity orders from same IP ──────────────────
  const ipVelocity = getVelocity(`ip:checkout:${ip}`);
  if (ipVelocity > 10) {
    reasons.push(`High order velocity from IP: ${ipVelocity} attempts/24h`);
    riskScore += 25;
  }

  // ── RULE 7: Multiple accounts from same device ─────────────────
  const deviceCount = input.deviceOrderCount ?? 0;
  if (deviceCount > 3) {
    reasons.push(`Multiple accounts from same device: ${deviceCount}`);
    riskScore += 20;
  }

  // ── RULE 8: High-risk shipping country ─────────────────────────
  if (input.shippingCountry && HIGH_RISK_COUNTRIES.has(input.shippingCountry)) {
    reasons.push(`Shipping to high-risk country: ${input.shippingCountry}`);
    riskScore += 30;
  }

  // ── RULE 9: Excessive coupon use (coupon stacking/abuse) ────────
  if (input.hasCoupon && input.isNewCustomer && amount > 3000) {
    reasons.push('Coupon used by new customer on high-value order');
    riskScore += 15;
  }

  // ── RULE 10: Recent orders count ───────────────────────────────
  const recent = input.recentOrderCount ?? 0;
  if (recent >= 3) {
    reasons.push(`${recent} orders placed in last 24 hours`);
    riskScore += recent * 8;
  }

  // ── RULE 11: Bulk review submission ────────────────────────────
  if (input.action === 'bulk_review') {
    reasons.push('Bulk review submission detected');
    riskScore += 40;
  }

  // ── RULE 12: Login from new IP for VIP account ──────────────────
  if (input.action === 'login' && (input.vipTier === 'gold' || input.vipTier === 'diamond')) {
    const loginVelocity = getVelocity(`login:${input.phone}:${ip}`, 3600000);
    if (loginVelocity > 3) {
      reasons.push(`Repeated VIP login attempts from same IP: ${loginVelocity}`);
      riskScore += 20;
    }
  }

  // ─── Determine Action ─────────────────────────────────────────────────────
  const normalizedScore = Math.min(riskScore, 100);

  let action: FraudResult['action'];
  let shouldBlock = false;
  let requiresReview = false;

  if (normalizedScore >= 80) {
    action = 'block';
    shouldBlock = true;
  } else if (normalizedScore >= 60) {
    action = 'review';
    requiresReview = true;
  } else if (normalizedScore >= 40) {
    action = 'challenge'; // Could trigger OTP / CAPTCHA
    requiresReview = true;
  } else {
    action = 'allow';
  }

  return {
    riskScore: normalizedScore,
    shouldBlock,
    requiresReview,
    reasons,
    action,
    evaluatedAt: new Date().toISOString(),
  };
}

// ─── Fraud Log Helper ─────────────────────────────────────────────────────────

/**
 * Persist a fraud event to the database asynchronously (fire and forget).
 * Never throws — logs are best-effort.
 */
export async function logFraudEvent(
  input: FraudCheckInput,
  result: FraudResult
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  const ip = getClientIp(input.request);

  await fetch(`${supabaseUrl}/rest/v1/fraud_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      action: input.action,
      phone: input.phone,
      ip_address: ip,
      risk_score: result.riskScore,
      fraud_action: result.action,
      reasons: result.reasons,
      order_amount: input.orderAmount ?? 0,
      vip_tier: input.vipTier ?? 'guest',
      created_at: result.evaluatedAt,
    }),
  }).catch(e => console.error('[SHAMIKH FRAUD] Log error:', e));
}
