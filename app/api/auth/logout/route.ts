import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();

    // Invalidate cookies by setting maxAge to 0 and empty value
    cookieStore.set('shamikh_access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    cookieStore.set('shamikh_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح الفاخر' });

  } catch (err: any) {
    console.error('[SHAMIKH AUTH API] Logout error:', err.message);
    return NextResponse.json({ error: 'فشل تسجيل الخروج' }, { status: 500 });
  }
}
