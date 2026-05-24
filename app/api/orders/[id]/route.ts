import { NextRequest, NextResponse } from 'next/server';
import { dbUpdate, isSupabaseConfigured, supabaseUrl, supabaseFetch, DbOrder } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';

// ─── GET /api/orders/[id] ─────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const limitRes = applyRateLimit(req, 'GET:/api/orders/[id]', 'API');
  if (limitRes) return limitRes;

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      order: {
        id,
        order_number: `SHM-MOCK-${id.slice(0, 6).toUpperCase()}`,
        customer_name: 'الأمير فيصل (محاكاة)',
        status: 'shipped',
        tracking_number: 'TRK-ROYAL-2024-XF7',
        tracking_carrier: 'شامخ إكسبريس الملكي',
        total: 2500,
        items: [
          {
            product_id: 'mock-1',
            title: 'دهن عود سيوفي معتق',
            price: 2500,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=400&q=80'
          }
        ],
        shipping_address: {
          line1: 'برج الشامخ، الطابق 80',
          city: 'الرياض',
          country: 'المملكة العربية السعودية'
        },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        shipped_at: new Date(Date.now() - 86400000).toISOString(),
      },
      mode: 'mock'
    });
  }

  const adminHeader = req.headers.get('x-admin-user');
  const url = supabaseUrl('orders', {
    select: '*',
    id: `eq.${id}`,
    limit: '1',
  });

  const { data, error } = await supabaseFetch<DbOrder[]>(url, {
    useServiceKey: Boolean(adminHeader),
  });

  if (error) return NextResponse.json({ error: 'فشل تحميل الطلب', detail: error }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });

  const order = data[0];

  // Non-admin users can only see own orders (verified by phone in request header)
  if (!adminHeader) {
    const phone = req.headers.get('x-customer-phone');
    if (phone && order.customer_phone !== phone) {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الطلب' }, { status: 403 });
    }
  }

  return NextResponse.json({ order, mode: 'supabase' });
}

// ─── PATCH /api/orders/[id] (Admin update order status) ──────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const limitRes = applyRateLimit(req, 'PATCH:/api/orders/[id]', 'ADMIN');
  if (limitRes) return limitRes;

  const adminHeader = req.headers.get('x-admin-user');
  if (!adminHeader) return NextResponse.json({ error: 'غير مصرح — Admin only' }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { status, tracking_number, tracking_carrier, notes } = body;

  const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({
      error: 'حالة الطلب غير صالحة',
      valid: VALID_STATUSES
    }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      order: { id, status, tracking_number, tracking_carrier },
      message: 'تم تحديث الطلب بنجاح (وضع المحاكاة)',
      mode: 'mock'
    });
  }

  // Build the update payload
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status)           updatePayload.status = status;
  if (tracking_number)  updatePayload.tracking_number = tracking_number;
  if (tracking_carrier) updatePayload.tracking_carrier = tracking_carrier;
  if (notes)            updatePayload.notes = notes;

  // Set timestamps for specific status transitions
  if (status === 'shipped')   updatePayload.shipped_at   = new Date().toISOString();
  if (status === 'delivered') updatePayload.delivered_at = new Date().toISOString();

  const { data, error } = await dbUpdate<DbOrder>('orders', `id=eq.${id}`, updatePayload);

  if (error) return NextResponse.json({ error: 'فشل تحديث الطلب', detail: error }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });

  // Write audit log for order status change
  try {
    const adminInfo = JSON.parse(adminHeader);
    const auditUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/audit_logs`;
    await supabaseFetch(auditUrl, {
      method: 'POST',
      body: JSON.stringify({
        admin_phone: adminInfo.phone || 'unknown',
        action: `ORDER_STATUS_UPDATE:${status}`,
        entity_type: 'orders',
        entity_id: id,
        details: { old_status: 'unknown', new_status: status, tracking_number },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        created_at: new Date().toISOString(),
      }),
      useServiceKey: true,
    });
  } catch {
    // Audit log failure is non-fatal
  }

  return NextResponse.json({
    order: data[0],
    message: `تم تحديث الطلب إلى: ${status} بنجاح`,
    mode: 'supabase',
  });
}
