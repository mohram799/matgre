import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/require-admin';

/**
 * GET /api/analytics/dashboard
 * Enterprise analytics aggregation endpoint.
 * Returns KPIs: revenue, orders, VIP breakdown, top products, conversion funnel.
 */
export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimit(req, '/api/analytics/dashboard', 'ADMIN');
  if (rateLimitResponse) return rateLimitResponse;

  const deny = await requireAdmin(req);
  if (deny) return deny;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Parse date range from query params (default: last 30 days)
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '30', 10);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  if (!url || !key) {
    return NextResponse.json(getMockAnalytics(), { status: 200 });
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  try {
    const [ordersRes, productsRes, usersRes, lowStockRes] = await Promise.allSettled([
      // Orders since date range — use only columns that exist in the schema
      fetch(`${url}/rest/v1/orders?select=id,total_amount,status,payment_status,created_at&created_at=gte.${since}&order=created_at.desc`, { headers }),
      // Top-selling products — use 'stock' (real column name in schema)
      fetch(`${url}/rest/v1/products?select=id,title,price,sales_count,rating_score,stock,status&status=eq.active&order=sales_count.desc&limit=10`, { headers }),
      // User stats — include vip_tier_id (foreign key, not the slug)
      fetch(`${url}/rest/v1/users?select=id,vip_tier_id,total_spent,created_at&order=total_spent.desc&limit=100`, { headers }),
      // Low-stock products (≤ 5 items) — use 'stock' column
      fetch(`${url}/rest/v1/products?select=id,title,stock&stock=lte.5&status=eq.active`, { headers }),
    ]);

    const orders = ordersRes.status === 'fulfilled' && ordersRes.value.ok
      ? (await ordersRes.value.json()) as OrderRow[]
      : [];
    const products = productsRes.status === 'fulfilled' && productsRes.value.ok
      ? (await productsRes.value.json()) as ProductRow[]
      : [];
    const users = usersRes.status === 'fulfilled' && usersRes.value.ok
      ? (await usersRes.value.json()) as UserRow[]
      : [];
    const lowStock = lowStockRes.status === 'fulfilled' && lowStockRes.value.ok
      ? (await lowStockRes.value.json()) as LowStockRow[]
      : [];

    return NextResponse.json(aggregateAnalytics(orders, products, users, lowStock, days));
  } catch (err: unknown) {
    console.error('[ANALYTICS] Error:', err);
    return NextResponse.json(getMockAnalytics(), { status: 200 });
  }
}


// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderRow {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface ProductRow {
  id: string;
  title: string;
  price: number;
  sales_count: number;
  rating_score: number;
  stock: number;
  status: string;
}

interface UserRow {
  id: string;
  vip_tier_id: string | null;
  total_spent: number;
  created_at: string;
}

interface LowStockRow {
  id: string;
  title: string;
  stock: number;
}

// ─── Analytics Aggregation ─────────────────────────────────────────────────

function aggregateAnalytics(
  orders: OrderRow[],
  products: ProductRow[],
  users: UserRow[],
  lowStock: LowStockRow[],
  days: number
) {
  // Revenue metrics — only count paid orders
  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Order status breakdown
  const ordersByStatus = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  // VIP tier breakdown — derived from users table (vip_tier_id is a FK)
  // We label them generically since we don't join vip_memberships here
  const usersByVip = users.reduce((acc: Record<string, number>, u) => {
    const tier = u.vip_tier_id ? 'vip' : 'guest';
    acc[tier] = (acc[tier] ?? 0) + 1;
    return acc;
  }, {});

  // Revenue trend by day (last N days)
  const revenueByDay: Record<string, number> = {};
  for (let i = 0; i < Math.min(days, 30); i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    revenueByDay[d] = 0;
  }
  paidOrders.forEach(o => {
    const day = o.created_at.slice(0, 10);
    if (day in revenueByDay) {
      revenueByDay[day] = (revenueByDay[day] ?? 0) + o.total_amount;
    }
  });

  // Top VIP customer by spend
  const topCustomers = users
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5)
    .map(u => ({
      vip_tier: u.vip_tier_id ?? 'guest',
      total_spent: u.total_spent,
      id: u.id.slice(0, 8) + '...', // Anonymize
    }));

  // Revenue forecast (simple linear extrapolation)
  const dailyAvg = totalRevenue / Math.max(days, 1);
  const forecast30Days = dailyAvg * 30;

  return {
    period_days: days,
    generated_at: new Date().toISOString(),
    kpis: {
      total_revenue_sar: Math.round(totalRevenue),
      total_orders: orders.length,
      paid_orders: paidOrders.length,
      avg_order_value_sar: Math.round(avgOrderValue),
      conversion_rate_pct: orders.length > 0
        ? Math.round((paidOrders.length / orders.length) * 100)
        : 0,
      total_customers: users.length,
      forecast_30d_revenue_sar: Math.round(forecast30Days),
    },
    orders: {
      by_status: ordersByStatus,
      revenue_trend: Object.entries(revenueByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) })),
    },
    customers: {
      by_vip_tier: usersByVip,
      top_customers: topCustomers,
    },
    products: {
      top_sellers: products.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        price_sar: p.price,
        sales_count: p.sales_count,
        avg_rating: p.rating_score,
        stock_quantity: p.stock,
      })),
      low_stock_alerts: lowStock.map(p => ({
        id: p.id,
        title: p.title,
        stock_quantity: p.stock,
        urgency: p.stock === 0 ? 'critical' : p.stock <= 2 ? 'high' : 'medium',
      })),
      low_stock_count: lowStock.length,
    },
  };
}

// ─── Mock Fallback ────────────────────────────────────────────────────────────

function getMockAnalytics() {
  const revenueTrend = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
    revenue: Math.round(12000 + Math.random() * 18000),
  }));

  return {
    period_days: 30,
    generated_at: new Date().toISOString(),
    _mock: true,
    kpis: {
      total_revenue_sar: 487230,
      total_orders: 312,
      paid_orders: 289,
      avg_order_value_sar: 1686,
      conversion_rate_pct: 93,
      total_customers: 847,
      forecast_30d_revenue_sar: 520000,
    },
    orders: {
      by_status: {
        delivered: 198,
        shipped: 47,
        processing: 33,
        pending: 22,
        cancelled: 12,
      },
      by_vip_tier: { guest: 145, bronze: 87, silver: 51, gold: 22, diamond: 7 },
      revenue_trend: revenueTrend,
    },
    customers: {
      by_vip_tier: { guest: 510, bronze: 220, silver: 85, gold: 27, diamond: 5 },
      revenue_by_vip_tier: {
        guest: 89000,
        bronze: 145000,
        silver: 132000,
        gold: 87000,
        diamond: 34230,
      },
      top_customers: [
        { vip_tier: 'diamond', total_spent: 287400, id: 'f8a3c1...' },
        { vip_tier: 'diamond', total_spent: 198200, id: 'b2e9d4...' },
        { vip_tier: 'gold',    total_spent: 98750,  id: 'c7f2a8...' },
        { vip_tier: 'gold',    total_spent: 87300,  id: 'e4d1b9...' },
        { vip_tier: 'silver',  total_spent: 65200,  id: 'a9c3f7...' },
      ],
    },
    products: {
      top_sellers: [
        { id: '1', title: 'عطر عود ملكي 50 مل', price_sar: 2800, sales_count: 89, avg_rating: 4.9, stock_quantity: 12 },
        { id: '2', title: 'ساعة كرونوغراف فضية',  price_sar: 15400, sales_count: 45, avg_rating: 4.8, stock_quantity: 5 },
        { id: '3', title: 'خاتم ذهب 22 قيراط',   price_sar: 8900, sales_count: 38, avg_rating: 4.9, stock_quantity: 7 },
        { id: '4', title: 'عطر نيش باريسي',       price_sar: 3200, sales_count: 31, avg_rating: 4.7, stock_quantity: 18 },
        { id: '5', title: 'حقيبة جلد طبيعي',      price_sar: 4500, sales_count: 27, avg_rating: 4.8, stock_quantity: 3 },
      ],
      low_stock_alerts: [
        { id: '2', title: 'ساعة كرونوغراف فضية', stock_quantity: 5, urgency: 'medium' },
        { id: '5', title: 'حقيبة جلد طبيعي',     stock_quantity: 3, urgency: 'high' },
        { id: '7', title: 'سوار بلاتينيوم',       stock_quantity: 1, urgency: 'critical' },
      ],
      low_stock_count: 3,
    },
  };
}
