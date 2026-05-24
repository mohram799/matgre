import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseUrl, supabaseFetch, DbUser } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/require-admin';

// VIP tier thresholds (total spend in SAR)
const VIP_THRESHOLDS: { tier: string; min: number }[] = [
  { tier: 'diamond', min: 100000 },
  { tier: 'gold',    min: 25000  },
  { tier: 'silver',  min: 8000   },
  { tier: 'bronze',  min: 2000   },
  { tier: 'guest',   min: 0      },
];

function computeVipTier(totalSpent: number): string {
  for (const threshold of VIP_THRESHOLDS) {
    if (totalSpent >= threshold.min) return threshold.tier;
  }
  return 'guest';
}

// ─── GET /api/users — Admin: List all users ────────────────────────────────
export async function GET(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'GET:/api/users', 'ADMIN');
  if (limitRes) return limitRes;

  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { searchParams } = req.nextUrl;
  const vipTier  = searchParams.get('vip_tier');
  const search   = searchParams.get('search');
  const limit    = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset   = parseInt(searchParams.get('offset') || '0');

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      users: [
        {
          id: 'user-1',
          phone: '+966501234567',
          name: 'الأمير فيصل بن خالد',
          email: 'faisal@royalfamily.sa',
          vip_tier: 'diamond',
          total_spent: 342000,
          orders_count: 18,
          points: 34200,
          is_blocked: false,
          created_at: new Date(Date.now() - 86400000 * 180).toISOString(),
        },
        {
          id: 'user-2',
          phone: '+971501234567',
          name: 'الشيخة نورة آل مكتوم',
          email: 'noura@ruling.ae',
          vip_tier: 'gold',
          total_spent: 87500,
          orders_count: 11,
          points: 8750,
          is_blocked: false,
          created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
        }
      ],
      total: 2,
      mode: 'mock'
    });
  }

  const params: Record<string, string> = {
    select: '*',
    order: 'total_spent.desc',
    limit: String(limit),
    offset: String(offset),
  };

  if (vipTier) params['vip_tier'] = `eq.${vipTier}`;

  let url = supabaseUrl('users', params);
  if (search) {
    url += `&or=(name.ilike.*${encodeURIComponent(search)}*,phone.ilike.*${encodeURIComponent(search)}*)`;
  }

  const { data, error } = await supabaseFetch<DbUser[]>(url, { useServiceKey: true });
  if (error) return NextResponse.json({ error: 'فشل تحميل قائمة العملاء', detail: error }, { status: 500 });

  return NextResponse.json({ users: data || [], total: data?.length || 0, mode: 'supabase' });
}

// ─── POST /api/users — Register a new user (customer phone onboarding) ────────
export async function POST(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'POST:/api/users', 'AUTH');
  if (limitRes) return limitRes;

  const body = await req.json().catch(() => ({}));
  const { phone, name, email } = body;

  if (!phone || !name) {
    return NextResponse.json({ error: 'الاسم ورقم الجوال مطلوبان' }, { status: 400 });
  }

  // Normalize phone
  const normalizedPhone = phone.trim().replace(/\s+/g, '');

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      user: {
        id: `user-${Date.now()}`,
        phone: normalizedPhone,
        name: name.trim(),
        email: email || null,
        vip_tier: 'guest',
        total_spent: 0,
        orders_count: 0,
        points: 0,
        is_blocked: false,
        created_at: new Date().toISOString(),
      },
      message: 'تم إنشاء حسابك بنجاح (وضع المحاكاة)',
      mode: 'mock',
    }, { status: 201 });
  }

  // Check if user already exists
  const existingUrl = supabaseUrl('users', { select: 'id,phone', phone: `eq.${normalizedPhone}` });
  const { data: existing } = await supabaseFetch<DbUser[]>(existingUrl, { useServiceKey: true });

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'رقم الجوال مسجل بالفعل' }, { status: 409 });
  }

  const newUser = {
    phone: normalizedPhone,
    name: name.trim(),
    email: email?.trim() || null,
    vip_tier: 'guest',
    total_spent: 0,
    orders_count: 0,
    points: 0,
    is_blocked: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const insertUrl = supabaseUrl('users');
  const { data, error } = await supabaseFetch<DbUser[]>(supabaseUrl('users'), {
    method: 'POST',
    body: JSON.stringify(newUser),
    useServiceKey: true,
  });

  if (error) return NextResponse.json({ error: 'فشل إنشاء الحساب', detail: error }, { status: 500 });

  return NextResponse.json({
    user: data?.[0],
    message: 'مرحباً بك في عائلة شامخ الملكية 👑',
    mode: 'supabase',
  }, { status: 201 });
}
