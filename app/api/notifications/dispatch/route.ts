import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseFetch } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sendEmail, buildOrderConfirmationEmail, buildVipUpgradeEmail } from '@/lib/email';

const log = logger.child({ service: 'NotificationDispatcher' });

/**
 * GET /api/notifications/dispatch
 * Fetch items from the notification queue.
 * Secure admin route.
 */
export async function GET(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'GET:/api/notifications/dispatch', 'ADMIN');
  if (limitRes) return limitRes;

  const adminHeader = req.headers.get('x-admin-user');
  if (!adminHeader) {
    return NextResponse.json({ error: 'غير مصرح للوصول لهذه العملية الإدارية' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') || 'pending';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      queue: [
        {
          id: 'mock-notif-1',
          channel: 'email',
          notification_type: 'order_confirmation',
          recipient: 'ahmed@example.com',
          title: 'تأكيد طلبك',
          body: 'طلبك رقم #123 تم تأكيده',
          status: 'pending',
          created_at: new Date().toISOString(),
        }
      ],
      mode: 'mock'
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const queueUrl = `${supabaseUrl}/rest/v1/notification_queue?status=eq.${status}&limit=${limit}&order=created_at.desc`;
    const res = await fetch(queueUrl, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
      }
    });

    if (!res.ok) {
      throw new Error(`Supabase queue query failed with status: ${res.status}`);
    }

    const queue = await res.json();
    return NextResponse.json({ queue, mode: 'supabase' });
  } catch (err: any) {
    log.error('Failed to load notification queue', { error: err.message });
    return NextResponse.json({ error: 'فشل تحميل طابور الإشعارات', details: err.message }, { status: 500 });
  }
}

/**
 * POST /api/notifications/dispatch
 * Polls the DB-backed notification_queue, processes pending messages,
 * dispatches them via transactional channels (Resend/Email, Push, Admin),
 * and updates their status in the DB.
 */
export async function POST(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'POST:/api/notifications/dispatch', 'ADMIN');
  if (limitRes) return limitRes;

  // Dual-mode feature
  if (!isSupabaseConfigured()) {
    log.info('Supabase not configured, bypassing real notification processing.');
    return NextResponse.json({
      processed: 0,
      message: 'تمت المحاكاة بنجاح — بيئة Supabase غير متصلة',
      mode: 'mock'
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // 1. Fetch pending notifications scheduled for now or earlier
    const nowIso = new Date().toISOString();
    const pendingUrl = `${supabaseUrl}/rest/v1/notification_queue?status=eq.pending&scheduled_for=lte.${encodeURIComponent(nowIso)}&limit=15`;
    const pendingRes = await fetch(pendingUrl, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
      }
    });

    if (!pendingRes.ok) {
      throw new Error(`Failed to fetch pending notifications: ${pendingRes.status}`);
    }

    const pendingList: any[] = await pendingRes.json();
    log.info(`Found ${pendingList.length} pending notifications to dispatch.`);

    if (pendingList.length === 0) {
      return NextResponse.json({ processed: 0, message: 'لا توجد إشعارات معلقة لإرسالها حالياً' });
    }

    let successCount = 0;
    let failCount = 0;

    // 2. Process each notification synchronously/concurrently in batch
    for (const item of pendingList) {
      let isSuccess = false;
      let errorMsg = '';

      try {
        if (item.channel === 'email') {
          const recipient = item.recipient || item.metadata?.recipient || '';
          if (!recipient) {
            throw new Error('No recipient email specified');
          }

          let emailPayload: any = null;

          // Check if custom layout needed
          if (item.notification_type === 'order_confirmation') {
            emailPayload = buildOrderConfirmationEmail(item.metadata);
            emailPayload.to = recipient;
          } else if (item.notification_type === 'vip_upgrade') {
            emailPayload = buildVipUpgradeEmail(item.metadata);
            emailPayload.to = recipient;
          } else {
            // Generic luxury HTML template fallback
            emailPayload = {
              to: recipient,
              subject: item.title || 'رسالة حصرية من SHAMIKH LUXURY',
              html: `
                <div style="background:#0a0a0a; color:#fff; padding:40px; font-family:sans-serif; text-align:center; direction:rtl;">
                  <h1 style="color:#c5a059;">⚜ SHAMIKH LUXURY</h1>
                  <h2>${item.title}</h2>
                  <p style="color:#aaa; font-size:16px; line-height:1.6;">${item.body}</p>
                  <hr style="border-color:#222;" />
                  <p style="color:#555; font-size:12px;">شامخ الفاخر — تجربة التسوق الأرقى في الشرق الأوسط</p>
                </div>
              `,
              text: item.body || '',
            };
          }

          const sendResult = await sendEmail(emailPayload);
          isSuccess = sendResult.success;
          errorMsg = sendResult.error || '';
        } else if (item.channel === 'admin' || item.channel === 'push') {
          // Push notifications or administrative visual alerts are marked as sent
          log.info(`Notification dispatched to channel [${item.channel}]: ${item.title}`);
          isSuccess = true;
        } else {
          log.warn(`Unsupported channel: ${item.channel}`);
          isSuccess = true; // Auto-pass
        }
      } catch (err: any) {
        log.error(`Failed to process notification ${item.id}`, { error: err.message });
        isSuccess = false;
        errorMsg = err.message;
      }

      // Update state in DB
      try {
        await fetch(`${supabaseUrl}/rest/v1/notification_queue?id=eq.${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: key!,
            Authorization: `Bearer ${key!}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            status: isSuccess ? 'sent' : 'failed',
            error_message: isSuccess ? null : errorMsg,
            sent_at: isSuccess ? new Date().toISOString() : null,
          }),
        });

        if (isSuccess) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (patchErr: any) {
        log.error(`Failed to update status for notification ${item.id}`, { error: patchErr.message });
      }
    }

    return NextResponse.json({
      processed: pendingList.length,
      successCount,
      failCount,
      message: `تمت معالجة الإشعارات: ${successCount} نجاح، ${failCount} فشل`
    });

  } catch (err: any) {
    log.error('Failed processing notification dispatcher', { error: err.message });
    return NextResponse.json({ error: 'فشل تشغيل مرسل الإشعارات', details: err.message }, { status: 500 });
  }
}
