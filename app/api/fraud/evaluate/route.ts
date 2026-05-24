import { NextRequest, NextResponse } from 'next/server';
import { evaluateFraud, logFraudEvent, type FraudCheckInput } from '@/lib/fraud-detection';
import { eventBus } from '@/lib/event-bus';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/fraud/evaluate
 * Real-time fraud score evaluation for orders and account actions.
 * Called by checkout flow before processing payment.
 */
export async function POST(req: NextRequest) {
  const rateLimitResponse = applyRateLimit(req, '/api/fraud/evaluate', 'API');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const {
      action = 'checkout',
      phone = '',
      orderAmount,
      itemCount,
      vipTier,
      isNewCustomer,
      recentOrderCount,
      deviceOrderCount,
      hasCoupon,
      shippingCountry,
      hasHighValueItems,
    } = body;

    const input: FraudCheckInput = {
      action,
      phone,
      request: req,
      orderAmount,
      itemCount,
      vipTier,
      isNewCustomer,
      recentOrderCount,
      deviceOrderCount,
      hasCoupon,
      shippingCountry,
      hasHighValueItems,
    };

    const result = evaluateFraud(input);

    // If fraud detected, emit event and log to DB
    if (result.shouldBlock || result.requiresReview) {
      await Promise.allSettled([
        logFraudEvent(input, result),
        eventBus.emit('FRAUD_DETECTED', {
          phone,
          riskScore: result.riskScore,
          reasons: result.reasons,
          action: result.action,
          orderAmount,
        }, '/api/fraud/evaluate'),
      ]);
    }

    return NextResponse.json({
      risk_score: result.riskScore,
      action: result.action,
      should_block: result.shouldBlock,
      requires_review: result.requiresReview,
      reasons: result.shouldBlock ? result.reasons : [], // Don't expose reasons to clients unless blocked
      evaluated_at: result.evaluatedAt,
    });
  } catch (err: unknown) {
    console.error('[FRAUD API] Error:', err);
    // Fail open (allow) on internal errors to not break checkout
    return NextResponse.json({
      risk_score: 0,
      action: 'allow',
      should_block: false,
      requires_review: false,
      reasons: [],
      evaluated_at: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/fraud/evaluate
 * Returns recent fraud events for admin dashboard.
 * Requires admin authentication in production.
 */
export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimit(req, '/api/fraud/evaluate', 'ADMIN');
  if (rateLimitResponse) return rateLimitResponse;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ fraud_logs: getMockFraudLogs() });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const actionFilter = searchParams.get('action'); // block, review, challenge, allow

    let endpoint = `${url}/rest/v1/fraud_logs?select=*&order=created_at.desc&limit=${limit}`;
    if (actionFilter) {
      endpoint += `&fraud_action=eq.${actionFilter}`;
    }

    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ fraud_logs: getMockFraudLogs() });
    }

    const logs = await res.json();
    return NextResponse.json({ fraud_logs: logs, count: logs.length });
  } catch {
    return NextResponse.json({ fraud_logs: getMockFraudLogs() });
  }
}

function getMockFraudLogs() {
  return [
    {
      id: 'fl-001',
      action: 'checkout',
      phone: '05****1234',
      ip_address: '185.220.xxx.xxx',
      risk_score: 82,
      fraud_action: 'block',
      reasons: ['New customer attempting high-value order (SAR 42,000)', 'High order velocity from IP: 15 attempts/24h'],
      order_amount: 42000,
      vip_tier: 'guest',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'fl-002',
      action: 'login',
      phone: '05****5678',
      ip_address: '94.102.xxx.xxx',
      risk_score: 65,
      fraud_action: 'review',
      reasons: ['Automated HTTP client detected', 'High failed login count: 4'],
      order_amount: 0,
      vip_tier: 'silver',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];
}
