import { NextRequest, NextResponse } from 'next/server';
import { services } from '@/lib/service-registry';
import { logger } from '@/lib/logger';

/**
 * POST /api/checkout/intent
 * Creates a Stripe PaymentIntent (real or mock).
 * Protected by a circuit breaker — if Stripe fails repeatedly, the circuit
 * opens and the mock fallback is returned instantly with zero latency penalty.
 */
export async function POST(req: NextRequest) {
  const traceId = req.headers.get('x-trace-id') ?? `trace-${Date.now()}`;

  try {
    const { amount, currency = 'sar', items } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'مبلغ الدفع غير صالح' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // ── REAL STRIPE MODE (circuit-breaker protected) ───────────────────────
    if (stripeKey && !stripeKey.includes('placeholder')) {
      const result = await services.stripe.execute(
        async () => {
          const Stripe = (await import('stripe')).default;
          const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });

          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            metadata: {
              items: JSON.stringify(items?.slice(0, 3) ?? []),
              platform: 'SHAMIKH_LUXURY',
              traceId,
            },
          });

          logger.info('[CHECKOUT] Stripe PaymentIntent created', { traceId, paymentIntentId: paymentIntent.id, amount });

          return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            mode: 'stripe_live',
            circuitState: services.stripe.getState(),
          });
        },
        async () => {
          // Circuit OPEN — return degraded mock immediately
          logger.warn('[CHECKOUT] Stripe circuit OPEN — degraded mock response', { traceId });
          return buildMockPaymentResponse(amount, 'circuit_open');
        }
      );

      return result;
    }

    // ── MOCK / DEMO MODE (no Stripe key configured) ────────────────────────
    logger.info('[CHECKOUT] Mock payment intent — no Stripe key', { traceId, amount });
    return buildMockPaymentResponse(amount, 'no_key');

  } catch (err: any) {
    logger.error('[CHECKOUT] Unhandled intent error', err, { traceId });
    return NextResponse.json(
      { error: 'فشل إنشاء جلسة الدفع', detail: err.message },
      { status: 500 }
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMockPaymentResponse(amount: number, reason: 'circuit_open' | 'no_key') {
  const ts = Date.now();
  return NextResponse.json({
    clientSecret: `pi_mock_${ts}_secret_shamikh_luxury_demo`,
    paymentIntentId: `pi_mock_${ts}`,
    amount,
    mode: 'mock',
    mockReason: reason,
    message: reason === 'circuit_open'
      ? 'بوابة الدفع مؤقتاً غير متاحة — وضع المحاكاة مفعّل'
      : 'وضع المحاكاة — أضف STRIPE_SECRET_KEY لتفعيل الدفع الفعلي',
    circuitState: services.stripe.getState(),
  });
}
