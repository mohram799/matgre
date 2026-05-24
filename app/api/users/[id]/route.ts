import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseUrl, supabaseFetch, dbUpdate } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';

// ─── GET /api/users/[id] — Get single user profile ───────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const limitRes = applyRateLimit(req, 'GET:/api/users/[id]', 'API');
  if (limitRes) return limitRes;

  const { id } = params;
  const adminHeader = req.headers.get('x-admin-user');

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      user: {
        id,
        phone: '+966501234567',
        name: 'الأمير فيصل (محاكاة)',
        email: 'faisal@royalfamily.sa',
        vip_tier: 'diamond',
        total_spent: 342000,
        orders_count: 18,
        points: 34200,
        is_blocked: false,
      },
      mode: 'mock'
    });
  }

  const url = supabaseUrl('users', { select: '*', id: `eq.${id}`, limit: '1' });
  const { data, error } = await supabaseFetch<any[]>(url, { useServiceKey: Boolean(adminHeader) });

  if (error) return NextResponse.json({ error: 'فشل تحميل ملف العميل', detail: error }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });

  return NextResponse.json({ user: data[0], mode: 'supabase' });
}

// ─── PATCH /api/users/[id] — Update user (admin or self) ──────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const limitRes = applyRateLimit(req, 'PATCH:/api/users/[id]', 'API');
  if (limitRes) return limitRes;

  const adminHeader = req.headers.get('x-admin-user');
  const { id } = params;

  const body = await req.json().catch(() => ({}));
  const { name, email, is_blocked, vip_tier } = body;

  // Non-admin users can only update their name/email (not tier or blocked status)
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (name)  updatePayload.name  = name.trim();
  if (email) updatePayload.email = email.trim();

  // Admin-only fields
  if (adminHeader) {
    if (vip_tier    !== undefined) updatePayload.vip_tier    = vip_tier;
    if (is_blocked  !== undefined) updatePayload.is_blocked  = is_blocked;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ user: { id, ...updatePayload }, mode: 'mock' });
  }

  const { data, error } = await dbUpdate('users', `id=eq.${id}`, updatePayload);

  if (error) return NextResponse.json({ error: 'فشل تحديث ملف العميل', detail: error }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });

  return NextResponse.json({ user: data[0], message: 'تم تحديث ملف العميل بنجاح', mode: 'supabase' });
}
