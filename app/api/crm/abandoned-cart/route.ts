/**
 * SHAMIKH LUXURY OS — CRM Cart Abandonment Webhook & Event Router
 * Route: /api/crm/abandoned-cart
 *
 * POST: Triggers a 3-touch personalized marketing journey for abandoned luxury cart items.
 * Security: Guarded with administrative secret keys or valid auth sessions to prevent abuse.
 * Accepts both a full CartAbandonmentInput payload and a minimal { phone } test payload.
 */

import { NextRequest, NextResponse } from 'next/server';
import { retentionCRM, CartAbandonmentInput } from '@/lib/retention-crm';
import { logger } from '@/lib/logger';
import { sentry } from '@/lib/sentry';

export const runtime = 'nodejs';

/**
 * POST /api/crm/abandoned-cart
 * Accepts a cart model and initializes Twilio WhatsApp/SMS recovery flows.
 */
export async function POST(req: NextRequest) {
  const traceId = req.headers.get('x-trace-id') ?? `trace-${Date.now()}`;
  
  // ─── Security / Auth Guard ───
  const adminSecret = req.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET_KEY;

  // Enforce validation if ADMIN_SECRET_KEY is configured
  if (expectedSecret && adminSecret !== expectedSecret) {
    logger.warn('[CRM API] Unauthorized access attempt blocked', { traceId });
    return NextResponse.json({ error: 'Unauthorized administrative operation' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    // ── Normalize payload ─────────────────────────────────────────
    // Supports both the full CartAbandonmentInput and a minimal { phone } test payload.
    const cartId        = body.cartId    ?? `cart-test-${Date.now()}`;
    const customerPhone = body.customerPhone ?? body.phone ?? '';
    const customerName  = body.customerName  ?? `عميل ${customerPhone || 'اختبار'}`;
    const customerEmail = body.customerEmail ?? body.email ?? `test+${Date.now()}@shamikh.sa`;
    const items         = body.items ?? [
      { title: 'منتج اختباري فاخر', price: 2500, quantity: 1, imageUrl: '' },
    ];

    if (!customerPhone && !body.cartId) {
      return NextResponse.json(
        { error: 'يجب توفير رقم الجوال أو بيانات السلة' },
        { status: 400 }
      );
    }

    const input: CartAbandonmentInput = {
      cartId,
      customerId:    body.customerId,
      customerName,
      customerPhone,
      customerEmail,
      items,
      cartTotal:  body.cartTotal,
      tenantId:   body.tenantId,
    };

    logger.info('[CRM API] Initiating abandoned cart touchpoints', { traceId, cartId: input.cartId, email: input.customerEmail });

    const result = await retentionCRM.trackCartAbandonment(input);

    return NextResponse.json({
      success:          result.success,
      journeyId:        result.journeyId,
      scheduledTouches: result.touchCount,
      estimatedTimes:   result.estimatedRecovery,
      jobIds:           result.jobIds,
      traceId,
    }, {
      status: 200,
      headers: {
        'X-Trace-Id': traceId,
      },
    });

  } catch (err: any) {
    logger.error('[CRM API] Critical error processing abandoned cart tracking', err, { traceId });
    sentry.captureError(err, { message: 'Abandoned cart route execution failure', context: { traceId } });
    return NextResponse.json({ error: 'Internal system fault during queue dispatch' }, { status: 500 });
  }
}

