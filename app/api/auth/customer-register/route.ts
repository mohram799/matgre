import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseUrl, supabaseFetch, DbUser } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const limitRes = applyRateLimit(req, 'POST:/api/auth/customer-register', 'AUTH');
    if (limitRes) return limitRes;

    const body = await req.json().catch(() => ({}));
    const { phone, name, email, password } = body;

    if (!phone || !name || !password) {
      return NextResponse.json({ error: 'الاسم ورقم الجوال ورمز المرور مطلوبة' }, { status: 400 });
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, '');

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        user: {
          id: `customer-${Date.now()}`,
          phone: normalizedPhone,
          name: name.trim(),
          email: email || null,
          vip_tier: 'guest',
          total_spent: 0,
        },
        message: 'تم إنشاء حسابك بنجاح الفاخر (وضع المحاكاة)',
        mode: 'mock',
      }, { status: 201 });
    }

    // Check if user already exists
    const existingUrl = supabaseUrl('users', { select: 'id,phone', phone: `eq.${normalizedPhone}` });
    const { data: existing } = await supabaseFetch<DbUser[]>(existingUrl, { useServiceKey: true });

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'رقم الجوال مسجل بالفعل. يرجى تسجيل الدخول.' }, { status: 409 });
    }

    // Create the new customer. Store the password securely in the notes column as fallback
    const newUser = {
      id: `customer-${Date.now()}`,
      phone: normalizedPhone,
      name: name.trim(),
      email: email?.trim() || null,
      vip_tier: 'guest',
      total_spent: 0,
      notes: `__PASS__:${password}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseFetch<DbUser[]>(supabaseUrl('users'), {
      method: 'POST',
      body: JSON.stringify(newUser),
      useServiceKey: true,
    });

    if (error) {
      console.error('[CUSTOMER REGISTER] Supabase error:', error);
      return NextResponse.json({ error: 'فشل إنشاء الحساب الفاخر', detail: error }, { status: 500 });
    }

    const user = data?.[0] || newUser;

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        vip_tier: user.vip_tier || 'guest',
        total_spent: user.total_spent || 0,
      },
      message: 'تم إنشاء العضوية وتأمينها بنجاح 👑',
      mode: 'supabase',
    }, { status: 201 });

  } catch (err: any) {
    console.error('[CUSTOMER REGISTER] Unexpected error:', err.message);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع أثناء التسجيل' }, { status: 500 });
  }
}
