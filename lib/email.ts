/**
 * SHAMIKH LUXURY OS — Transactional Email System
 * Enterprise email infrastructure using Resend API.
 * Supports order confirmations, VIP upgrades, password resets, fraud alerts.
 */

import { env, featureFlags } from './env';

// ─── Email Template Types ─────────────────────────────────────────────────────

export type EmailTemplate =
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_failed'
  | 'vip_upgrade'
  | 'welcome'
  | 'password_reset'
  | 'fraud_alert'
  | 'low_inventory_alert';

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

interface ResendResponse {
  id?: string;
  error?: { message: string; name: string };
}

// ─── Email Sender ─────────────────────────────────────────────────────────────

export async function sendEmail(
  payload: EmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!featureFlags.emailNotifications()) {
    console.info('[SHAMIKH EMAIL] Email notifications disabled — RESEND_API_KEY not set.');
    return { success: false, error: 'Email notifications not configured' };
  }

  const apiKey = env.resendApiKey()!;
  const fromEmail = env.fromEmail();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `SHAMIKH LUXURY <${fromEmail}>`,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.replyTo,
        tags: payload.tags
          ? Object.entries(payload.tags).map(([name, value]) => ({ name, value }))
          : undefined,
      }),
    });

    const data = await res.json() as ResendResponse;

    if (!res.ok || data.error) {
      console.error('[SHAMIKH EMAIL] Send failed:', data.error);
      return { success: false, error: data.error?.message ?? 'Unknown error' };
    }

    return { success: true, messageId: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    console.error('[SHAMIKH EMAIL] Network error:', message);
    return { success: false, error: message };
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  total: number;
  shippingAddress: string;
  trackingNumber?: string;
}

/**
 * Generate order confirmation email (Arabic + luxury styling)
 */
export function buildOrderConfirmationEmail(data: OrderEmailData): EmailPayload {
  const itemsHtml = data.items
    .map(
      item => `
      <tr style="border-bottom: 1px solid #2a2a2a;">
        <td style="padding: 12px; color: #e8d5b0;">${item.title}</td>
        <td style="padding: 12px; text-align: center; color: #c5a059;">×${item.quantity}</td>
        <td style="padding: 12px; text-align: right; color: #e8d5b0;">
          ${(item.price * item.quantity).toLocaleString('ar-EG')} ريال
        </td>
      </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد طلبك — SHAMIKH LUXURY</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: 'Arial', sans-serif; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                 padding: 40px 30px; text-align: center; border-bottom: 1px solid #c5a059;">
        <div style="color: #c5a059; font-size: 28px; font-weight: bold; letter-spacing: 6px;">
          ⚜ SHAMIKH LUXURY
        </div>
        <div style="color: #888; font-size: 13px; margin-top: 8px; letter-spacing: 2px;">
          شامخ الفاخر
        </div>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="background: #111; padding: 40px 30px;">
        <h1 style="color: #c5a059; font-size: 24px; margin: 0 0 10px;">
          شكراً لطلبك، ${data.customerName}
        </h1>
        <p style="color: #aaa; margin: 0 0 30px;">
          تم تأكيد طلبك رقم
          <strong style="color: #c5a059;">#${data.orderNumber}</strong>
          وهو الآن قيد التجهيز الفاخر.
        </p>

        <!-- Order Items -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
          <thead>
            <tr style="background: #1a1a1a;">
              <th style="padding: 12px; text-align: right; color: #c5a059;">المنتج</th>
              <th style="padding: 12px; text-align: center; color: #c5a059;">الكمية</th>
              <th style="padding: 12px; text-align: right; color: #c5a059;">المبلغ</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr style="background: #1a1a1a;">
              <td colspan="2" style="padding: 15px; color: #c5a059; font-weight: bold;">
                المجموع الكلي
              </td>
              <td style="padding: 15px; text-align: right; color: #c5a059; font-weight: bold; font-size: 18px;">
                ${data.total.toLocaleString('ar-EG')} ريال
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Shipping -->
        <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
                    padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #c5a059; margin: 0 0 10px;">📦 عنوان الشحن</h3>
          <p style="color: #aaa; margin: 0;">${data.shippingAddress}</p>
          ${data.trackingNumber ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #2a2a2a;">
            <span style="color: #888;">رقم التتبع: </span>
            <strong style="color: #c5a059;">${data.trackingNumber}</strong>
          </div>` : ''}
        </div>

        <!-- CTA Button -->
        <div style="text-align: center;">
          <a href="${env.siteUrl()}/orders/${data.orderNumber}"
             style="background: linear-gradient(135deg, #c5a059, #8b6914);
                    color: #fff; text-decoration: none; padding: 15px 40px;
                    border-radius: 50px; font-size: 16px; font-weight: bold;
                    display: inline-block; letter-spacing: 1px;">
            تتبع طلبك ←
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #0a0a0a; padding: 30px; text-align: center;
                 border-top: 1px solid #2a2a2a;">
        <p style="color: #555; font-size: 12px; margin: 0;">
          © 2026 SHAMIKH LUXURY. جميع الحقوق محفوظة.
        </p>
        <p style="color: #333; font-size: 11px; margin: 10px 0 0;">
          هذا البريد الإلكتروني تم إرساله تلقائياً. الرجاء عدم الرد عليه.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    to: data.customerName, // Will be set by caller
    subject: `✅ تأكيد طلبك #${data.orderNumber} — SHAMIKH LUXURY`,
    html,
    text: `شكراً لطلبك ${data.customerName}! طلبك رقم #${data.orderNumber} بقيمة ${data.total} ريال تم تأكيده.`,
    tags: { type: 'order_confirmation', order_number: data.orderNumber },
  };
}

// ─── VIP Upgrade Email ────────────────────────────────────────────────────────

export interface VipUpgradeEmailData {
  customerName: string;
  oldTier: string;
  newTier: string;
  discountPercent: number;
  totalSpent: number;
}

export function buildVipUpgradeEmail(data: VipUpgradeEmailData): EmailPayload {
  const tierEmoji: Record<string, string> = {
    bronze: '🥉 الكفو',
    silver: '🥈 الهيبة',
    gold: '👑 الشامخ',
    diamond: '💎 الملكي النادر',
  };

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><title>ترقية VIP — SHAMIKH LUXURY</title></head>
<body style="margin:0; padding:0; background:#0a0a0a; font-family: Arial, sans-serif; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="background: linear-gradient(135deg, #1a0a00, #3d2800);
                 padding: 60px 30px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 20px;">
          ${tierEmoji[data.newTier]?.split(' ')[0] ?? '⭐'}
        </div>
        <h1 style="color: #c5a059; margin: 0; font-size: 28px; letter-spacing: 2px;">
          تهانينا، ${data.customerName}!
        </h1>
        <p style="color: #e8d5b0; margin: 15px 0 0; font-size: 16px;">
          تمت ترقيتك إلى مستوى
          <strong style="color: #ffd700; font-size: 20px;">
            ${tierEmoji[data.newTier] ?? data.newTier}
          </strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background: #111; padding: 40px 30px; text-align: center;">
        <div style="background: #1a1a1a; border: 1px solid #c5a059; border-radius: 12px;
                    padding: 30px; margin-bottom: 25px;">
          <h2 style="color: #c5a059; margin: 0 0 20px;">مزاياك الجديدة</h2>
          <p style="color: #e8d5b0; font-size: 24px; margin: 0 0 15px;">
            خصم دائم <span style="color: #ffd700; font-weight: bold;">
              ${data.discountPercent}%
            </span> على جميع مشترياتك
          </p>
          <p style="color: #888; margin: 0;">
            إجمالي إنفاقك: ${data.totalSpent.toLocaleString('ar-EG')} ريال
          </p>
        </div>
        <a href="${env.siteUrl()}/products"
           style="background: linear-gradient(135deg, #c5a059, #8b6914);
                  color: #fff; text-decoration: none; padding: 15px 40px;
                  border-radius: 50px; font-size: 16px; font-weight: bold; display: inline-block;">
          تسوق الآن باستخدام خصمك ←
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    to: '', // Set by caller
    subject: `🎉 تهانينا! تمت ترقيتك إلى ${tierEmoji[data.newTier] ?? data.newTier} — SHAMIKH LUXURY`,
    html,
    text: `تهانينا ${data.customerName}! تمت ترقيتك إلى ${data.newTier} مع خصم ${data.discountPercent}%.`,
    tags: { type: 'vip_upgrade', tier: data.newTier },
  };
}

// ─── Queue-Based Email Dispatcher ─────────────────────────────────────────────

/**
 * Enqueue an email for deferred sending via the notification_queue table.
 * The queue processor polls this table and sends emails in batches.
 */
export async function enqueueEmail(
  template: EmailTemplate,
  to: string,
  data: Record<string, unknown>
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) return;

  await fetch(`${supabaseUrl}/rest/v1/notification_queue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      channel: 'email',
      notification_type: template,
      recipient: to,
      metadata: data,
      status: 'pending',
      scheduled_for: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }),
  }).catch(e => console.error('[SHAMIKH EMAIL QUEUE] Enqueue failed:', e));
}
