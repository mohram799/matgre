import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseUrl, supabaseFetch, DbUser } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const limitRes = applyRateLimit(req, 'POST:/api/auth/customer-login', 'AUTH');
    if (limitRes) return limitRes;

    const body = await req.json().catch(() => ({}));
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: 'رقم الجوال ورمز المرور مطلوبان' }, { status: 400 });
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, '');

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        user: {
          id: `customer-${Date.now()}`,
          phone: normalizedPhone,
          name: 'عميل شامخ الفاخر (محاكاة)',
          email: 'customer@example.com',
          vip_tier: 'guest',
          total_spent: 0,
        },
        message: 'تم تسجيل الدخول بنجاح الفاخر (وضع المحاكاة)',
        mode: 'mock',
      });
    }

    // Fetch user by phone
    const url = supabaseUrl('users', { select: '*', phone: `eq.${normalizedPhone}`, limit: '1' });
    const { data: users, error } = await supabaseFetch<any[]>(url, { useServiceKey: true });

    if (error) {
      console.error('[CUSTOMER LOGIN] Supabase error:', error);
      return NextResponse.json({ error: 'فشل ربط الاتصال بلقاعدة البيانات', detail: error }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'عذراً، رقم الجوال هذا غير مسجل لدينا. يرجى إنشاء عضوية جديدة.' }, { status: 404 });
    }

    const user = users[0];
    const notesStr = user.notes || '';
    const isPassOk = notesStr.startsWith(`__PASS__:${password}`);

    if (!isPassOk && notesStr.includes('__PASS__:')) {
      return NextResponse.json({ error: 'رمز المرور غير صحيح. يرجى التأكد والمحاولة مجدداً.' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        vip_tier: user.vip_tier || 'guest',
        total_spent: user.total_spent || 0,
      },
      message: 'أهلاً بك مجدداً في عالم الفخامة 👑',
      mode: 'supabase',
    });

  } catch (err: any) {
    console.error('[CUSTOMER LOGIN] Unexpected error:', err.message);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع أثناء تسجيل الدخول' }, { status: 500 });
  }
}
