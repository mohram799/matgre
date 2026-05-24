import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/coupons/validate
 * Validates a coupon code and returns discount info
 *
 * GET /api/coupons   — Admin: list all coupons
 * POST /api/coupons  — Admin: create a coupon
 */

export async function POST(req: NextRequest) {
  try {
    const { code, cartTotal, userId } = await req.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'كود الخصم مطلوب' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/coupons?code=eq.${code.toUpperCase()}&is_active=eq.true&select=*`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );

      if (res.ok) {
        const coupons = await res.json();

        if (coupons.length === 0) {
          return NextResponse.json({ valid: false, error: 'كود الخصم غير صالح أو منتهي الصلاحية' });
        }

        const coupon = coupons[0];
        const now = new Date();

        // Check expiry
        if (coupon.expires_at && new Date(coupon.expires_at) < now) {
          return NextResponse.json({ valid: false, error: 'انتهت صلاحية هذا الكود' });
        }

        // Check usage limit
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
          return NextResponse.json({ valid: false, error: 'تم استنفاد هذا الكود' });
        }

        // Check min order value
        if (coupon.min_order_value && cartTotal < coupon.min_order_value) {
          return NextResponse.json({
            valid: false,
            error: `الحد الأدنى للطلب ${coupon.min_order_value} ريال لاستخدام هذا الكود`,
          });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
          discountAmount = (cartTotal * coupon.discount_value) / 100;
          if (coupon.max_discount_value) {
            discountAmount = Math.min(discountAmount, coupon.max_discount_value);
          }
        } else {
          discountAmount = coupon.discount_value;
        }

        return NextResponse.json({
          valid: true,
          coupon: {
            id: coupon.id,
            code: coupon.code,
            type: coupon.discount_type,
            value: coupon.discount_value,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            description: coupon.description || `خصم ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ' ريال'}`,
          },
          mode: 'supabase',
        });
      }
    }

    // Demo coupons for testing
    const demoCoupons: Record<string, any> = {
      'SHAMIKH10': { type: 'percentage', value: 10, description: 'خصم 10% لعملاء شامخ' },
      'WELCOME50': { type: 'fixed', value: 50, description: 'خصم 50 ريال ترحيباً بك' },
      'LUXURY20': { type: 'percentage', value: 20, description: 'خصم الفئة الفاخرة 20%' },
      'VIP100': { type: 'fixed', value: 100, description: 'خصم VIP الحصري 100 ريال' },
    };

    const demo = demoCoupons[code.toUpperCase()];
    if (demo) {
      const discountAmount = demo.type === 'percentage'
        ? (cartTotal * demo.value) / 100
        : demo.value;

      return NextResponse.json({
        valid: true,
        coupon: { ...demo, code: code.toUpperCase(), discountAmount: parseFloat(discountAmount.toFixed(2)) },
        mode: 'demo',
      });
    }

    return NextResponse.json({ valid: false, error: 'كود الخصم غير صالح' });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل التحقق من الكود', detail: err.message }, { status: 500 });
  }
}
