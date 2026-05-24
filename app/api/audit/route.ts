import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseUrl, supabaseFetch, dbInsert, dbSelect, DbAuditLog } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';

// ─── GET /api/audit — Admin: List audit trail ──────────────────────────────
export async function GET(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'GET:/api/audit', 'ADMIN');
  if (limitRes) return limitRes;

  const adminHeader = req.headers.get('x-admin-user');
  if (!adminHeader) return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const entity   = searchParams.get('entity') || null;
  const entityId = searchParams.get('entityId') || null;
  const limit    = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset   = parseInt(searchParams.get('offset') || '0');

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      logs: [
        {
          id: 'log-1',
          admin_phone: '+966501234567',
          action: 'ORDER_STATUS_UPDATE:shipped',
          entity_type: 'orders',
          entity_id: 'order-abc-123',
          details: { new_status: 'shipped', tracking_number: 'TRK-ROYAL-001' },
          ip_address: '192.168.1.1',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'log-2',
          admin_phone: '+966501234567',
          action: 'PRODUCT_CREATED',
          entity_type: 'products',
          entity_id: 'prod-xyz-456',
          details: { title: 'دهن العود الملكي', price: 2500 },
          ip_address: '192.168.1.1',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        }
      ],
      total: 2,
      mode: 'mock'
    });
  }

  const params: Record<string, string> = {
    select: '*',
    order: 'created_at.desc',
    limit: String(limit),
    offset: String(offset),
  };

  if (entity)   params['entity_type'] = `eq.${entity}`;
  if (entityId) params['entity_id']   = `eq.${entityId}`;

  const url = supabaseUrl('audit_logs', params);
  const { data, error } = await supabaseFetch<DbAuditLog[]>(url, { useServiceKey: true });

  if (error) return NextResponse.json({ error: 'فشل تحميل سجل المراجعة', detail: error }, { status: 500 });

  return NextResponse.json({ logs: data || [], total: data?.length || 0, mode: 'supabase' });
}

// ─── POST /api/audit — Write an audit log entry ────────────────────────────
export async function POST(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'POST:/api/audit', 'ADMIN');
  if (limitRes) return limitRes;

  const adminHeader = req.headers.get('x-admin-user');
  if (!adminHeader) return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action, entity_type, entity_id, details } = body;

  if (!action || !entity_type) {
    return NextResponse.json({ error: 'يرجى تحديد الحدث ونوع الكيان' }, { status: 400 });
  }

  let adminPhone = 'unknown';
  try {
    const adminInfo = JSON.parse(adminHeader);
    adminPhone = adminInfo.phone || 'unknown';
  } catch { /* ignore parse errors */ }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || null;

  const entry = {
    admin_phone: adminPhone,
    action,
    entity_type,
    entity_id: entity_id || null,
    details: details || {},
    ip_address: ip,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, log: entry, mode: 'mock' }, { status: 201 });
  }

  const { data, error } = await dbInsert<DbAuditLog>('audit_logs', entry);

  if (error) return NextResponse.json({ error: 'فشل حفظ سجل المراجعة', detail: error }, { status: 500 });

  return NextResponse.json({ success: true, log: data?.[0], mode: 'supabase' }, { status: 201 });
}
