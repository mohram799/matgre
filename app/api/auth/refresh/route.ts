import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, signJWT } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('shamikh_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'لم يتم العثور على جلسة صالحة' }, { status: 401 });
    }

    const payload = await verifyJWT(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'جلسة منتهية الصلاحية أو غير صالحة' }, { status: 401 });
    }

    // Generate new Access Token
    const newAccessToken = await signJWT({
      phone: payload.phone,
      name: payload.name,
      role: payload.role
    }, '15m');

    // Update Access Token cookie
    cookieStore.set('shamikh_access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[SHAMIKH AUTH API] Refresh error:', err.message);
    return NextResponse.json({ error: 'فشل تجديد الجلسة' }, { status: 500 });
  }
}
