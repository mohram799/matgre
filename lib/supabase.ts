/**
 * SHAMIKH LUXURY OS — Supabase Client
 * Typed client for both server-side (service-role) and client-side (anon) access
 */

// ─── Database Types ──────────────────────────────────────────────────────────

export type VipTier = 'guest' | 'bronze' | 'silver' | 'gold' | 'diamond';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type ProductStatus = 'active' | 'inactive' | 'archived';
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'WAREHOUSE' | 'MARKETING';

export interface DbProduct {
  id: string;
  title: string;
  title_ar: string;
  slug: string;
  description: string;
  description_ar: string;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  images: string[];
  category_id: string | null;
  status: ProductStatus;
  is_featured: boolean;
  stock_quantity: number;
  sku: string | null;
  tags: string[];
  specs: Record<string, string>;
  weight_kg: number | null;
  sales_count: number;
  views_count: number;
  avg_rating: number;
  reviews_count: number;
  aliexpress_id: string | null;
  aliexpress_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: {
    line1: string;
    city: string;
    country: string;
    postal_code?: string;
  };
  items: Array<{
    product_id: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  coupon_code: string | null;
  vip_tier: VipTier;
  vip_discount_percent: number;
  status: OrderStatus;
  tracking_number: string | null;
  tracking_carrier: string | null;
  notes: string | null;
  stripe_payment_intent: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  vip_tier: VipTier;
  total_spent: number;
  orders_count: number;
  points: number;
  avatar_url: string | null;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbReview {
  id: string;
  product_id: string;
  user_id: string | null;
  reviewer_name: string;
  rating: number;
  body: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface DbCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  vip_only: boolean;
  min_vip_tier: VipTier | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DbAuditLog {
  id: string;
  admin_phone: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ─── Supabase REST Client (No SDK required — raw fetch) ──────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SupabaseQueryOptions {
  useServiceKey?: boolean;
  headers?: Record<string, string>;
}

/**
 * Build a Supabase REST query URL
 */
export function supabaseUrl(table: string, params?: Record<string, string>): string {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

/**
 * Perform a Supabase REST request
 */
export async function supabaseFetch<T = unknown>(
  endpoint: string,
  options: RequestInit & SupabaseQueryOptions = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { useServiceKey = false, headers: extraHeaders = {}, ...fetchOptions } = options;

  const key = useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !key) {
    return { data: null, error: 'Supabase not configured', status: 503 };
  }

  try {
    const res = await fetch(endpoint, {
      ...fetchOptions,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...extraHeaders,
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error: errBody.message || errBody.error || 'Unknown error', status: res.status };
    }

    const data = await res.json() as T;
    return { data, error: null, status: res.status };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: msg, status: 500 };
  }
}

// ─── Typed Query Helpers ─────────────────────────────────────────────────────

/**
 * Select rows from a table with optional filters
 * Filters use PostgREST syntax: e.g. { status: 'eq.active', limit: '20' }
 */
export async function dbSelect<T>(
  table: string,
  filters: Record<string, string> = {},
  opts: SupabaseQueryOptions = {}
): Promise<{ data: T[] | null; error: string | null }> {
  const url = supabaseUrl(table, { select: '*', ...filters });
  const result = await supabaseFetch<T[]>(url, { ...opts });
  return { data: result.data, error: result.error };
}

/**
 * Insert one or more rows
 */
export async function dbInsert<T>(
  table: string,
  payload: Partial<T> | Partial<T>[],
  opts: SupabaseQueryOptions = {}
): Promise<{ data: T[] | null; error: string | null }> {
  const url = supabaseUrl(table);
  const result = await supabaseFetch<T[]>(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    useServiceKey: true,
    ...opts,
  });
  return { data: result.data, error: result.error };
}

/**
 * Update rows matching a filter
 */
export async function dbUpdate<T>(
  table: string,
  filter: string, // e.g. 'id=eq.some-uuid'
  payload: Partial<T>,
  opts: SupabaseQueryOptions = {}
): Promise<{ data: T[] | null; error: string | null }> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const result = await supabaseFetch<T[]>(url, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    useServiceKey: true,
    ...opts,
  });
  return { data: result.data, error: result.error };
}

/**
 * Delete rows matching a filter
 */
export async function dbDelete(
  table: string,
  filter: string,
  opts: SupabaseQueryOptions = {}
): Promise<{ error: string | null }> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const result = await supabaseFetch(url, {
    method: 'DELETE',
    useServiceKey: true,
    ...opts,
  });
  return { error: result.error };
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
