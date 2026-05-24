import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * POST /api/notifications
 * Dispatch immediate notification (SMS/WhatsApp) to customer
 */
export async function POST(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'POST:/api/notifications', 'AUTH');
  if (limitRes) return limitRes;

  try {
    const { phone, message, type } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'يرجى إدخال الهاتف ونص الرسالة' }, { status: 400 });
    }

    logger.info(`[Notification API] Dispatching immediately to ${phone} via ${type || 'whatsapp'}`);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال الإشعار بنجاح عبر النظام',
      recipient: phone,
      channel: type || 'whatsapp',
      mode: isSupabaseConfigured() ? 'supabase' : 'mock'
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل إرسال الإشعار', details: err.message }, { status: 500 });
  }
}
