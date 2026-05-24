import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signJWT } from '@/lib/auth';
import { applyRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict rate limit on authentication attempts (AUTH preset)
    const rateLimitResponse = applyRateLimit(req, '/api/auth/login', 'AUTH');
    if (rateLimitResponse) return rateLimitResponse;

    // 2. Parse payload — accept either { phone, password } or { email, password }
    const body = await req.json().catch(() => ({}));
    const { phone, email, password } = body as {
      phone?: string;
      email?: string;
      password?: string;
    };

    // Resolve the identifier: phone takes priority, email is accepted as alias
    const identifier = (phone ?? email ?? '').trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'رقم الهاتف / البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    if (identifier.length < 6 || password.length < 6) {
      return NextResponse.json(
        { error: 'بيانات الدخول قصيرة جداً' },
        { status: 400 }
      );
    }

    const adminPhone =
      process.env.ADMIN_PHONE || process.env.NEXT_PUBLIC_ADMIN_PHONE;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName =
      process.env.NEXT_PUBLIC_ADMIN_NAME || 'المدير العام';

    let success = false;
    let name = adminName;
    let role = 'SUPER_ADMIN';

    // 1. Try environment variables first (Fallback secure admin credentials)
    // Accept identifier matching phone OR email format from env
    if (
      (identifier === adminPhone || identifier === adminPhone?.replace(/^0/, '+966')) &&
      password === adminPassword
    ) {
      success = true;
    } else {
      // 2. Check Supabase admins database
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        // Try matching by phone, then by a potential email column
        const query = `${supabaseUrl}/rest/v1/admins?phone=eq.${encodeURIComponent(identifier)}&is_active=eq.true`;
        const res = await fetch(query, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        if (res.ok) {
          const admins = await res.json();
          if (admins.length > 0) {
            const admin = admins[0];
            if (password === admin.password_hash) {
              success = true;
              name = admin.name;
              role = admin.role || 'ADMIN';
            }
          }
        }
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Sign Access Token (valid for 15 minutes) and Refresh Token (valid for 7 days)
    const accessToken = await signJWT({ phone: identifier, name, role }, '15m');
    const refreshToken = await signJWT({ phone: identifier, name, role }, '7d');

    const cookieStore = cookies();

    // Set secure HttpOnly cookies
    cookieStore.set('shamikh_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    cookieStore.set('shamikh_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Write login activity to admin audit logs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/admin_audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          action_type: 'admin_login',
          entity_name: 'admins',
          entity_id: identifier,
          notes: `Admin '${name}' (${role}) logged in successfully.`,
          new_values: {
            identifier,
            name,
            role,
            loggedInAt: new Date().toISOString(),
          },
        }),
      }).catch((e) =>
        console.error('[SHAMIKH AUDIT] Failed to log admin login:', e)
      );
    }

    return NextResponse.json({
      success: true,
      user: { name, role, phone: identifier },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SHAMIKH AUTH API] Login error:', msg);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء الدخول' },
      { status: 500 }
    );
  }
}
