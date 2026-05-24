import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/require-admin';

const log = logger.child({ service: 'InventoryAlerts' });

/**
 * GET /api/admin/inventory-alerts
 * Fetch list of luxury products that have low stock.
 * Secured admin endpoint.
 */
export async function GET(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'GET:/api/admin/inventory-alerts', 'ADMIN');
  if (limitRes) return limitRes;

  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { searchParams } = req.nextUrl;
  const threshold = parseInt(searchParams.get('threshold') || '5');

  // ── MOCK / FALLBACK MODE ─────────────────────────────────────────
  if (!isSupabaseConfigured()) {
    log.info('Supabase not configured, returning low stock mock data.');
    return NextResponse.json({
      alertsCount: 3,
      alerts: [
        {
          id: 'mock-watch-1',
          title: 'ساعة رولكس دايتونا الذهب الوردي الحصرية',
          sku: 'RLX-DAY-GLD-01',
          stock_quantity: 1,
          price: 185000,
          category: 'ساعات النخبة',
          urgency: 'critical', // critical: 0-1, warning: 2-threshold
        },
        {
          id: 'mock-perfume-2',
          title: 'دهن عود كلمنتان ملكي معتق 30 سنة',
          sku: 'OUD-KLM-ROY-30',
          stock_quantity: 2,
          price: 12500,
          category: 'عطور حصرية',
          urgency: 'warning',
        },
        {
          id: 'mock-ring-3',
          title: 'خاتم الألماس الأزرق النادر "سوليتير الملك"',
          sku: 'RNG-BLU-SOL-99',
          stock_quantity: 0,
          price: 380000,
          category: 'مجوهرات ونوادر',
          urgency: 'out_of_stock',
        }
      ],
      threshold,
      mode: 'mock'
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Query active products with low stock, sorted by stock ascending
    // NOTE: The products table uses 'stock' (not stock_quantity) and 'status'
    // There is no deleted_at column in this schema.
    const url = `${supabaseUrl}/rest/v1/products?select=id,title,stock,price,status&stock=lte.${threshold}&status=eq.active&order=stock.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
      }
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`Supabase error ${res.status}: ${errBody.message || res.statusText}`);
    }

    const products: any[] = await res.json();

    const formattedAlerts = products.map(p => {
      let urgency = 'warning';
      if (p.stock === 0) {
        urgency = 'out_of_stock';
      } else if (p.stock <= 1) {
        urgency = 'critical';
      }

      return {
        id: p.id,
        title: p.title,
        sku: p.sku || 'N/A',
        stock_quantity: p.stock,
        price: p.price,
        urgency,
      };
    });

    return NextResponse.json({
      alertsCount: formattedAlerts.length,
      alerts: formattedAlerts,
      threshold,
      mode: 'supabase'
    });

  } catch (err: any) {
    log.error('Failed fetching low stock inventory alerts', { error: err.message });
    return NextResponse.json({ error: 'فشل استرجاع تنبيهات المخزون المنخفض', details: err.message }, { status: 500 });
  }
}

