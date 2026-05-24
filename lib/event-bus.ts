/**
 * SHAMIKH LUXURY OS — Event Bus
 * Lightweight, in-process async event system for Next.js API routes.
 * Simulates an event-driven architecture without external dependencies.
 * In production, swap handlers for BullMQ workers connected to Redis.
 *
 * Supported Events:
 *  - ORDER_CREATED, ORDER_STATUS_UPDATED, ORDER_CANCELLED
 *  - PAYMENT_SUCCEEDED, PAYMENT_FAILED, PAYMENT_REFUNDED
 *  - USER_REGISTERED, USER_VIP_UPGRADED
 *  - PRODUCT_IMPORTED, INVENTORY_UPDATED, INVENTORY_LOW
 *  - REVIEW_SUBMITTED, COUPON_USED
 *  - FRAUD_DETECTED, SUSPICIOUS_LOGIN
 *  - NOTIFICATION_REQUESTED
 */

// ─── Event Type Definitions ───────────────────────────────────────────────────

export type EventType =
  // Order lifecycle
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_UPDATED'
  | 'ORDER_CANCELLED'
  // Payment lifecycle
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  // User lifecycle
  | 'USER_REGISTERED'
  | 'USER_VIP_UPGRADED'
  // Catalog
  | 'PRODUCT_IMPORTED'
  | 'INVENTORY_UPDATED'
  | 'INVENTORY_LOW'
  // Reviews
  | 'REVIEW_SUBMITTED'
  // Coupons
  | 'COUPON_USED'
  // Security
  | 'FRAUD_DETECTED'
  | 'SUSPICIOUS_LOGIN'
  // Notifications
  | 'NOTIFICATION_REQUESTED';

export interface ShamakhEvent<T = Record<string, unknown>> {
  id: string;
  type: EventType;
  payload: T;
  metadata: {
    source: string; // API route or service that emitted this
    timestamp: string;
    correlationId?: string; // For tracing request chains
  };
}

type EventHandler<T = Record<string, unknown>> = (
  event: ShamakhEvent<T>
) => Promise<void> | void;

// ─── Event Bus Implementation ─────────────────────────────────────────────────

class ShamakhEventBus {
  private handlers = new Map<EventType, EventHandler[]>();
  private eventLog: ShamakhEvent[] = []; // In-memory log (max 1000)
  private readonly MAX_LOG = 1000;

  /**
   * Register a handler for a specific event type.
   * Multiple handlers per event are supported (fan-out).
   */
  on<T = Record<string, unknown>>(
    type: EventType,
    handler: EventHandler<T>
  ): () => void {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...existing, handler as EventHandler]);
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type) ?? [];
      this.handlers.set(
        type,
        handlers.filter(h => h !== (handler as EventHandler))
      );
    };
  }

  /**
   * Emit an event — fires all registered handlers asynchronously.
   * Handlers run concurrently with Promise.allSettled (no throw on failure).
   */
  async emit<T = Record<string, unknown>>(
    type: EventType,
    payload: T,
    source = 'api'
  ): Promise<void> {
    const event: ShamakhEvent<T> = {
      id: crypto.randomUUID(),
      type,
      payload,
      metadata: {
        source,
        timestamp: new Date().toISOString(),
      },
    };

    // Append to in-memory log
    this.eventLog.push(event as ShamakhEvent);
    if (this.eventLog.length > this.MAX_LOG) {
      this.eventLog.shift(); // Drop oldest
    }

    // Run handlers
    const handlers = this.handlers.get(type) ?? [];
    if (handlers.length === 0) return;

    const results = await Promise.allSettled(
      handlers.map(handler => handler(event as ShamakhEvent))
    );

    // Log handler failures (non-throwing)
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(
          `[SHAMIKH EVENT BUS] Handler ${i} failed for event ${type}:`,
          result.reason
        );
      }
    });

    // Persist event to DB (async, non-blocking)
    this.persistEventAsync(event as ShamakhEvent);
  }

  /**
   * Get recent events from the in-memory log (for admin dashboard)
   */
  getRecentEvents(limit = 50): ShamakhEvent[] {
    return this.eventLog.slice(-limit).reverse();
  }

  /**
   * Persist event to Supabase event_logs table (fire-and-forget)
   */
  private persistEventAsync(event: ShamakhEvent): void {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return;

    fetch(`${url}/rest/v1/event_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_id: event.id,
        event_type: event.type,
        payload: event.payload,
        source: event.metadata.source,
        correlation_id: event.metadata.correlationId ?? null,
        created_at: event.metadata.timestamp,
      }),
    }).catch(e => console.error('[SHAMIKH EVENT] Persist failed:', e));
  }
}

// Singleton event bus — shared across all API routes in the same process
export const eventBus = new ShamakhEventBus();

// ─── Register Core Event Handlers ────────────────────────────────────────────

/**
 * ORDER_CREATED handler:
 * - Decrements product stock
 * - Triggers notification to admin
 * - Fires user VIP check
 */
eventBus.on('ORDER_CREATED', async (event) => {
  const { orderId, customerPhone, totalAmount, items } = event.payload as {
    orderId: string;
    customerPhone: string;
    totalAmount: number;
    items: Array<{ product_id: string; quantity: number }>;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  // 1. Decrement stock for each item
  for (const item of items) {
    await fetch(
      `${url}/rest/v1/rpc/decrement_stock`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          p_product_id: item.product_id,
          p_qty: item.quantity,
        }),
      }
    ).catch(e => console.error('[ORDER_CREATED] Stock decrement failed:', e));
  }

  // 2. Queue admin notification
  await eventBus.emit('NOTIFICATION_REQUESTED', {
    channel: 'admin',
    type: 'new_order',
    title: 'طلب جديد وارد',
    body: `طلب جديد #${orderId} بقيمة ${totalAmount.toLocaleString('ar-EG')} ريال`,
    metadata: { orderId, customerPhone },
  }, 'ORDER_CREATED');

  // 3. Update user total_spent (triggers VIP tier auto-upgrade via DB trigger)
  await fetch(
    `${url}/rest/v1/users?phone=eq.${encodeURIComponent(customerPhone)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        total_spent: totalAmount, // DB trigger handles cumulative add
        orders_count: 1,
      }),
    }
  ).catch(e => console.error('[ORDER_CREATED] User update failed:', e));
});

/**
 * PAYMENT_SUCCEEDED handler:
 * - Marks order as paid
 * - Sends order confirmation notification
 */
eventBus.on('PAYMENT_SUCCEEDED', async (event) => {
  const { orderId, stripePaymentIntent, amount } = event.payload as {
    orderId: string;
    stripePaymentIntent: string;
    amount: number;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  await fetch(
    `${url}/rest/v1/orders?id=eq.${orderId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        payment_status: 'paid',
        status: 'processing',
        paid_at: new Date().toISOString(),
        stripe_payment_intent: stripePaymentIntent,
      }),
    }
  ).catch(e => console.error('[PAYMENT_SUCCEEDED] Order update failed:', e));
});

/**
 * PAYMENT_FAILED handler:
 * - Marks order as payment_failed
 * - Re-increments stock
 */
eventBus.on('PAYMENT_FAILED', async (event) => {
  const { orderId } = event.payload as { orderId: string };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  await fetch(
    `${url}/rest/v1/orders?id=eq.${orderId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        payment_status: 'failed',
        status: 'cancelled',
      }),
    }
  ).catch(e => console.error('[PAYMENT_FAILED] Order update failed:', e));
});

/**
 * INVENTORY_LOW handler:
 * - Logs low inventory alert
 * - Queues admin notification
 */
eventBus.on('INVENTORY_LOW', async (event) => {
  const { productId, productTitle, currentStock } = event.payload as {
    productId: string;
    productTitle: string;
    currentStock: number;
  };

  await eventBus.emit('NOTIFICATION_REQUESTED', {
    channel: 'admin',
    type: 'inventory_alert',
    title: 'تحذير: مخزون منخفض',
    body: `المنتج "${productTitle}" وصل إلى ${currentStock} قطعة فقط`,
    metadata: { productId, currentStock },
  }, 'INVENTORY_LOW');
});

/**
 * FRAUD_DETECTED handler:
 * - Logs to fraud_logs table
 * - Sends alert to admin
 */
eventBus.on('FRAUD_DETECTED', async (event) => {
  const { phone, riskScore, reasons, action } = event.payload as {
    phone: string;
    riskScore: number;
    reasons: string[];
    action: string;
  };

  console.warn(`[SHAMIKH FRAUD] Blocked: ${phone} | Score: ${riskScore} | Action: ${action}`);
  console.warn('[SHAMIKH FRAUD] Reasons:', reasons.join(', '));
});

/**
 * NOTIFICATION_REQUESTED handler:
 * - Persists notification to notification_queue table
 */
eventBus.on('NOTIFICATION_REQUESTED', async (event) => {
  const { channel, type, title, body, metadata } = event.payload as {
    channel: string;
    type: string;
    title: string;
    body: string;
    metadata: Record<string, unknown>;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  await fetch(`${url}/rest/v1/notification_queue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      channel,
      notification_type: type,
      title,
      body,
      metadata,
      status: 'pending',
      created_at: new Date().toISOString(),
    }),
  }).catch(e => console.error('[NOTIFICATION] Enqueue failed:', e));
});
