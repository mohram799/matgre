/**
 * SHAMIKH LUXURY OS — Instant Search & Discovery API
 * Route: GET /api/search?q=&category=&minPrice=&maxPrice=&limit=
 *
 * Primary: Meilisearch typo-tolerant search cluster
 * Fallback: Supabase ILIKE full-text search
 * Features: Autocomplete, faceted filtering, search analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchEngine, SearchProduct } from '@/lib/meilisearch';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const SEARCH_RATE_LIMIT_REQUESTS = 30;
const SEARCH_RATE_LIMIT_WINDOW_MS = 60_000; // 30 req / min

export const runtime = 'nodejs';

// ─── Supabase Admin Client (service role for search fallback) ─────────────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Supabase Fulltext Fallback Search ───────────────────────────────────────
async function supabaseFallbackSearch(
  query: string,
  category?: string,
  minPrice?: number,
  maxPrice?: number,
  limit = 20
): Promise<{ hits: SearchProduct[]; nbHits: number; mode: 'supabase' }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { hits: [], nbHits: 0, mode: 'supabase' };

  let dbQuery = supabase
    .from('products')
    .select('id, title, price, category, images, stock_quantity, slug, avg_rating')
    .ilike('title', `%${query}%`)
    .eq('is_active', true)
    .order('avg_rating', { ascending: false })
    .limit(limit);

  if (category) dbQuery = dbQuery.eq('category', category);
  if (minPrice !== undefined) dbQuery = dbQuery.gte('price', minPrice);
  if (maxPrice !== undefined) dbQuery = dbQuery.lte('price', maxPrice);

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error('[SHAMIKH SEARCH FALLBACK] Supabase query error:', error.message);
    return { hits: [], nbHits: 0, mode: 'supabase' };
  }

  return {
    hits: (data || []) as SearchProduct[],
    nbHits: count || data?.length || 0,
    mode: 'supabase',
  };
}

// ─── Log Search Analytics ────────────────────────────────────────────────────
async function logSearchAnalytics(
  query: string,
  results: number,
  mode: string,
  ip: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.from('search_analytics').insert({
      query,
      results_count: results,
      search_mode: mode,
      client_ip: ip,
      searched_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[SEARCH] Failed to log search analytics:', e);
  }
}

// ─── GET /api/search ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req);
  const withinLimit = rateLimit(
    `search:${ip}`,
    SEARCH_RATE_LIMIT_REQUESTS,
    SEARCH_RATE_LIMIT_WINDOW_MS
  );

  if (!withinLimit) {
    return NextResponse.json(
      { error: 'Too many search requests. Please wait before searching again.' },
      { status: 429 }
    );
  }

  const { searchParams } = req.nextUrl;
  const query = (searchParams.get('q') || '').trim();
  const category = searchParams.get('category') || undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
  const autocomplete = searchParams.get('autocomplete') === 'true';

  if (!query || query.length < 1) {
    return NextResponse.json(
      { hits: [], nbHits: 0, query: '', mode: 'empty' },
      { status: 200 }
    );
  }

  if (query.length > 200) {
    return NextResponse.json({ error: 'Search query too long.' }, { status: 400 });
  }

  let result: { hits: SearchProduct[]; nbHits: number; mode: string };

  // ── Primary: Meilisearch ──────────────────────────────────────────────────
  const meiliResult = await searchEngine.search(query, { category, minPrice, maxPrice }, limit);

  if (meiliResult.mode === 'meilisearch' && meiliResult.nbHits > 0) {
    result = meiliResult;
  } else {
    // ── Fallback: Supabase ILIKE ──────────────────────────────────────────
    result = await supabaseFallbackSearch(query, category, minPrice, maxPrice, limit);
  }

  // ── Log analytics (fire & forget) ────────────────────────────────────────
  logSearchAnalytics(query, result.nbHits, result.mode, ip).catch(() => null);

  return NextResponse.json(
    {
      query,
      hits: autocomplete ? result.hits.slice(0, 5) : result.hits,
      nbHits: result.nbHits,
      mode: result.mode,
      took_ms: Date.now(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Search-Mode': result.mode,
      },
    }
  );
}

// ─── POST /api/search/index — Sync products to Meilisearch (internal/admin) ──
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const internalKey = process.env.INTERNAL_SYNC_SECRET;

  if (!internalKey || authHeader !== `Bearer ${internalKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, price, category, images, stock_quantity, slug, avg_rating')
    .eq('is_active', true)
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const synced = await searchEngine.syncProducts(products as SearchProduct[]);

  return NextResponse.json({
    success: synced,
    indexed: products?.length || 0,
    syncedAt: new Date().toISOString(),
  });
}
