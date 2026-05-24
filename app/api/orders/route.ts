import { NextRequest, NextResponse } from 'next/server';
import { dbSelect, dbInsert, dbUpdate, isSupabaseConfigured, supabaseUrl, supabaseFetch, DbOrder } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';
import { validateBody, orderCreateSchema } from '@/lib/validators';
import { VipTier, OrderStatus } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';
import { getAdminPayload } from '@/lib/require-admin';

// VIP Discount mapping
const VIP_DISCOUNTS: Record<string, number> = {
  guest: 0, bronze: 5, silver: 12, gold: 20, diamond: 30,
};

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SHM-${ts}-${rand}`;
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'GET:/api/orders', 'API');
  if (limitRes) return limitRes;

  // Support all three admin auth methods: x-admin-user, x-admin-secret, JWT cookie
  const adminPayload = await getAdminPayload(req);
  const { searchParams } = req.nextUrl;
  const status  = searchParams.get('status');
  const phone   = searchParams.get('phone');
  const limit   = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset  = parseInt(searchParams.get('offset') || '0');

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ orders: [], total: 0, mode: 'mock' });
  }

  const params: Record<string, string> = {
    select: '*',
    order: 'created_at.desc',
    limit: String(limit),
    offset: String(offset),
  };

  // Non-admin must provide phone; admin can browse all orders
  if (!adminPayload) {
    if (!phone) return NextResponse.json({ error: 'مطلوب رقم الجوال' }, { status: 400 });
    params['customer_phone'] = `eq.${phone}`;
  } else if (status) {
    params['status'] = `eq.${status}`;
  }

  const url = supabaseUrl('orders', params);
  const { data, error } = await supabaseFetch<DbOrder[]>(url, {
    useServiceKey: Boolean(adminPayload),
  });

  if (error) return NextResponse.json({ error: 'فشل تحميل الطلبات', detail: error }, { status: 500 });

  return NextResponse.json({ orders: data || [], total: data?.length || 0, mode: 'supabase' });
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'POST:/api/orders', 'CHECKOUT');
  if (limitRes) return limitRes;

  const bodyOrError = await validateBody(req, orderCreateSchema);
  if (bodyOrError instanceof Response) return bodyOrError;

  const {
    customer_name,
    customer_phone,
    customer_email,
    shipping_address,
    items,
    coupon_code,
    vip_tier = 'guest',
    notes,
    stripe_payment_intent,
  } = bodyOrError;

  // Calculate pricing
  const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) =>
    sum + item.price * item.quantity, 0
  );
  const vipDiscountPct = VIP_DISCOUNTS[vip_tier] || 0;
  const vipDiscount    = Math.floor(subtotal * vipDiscountPct / 100);

  // Coupon discount logic
  let couponDiscount = 0;
  if (coupon_code && isSupabaseConfigured()) {
    const couponUrl = supabaseUrl('coupons', {
      select: '*',
      code: `eq.${coupon_code.toUpperCase()}`,
      is_active: 'eq.true',
    });
    const { data: coupons } = await supabaseFetch<any[]>(couponUrl);
    const coupon = coupons?.[0];
    if (coupon && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())) {
      couponDiscount = coupon.discount_type === 'percentage'
        ? Math.floor(subtotal * coupon.discount_value / 100)
        : coupon.discount_value;
    }
  }

  const totalDiscount = vipDiscount + couponDiscount;
  const shippingCost  = subtotal >= 500 ? 0 : 30; // Free shipping above 500 SAR
  const total         = Math.max(0, subtotal - totalDiscount + shippingCost);
  const orderNumber   = generateOrderNumber();

  const newOrder = {
    order_number:         orderNumber,
    customer_name,
    customer_phone,
    customer_email:       customer_email || null,
    shipping_address,
    items:                items.map((item: any) => ({ ...item, image: item.image || '' })),
    subtotal,
    discount_amount:      totalDiscount,
    shipping_cost:        shippingCost,
    total,
    coupon_code:          coupon_code?.toUpperCase() || null,
    vip_tier:             vip_tier as VipTier,
    vip_discount_percent: vipDiscountPct,
    status:               (stripe_payment_intent ? 'confirmed' : 'pending') as OrderStatus,
    stripe_payment_intent: stripe_payment_intent || null,
    paid_at:              stripe_payment_intent ? new Date().toISOString() : null,
    notes:                notes || null,
    tracking_number:      null,
    tracking_carrier:     null,
    created_at:           new Date().toISOString(),
    updated_at:           new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    // Mock success for development
    const mockOrder = { id: `mock-${Date.now()}`, ...newOrder };

    // Emit event asynchronously on event bus
    eventBus.emit('ORDER_CREATED', {
      orderId: mockOrder.id,
      customerPhone: mockOrder.customer_phone,
      totalAmount: mockOrder.total,
      items: mockOrder.items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    }, 'api/orders_mock').catch(e => console.error('[EVENT BUS MOCK] Error:', e));

    return NextResponse.json({
      order: mockOrder,
      message: 'تم استلام طلبك بنجاح (وضع المحاكاة)',
      mode: 'mock',
    }, { status: 201 });
  }

  const { data, error } = await dbInsert<DbOrder>('orders', newOrder);
  if (error) return NextResponse.json({ error: 'فشل إنشاء الطلب', detail: error }, { status: 500 });

  const createdOrder = data?.[0];
  if (createdOrder) {
    // Emit event on event bus
    eventBus.emit('ORDER_CREATED', {
      orderId: createdOrder.id,
      customerPhone: createdOrder.customer_phone,
      totalAmount: createdOrder.total,
      items: createdOrder.items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    }, 'api/orders').catch(e => console.error('[EVENT BUS] Error:', e));
  }

  // Increment coupon usage
  if (coupon_code && isSupabaseConfigured()) {
    const couponUrl = supabaseUrl('coupons', { code: `eq.${coupon_code.toUpperCase()}` });
    const { data: coupons } = await supabaseFetch<any[]>(couponUrl);
    if (coupons?.[0]) {
      await supabaseFetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/coupons?code=eq.${coupon_code.toUpperCase()}`, {
        method: 'PATCH',
        body: JSON.stringify({ used_count: (coupons[0].used_count || 0) + 1 }),
        useServiceKey: true,
      });
    }
  }

  // Increment product sales counts
  for (const item of items) {
    await supabaseFetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?id=eq.${item.product_id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ sales_count: item.quantity }),
        useServiceKey: true,
        headers: { 'Prefer': 'resolution=merge-duplicates' },
      }
    );
  }

  return NextResponse.json({
    order: createdOrder,
    message: 'تم استلام طلبك بنجاح — فريق شامخ في طريقه إليك',
    mode: 'supabase',
  }, { status: 201 });
}
