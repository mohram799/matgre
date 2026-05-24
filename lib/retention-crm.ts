/**
 * SHAMIKH LUXURY OS — Retention CRM & Multi-Channel Marketing Engine v2
 *
 * Enhancements in v2:
 *  - Multi-step abandoned cart recovery sequences (3-touch journey)
 *  - WhatsApp-ready message templates via Twilio WhatsApp API
 *  - Circuit-breaker-protected SMS/WhatsApp dispatch (services.resend)
 *  - Structured recovery journey logging to Supabase
 *  - Re-engagement win-back sequences (30-day inactivity)
 *  - VIP milestone celebration campaigns
 */

import { queueManager } from './queues';
import { services } from './service-registry';
import { logger } from './logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartAbandonmentInput {
  cartId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{ title: string; price: number; quantity: number; imageUrl?: string }>;
  cartTotal?: number;
  tenantId?: string;
}

export interface RecoveryJourneyResult {
  journeyId: string;
  jobIds: string[];
  touchCount: number;
  estimatedRecovery: { touch1: string; touch2: string; touch3: string };
  success: boolean;
}

export interface WinBackInput {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  lastOrderDate: string;
  vipTier?: string;
}

// ─── Recovery Touch Timing ────────────────────────────────────────────────────

const RECOVERY_TOUCHES = {
  TOUCH_1_DELAY_MS: 30 * 60 * 1000,        // 30 minutes — gentle reminder
  TOUCH_2_DELAY_MS: 3 * 60 * 60 * 1000,    // 3 hours — urgency with discount
  TOUCH_3_DELAY_MS: 24 * 60 * 60 * 1000,   // 24 hours — final FOMO trigger
};

// ─── SMS / WhatsApp Message Templates ────────────────────────────────────────

function buildTouch1Message(name: string, itemCount: number, total: number): string {
  return `⚜️ شامخ الفاخر\n\nأهلاً ${name}،\n\nلديك ${itemCount} منتج${itemCount > 1 ? 'ات' : ''} بقيمة ${total.toLocaleString('ar-SA')} ر.س في سلتك.\n\nأكمل طلبك الآن:\nhttps://luxury-os.com/checkout\n\n✨ تسوق ممتع`;
}

function buildTouch2Message(name: string, total: number, discountCode: string): string {
  return `⚜️ شامخ الفاخر\n\nمرحباً ${name}،\n\nسلتك لا تزال بانتظارك! 🛒\n\nخصم خاص لك: استخدم كود【${discountCode}】\nوفر 10% على طلبك الآن.\n\nالعرض ينتهي خلال 6 ساعات ⏳\nhttps://luxury-os.com/checkout`;
}

function buildTouch3Message(name: string, topItem: string): string {
  return `⚜️ شامخ الفاخر — فرصتك الأخيرة\n\n${name}، ${topItem} على وشك النفاد! 🔥\n\nالكميات محدودة جداً لهذا الإصدار الحصري.\n\nأكمل طلبك الآن قبل انتهاء المخزون:\nhttps://luxury-os.com/checkout\n\n⚜️ فخامة حقيقية تستحقها`;
}

function buildVipUpgradeMessage(name: string, tier: string, emoji: string): string {
  return `⚜️ شامخ الفاخر\n\nتهانينا ${name}! 🎉\n\nتمت ترقيتك إلى مستوى ${emoji} [${tier.toUpperCase()}]\n\nتم تفعيل مزاياك الحصرية الجديدة في حسابك.\nتسوق الآن واستمتع بخصومات ${tier === 'gold' ? '20' : tier === 'diamond' ? '30' : '12'}% على جميع المنتجات 💎\n\nhttps://luxury-os.com`;
}

function buildWinBackMessage(name: string, vipTier: string): string {
  const tierLabel = vipTier ? ` [${vipTier.toUpperCase()}]` : '';
  return `⚜️ شامخ الفاخر — اشتقنا إليك!\n\nمرحباً ${name}${tierLabel} 💫\n\nلم نرك منذ فترة، وأردنا تذكيرك بأن مجموعتنا تجددت بتحف جديدة تستحق اهتمامك.\n\nكوبون عودة خاص لك: WELCOME-BACK-10\n\nhttps://luxury-os.com/products\n\n✨ يسعدنا خدمتك دائماً`;
}

// ─── CRM Engine Class ─────────────────────────────────────────────────────────

class ShamakhRetentionCRM {
  private isSmsConfigured = false;
  private isWhatsAppConfigured = false;
  private twilioAccountSid = '';
  private twilioAuthToken = '';
  private twilioFromSms = '';
  private twilioFromWhatsApp = '';

  constructor() {
    this.twilioAccountSid   = process.env.TWILIO_ACCOUNT_SID   ?? '';
    this.twilioAuthToken    = process.env.TWILIO_AUTH_TOKEN    ?? '';
    this.twilioFromSms      = process.env.TWILIO_FROM_NUMBER   ?? '';
    this.twilioFromWhatsApp = process.env.TWILIO_WHATSAPP_FROM ?? '';

    this.isSmsConfigured      = !!(this.twilioAccountSid && !this.twilioAccountSid.includes('placeholder'));
    this.isWhatsAppConfigured = !!(this.isWhatsAppConfigured && this.twilioFromWhatsApp);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Schedules a full 3-touch abandoned cart recovery journey.
   * Touch 1 (30m): Gentle reminder SMS
   * Touch 2 (3h):  Discount code offer
   * Touch 3 (24h): FOMO / scarcity message
   */
  async trackCartAbandonment(input: CartAbandonmentInput): Promise<RecoveryJourneyResult> {
    const journeyId = `journey-${input.cartId}-${Date.now()}`;
    const total = input.cartTotal ?? input.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const topItem = input.items[0]?.title ?? 'منتجك المفضل';
    const discountCode = `CART-${input.cartId.slice(-4).toUpperCase()}-10`;
    const jobIds: string[] = [];

    logger.info('[CRM] Starting 3-touch recovery journey', { journeyId, cartId: input.cartId, total });

    // Touch 1
    const t1 = await queueManager.enqueue('crm', 'cart_recovery_touch_1', {
      journeyId, cartId: input.cartId, customerName: input.customerName,
      customerPhone: input.customerPhone, customerEmail: input.customerEmail,
      totalAmount: total, items: input.items, touch: 1,
      message: buildTouch1Message(input.customerName, input.items.length, total),
    }, { delay: RECOVERY_TOUCHES.TOUCH_1_DELAY_MS, attempts: 2 });
    if (t1.jobId) jobIds.push(t1.jobId);

    // Touch 2
    const t2 = await queueManager.enqueue('crm', 'cart_recovery_touch_2', {
      journeyId, cartId: input.cartId, customerName: input.customerName,
      customerPhone: input.customerPhone, customerEmail: input.customerEmail,
      totalAmount: total, discountCode, touch: 2,
      message: buildTouch2Message(input.customerName, total, discountCode),
    }, { delay: RECOVERY_TOUCHES.TOUCH_2_DELAY_MS, attempts: 2 });
    if (t2.jobId) jobIds.push(t2.jobId);

    // Touch 3
    const t3 = await queueManager.enqueue('crm', 'cart_recovery_touch_3', {
      journeyId, cartId: input.cartId, customerName: input.customerName,
      customerPhone: input.customerPhone, customerEmail: input.customerEmail,
      topItem, touch: 3,
      message: buildTouch3Message(input.customerName, topItem),
    }, { delay: RECOVERY_TOUCHES.TOUCH_3_DELAY_MS, attempts: 2 });
    if (t3.jobId) jobIds.push(t3.jobId);

    const now = Date.now();
    return {
      journeyId,
      jobIds,
      touchCount: 3,
      estimatedRecovery: {
        touch1: new Date(now + RECOVERY_TOUCHES.TOUCH_1_DELAY_MS).toISOString(),
        touch2: new Date(now + RECOVERY_TOUCHES.TOUCH_2_DELAY_MS).toISOString(),
        touch3: new Date(now + RECOVERY_TOUCHES.TOUCH_3_DELAY_MS).toISOString(),
      },
      success: jobIds.length > 0,
    };
  }

  /**
   * Trigger a 30-day win-back campaign for inactive customers.
   */
  async triggerWinBack(input: WinBackInput): Promise<boolean> {
    logger.info('[CRM] Win-back sequence triggered', { customerId: input.customerId });

    const message = buildWinBackMessage(input.customerName, input.vipTier ?? '');

    await queueManager.enqueue('crm', 'win_back_campaign', {
      customerId: input.customerId,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      message,
      couponCode: 'WELCOME-BACK-10',
    }, { delay: 0, attempts: 3 });

    // Also send SMS immediately
    await this.sendSMS(input.customerPhone, message);

    return true;
  }

  /**
   * Trigger a VIP milestone reward journey (email + SMS/WhatsApp).
   */
  async triggerVipMilestone(
    customerName: string,
    customerEmail: string,
    customerPhone: string,
    newTier: string
  ): Promise<boolean> {
    const tierEmoji: Record<string, string> = {
      bronze: '🥉', silver: '🥈', gold: '👑', diamond: '💎',
    };
    const emoji = tierEmoji[newTier.toLowerCase()] ?? '⭐';

    logger.info('[CRM] VIP milestone journey started', { customerEmail, newTier });

    // Email via queue
    await queueManager.enqueue('emails', 'vip_upgrade', {
      recipient: customerEmail, customerName, newTier, emoji,
    });

    // SMS/WhatsApp notification
    const message = buildVipUpgradeMessage(customerName, newTier, emoji);
    if (this.isWhatsAppConfigured) {
      await this.sendWhatsApp(customerPhone, message);
    } else {
      await this.sendSMS(customerPhone, message);
    }

    return true;
  }

  /**
   * Send SMS via Twilio (circuit-breaker protected via services.resend proxy).
   * Falls back gracefully to console mock in dev/unconfigured environments.
   */
  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.isSmsConfigured) {
      logger.info('[CRM SMS MOCK] Simulated SMS dispatch', { to, preview: message.slice(0, 60) });
      return true;
    }

    return services.resend.execute(
      async () => {
        const auth = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64');
        const url  = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;

        const params = new URLSearchParams();
        params.append('To',   to);
        params.append('From', this.twilioFromSms);
        params.append('Body', message);

        const res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        });

        if (!res.ok) throw new Error(`Twilio SMS failed: ${res.status}`);
        logger.info('[CRM] SMS dispatched via Twilio', { to });
        return true;
      },
      async () => {
        logger.warn('[CRM] Twilio circuit OPEN — SMS suppressed', { to });
        return false;
      }
    );
  }

  /**
   * Send WhatsApp message via Twilio WhatsApp sandbox/production.
   */
  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    if (!this.isSmsConfigured || !this.twilioFromWhatsApp) {
      logger.info('[CRM WA MOCK] Simulated WhatsApp dispatch', { to, preview: message.slice(0, 60) });
      return true;
    }

    return services.resend.execute(
      async () => {
        const auth = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64');
        const url  = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;

        const params = new URLSearchParams();
        params.append('To',   `whatsapp:${to}`);
        params.append('From', `whatsapp:${this.twilioFromWhatsApp}`);
        params.append('Body', message);

        const res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        });

        if (!res.ok) throw new Error(`Twilio WhatsApp failed: ${res.status}`);
        logger.info('[CRM] WhatsApp message dispatched via Twilio', { to });
        return true;
      },
      async () => {
        logger.warn('[CRM] Twilio circuit OPEN — WhatsApp suppressed', { to });
        return false;
      }
    );
  }
}

export const retentionCRM = new ShamakhRetentionCRM();
