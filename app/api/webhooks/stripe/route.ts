import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { eventBus } from '@/lib/event-bus';
import { isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'StripeWebhook' });

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler for payment lifecycle management.
 * Verifies webhook signature, logs receiving event, and emits EventBus events.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let isVerified = false;

  // 1. Signature Verification
  if (secret && signature) {
    try {
      const parts = signature.split(',');
      const tPart = parts.find(p => p.startsWith('t='));
      const v1Part = parts.find(p => p.startsWith('v1='));

      if (tPart && v1Part) {
        const timestamp = tPart.substring(2);
        const sig = v1Part.substring(3);
        const signedPayload = `${timestamp}.${rawBody}`;

        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(signedPayload)
          .digest('hex');

        isVerified = crypto.timingSafeEqual(
          Buffer.from(sig, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        );
      }
    } catch (err: any) {
      log.error('Signature validation threw an error', { error: err.message });
    }
  } else {
    // If not configured, we allow processing for development and testing
    log.warn('Bypassing signature verification — STRIPE_WEBHOOK_SECRET or stripe-signature is missing');
    isVerified = true;
  }

  if (!isVerified) {
    log.error('Stripe webhook signature verification failed.');
    return NextResponse.json({ error: 'توقيع Stripe غير صالح' }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err: any) {
    log.error('Failed to parse webhook JSON body', { error: err.message });
    return NextResponse.json({ error: 'قالب غير صالح' }, { status: 400 });
  }

  log.info(`Received Stripe webhook event: ${event.type}`, { eventId: event.id });

  let dbLogId: string | null = null;

  // 2. Persist Webhook Event to database (Pending state)
  if (isSupabaseConfigured() && supabaseUrl && key) {
    try {
      const logRes = await fetch(`${supabaseUrl}/rest/v1/webhook_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          provider: 'stripe',
          event_type: event.type,
          payload: event,
          status: 'pending',
          created_at: new Date().toISOString(),
        }),
      });

      if (logRes.ok) {
        const loggedData = await logRes.json();
        dbLogId = loggedData?.[0]?.id || null;
      }
    } catch (e: any) {
      log.error('Failed to write raw webhook to webhook_events', { error: e.message });
    }
  }

  try {
    const paymentIntent = event.data?.object;
    if (!paymentIntent) {
      throw new Error('No payment intent found in event payload');
    }

    const stripePaymentIntentId = paymentIntent.id;

    // Handle payment succeeded
    if (event.type === 'payment_intent.succeeded') {
      log.info(`Payment succeeded event processed for intent: ${stripePaymentIntentId}`);

      let orderId = `mock-order-${Date.now()}`;
      let order: any = null;

      // Find actual order from DB where stripe_payment_intent matches
      if (isSupabaseConfigured() && supabaseUrl && key) {
        const orderUrl = `${supabaseUrl}/rest/v1/orders?stripe_payment_intent=eq.${encodeURIComponent(stripePaymentIntentId)}`;
        const orderRes = await fetch(orderUrl, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });

        if (orderRes.ok) {
          const orders = await orderRes.json();
          order = orders?.[0] || null;
          if (order) {
            orderId = order.id;
          } else {
            log.warn(`No order found matching payment intent ID: ${stripePaymentIntentId}`);
          }
        }
      }

      // Log payment event
      if (isSupabaseConfigured() && supabaseUrl && key && order) {
        await fetch(`${supabaseUrl}/rest/v1/payment_events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            stripe_payment_intent: stripePaymentIntentId,
            event_type: event.type,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency?.toUpperCase() || 'SAR',
            status: 'succeeded',
            raw_payload: paymentIntent,
            created_at: new Date().toISOString(),
          }),
        }).catch(e => log.error('Failed to persist payment event log', { error: e.message }));
      }

      // Emit PAYMENT_SUCCEEDED to Event Bus
      await eventBus.emit('PAYMENT_SUCCEEDED', {
        orderId,
        stripePaymentIntent: stripePaymentIntentId,
        amount: paymentIntent.amount / 100,
      }, 'stripe_webhook');
    }

    // Handle payment failed
    else if (event.type === 'payment_intent.payment_failed') {
      log.warn(`Payment failed event processed for intent: ${stripePaymentIntentId}`);

      let orderId = `mock-order-${Date.now()}`;
      let order: any = null;

      // Find actual order from DB
      if (isSupabaseConfigured() && supabaseUrl && key) {
        const orderUrl = `${supabaseUrl}/rest/v1/orders?stripe_payment_intent=eq.${encodeURIComponent(stripePaymentIntentId)}`;
        const orderRes = await fetch(orderUrl, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });

        if (orderRes.ok) {
          const orders = await orderRes.json();
          order = orders?.[0] || null;
          if (order) {
            orderId = order.id;
          }
        }
      }

      // Log payment event
      if (isSupabaseConfigured() && supabaseUrl && key && order) {
        await fetch(`${supabaseUrl}/rest/v1/payment_events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            stripe_payment_intent: stripePaymentIntentId,
            event_type: event.type,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency?.toUpperCase() || 'SAR',
            status: 'failed',
            raw_payload: paymentIntent,
            created_at: new Date().toISOString(),
          }),
        }).catch(e => log.error('Failed to persist payment failed log', { error: e.message }));
      }

      // Emit PAYMENT_FAILED to Event Bus
      await eventBus.emit('PAYMENT_FAILED', { orderId }, 'stripe_webhook');
    }

    // Update Webhook Event Log status to processed
    if (dbLogId && isSupabaseConfigured() && supabaseUrl && key) {
      await fetch(`${supabaseUrl}/rest/v1/webhook_events?id=eq.${dbLogId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ status: 'processed' }),
      }).catch(e => log.error('Failed to update webhook log to processed', { error: e.message }));
    }

  } catch (err: any) {
    log.error(`Error processing Stripe webhook: ${err.message}`, { eventId: event.id });

    // Update Webhook Event Log status to failed with error message
    if (dbLogId && isSupabaseConfigured() && supabaseUrl && key) {
      await fetch(`${supabaseUrl}/rest/v1/webhook_events?id=eq.${dbLogId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ status: 'failed', error_message: err.message }),
      }).catch(e => log.error('Failed to update webhook log to failed', { error: e.message }));
    }

    return NextResponse.json({ error: 'Error processing webhook', details: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true, status: 'processed' });
}
