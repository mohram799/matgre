import { NextRequest, NextResponse } from 'next/server';
import { dbSelect, dbInsert, dbUpdate, dbDelete, isSupabaseConfigured, supabaseUrl, supabaseFetch, DbProduct } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';
import { validateBody, productCreateSchema } from '@/lib/validators';

// ─── GET /api/products ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'GET:/api/products', 'API');
  if (limitRes) return limitRes;

  const { searchParams } = req.nextUrl;
  const category  = searchParams.get('category');
  const search    = searchParams.get('search');
  const featured  = searchParams.get('featured');
  const limit     = Math.min(parseInt(searchParams.get('limit') || '48'), 100);
  const offset    = parseInt(searchParams.get('offset') || '0');
  const sortBy    = searchParams.get('sort') || 'sales_count';
  const order     = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

  if (!isSupabaseConfigured()) {
    // Return rich mock data when Supabase not configured (dev mode)
    const MOCK_PRODUCTS: Partial<DbProduct>[] = [
      {
        id: 'mock-1', title: 'Royal Oud Perfume', title_ar: 'عطر العود الملكي', slug: 'royal-oud',
        price: 2500, compare_at_price: 3200, images: ['https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=600&q=80'],
        avg_rating: 4.9, reviews_count: 34, sales_count: 142, is_featured: true,
        status: 'active', stock_quantity: 50, tags: ['perfume', 'oud', 'luxury'], category_id: 'exclusive-perfumes'
      },
      {
        id: 'mock-2', title: 'Omega Classic Elite Watch', title_ar: 'ساعة أوميغا كلاسيك الفاخرة', slug: 'omega-watch',
        price: 34000, compare_at_price: 42000, images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80'],
        avg_rating: 5.0, reviews_count: 6, sales_count: 18, is_featured: true,
        status: 'active', stock_quantity: 5, tags: ['watch', 'omega', 'luxury'], category_id: 'elite-watches'
      },
      {
        id: 'mock-3', title: 'Crocodile Royal Handbag', title_ar: 'حقيبة يد جلد تمساح ملكية', slug: 'royal-handbag',
        price: 85000, images: ['https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=80'],
        avg_rating: 4.8, reviews_count: 2, sales_count: 3, is_featured: true,
        status: 'active', stock_quantity: 2, tags: ['handbag', 'leather', 'rare'], category_id: 'limited-edition'
      },
      {
        id: 'mock-4', title: 'Diamond Crown Ring', title_ar: 'خاتم ألماس التاج الملكي', slug: 'diamond-ring',
        price: 120000, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'],
        avg_rating: 4.95, reviews_count: 8, sales_count: 11, is_featured: false,
        status: 'active', stock_quantity: 3, tags: ['ring', 'diamond', 'jewelry'], category_id: 'rare-jewelry'
      },
    ];

    let results = MOCK_PRODUCTS;
    if (featured === 'true') results = results.filter(p => p.is_featured);
    if (category) results = results.filter(p => p.category_id === category);
    if (search) results = results.filter(p =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.title_ar?.includes(search)
    );

    return NextResponse.json({
      products: results.slice(offset, offset + limit),
      total: results.length,
      mode: 'mock',
    });
  }

  // ── Real Supabase Query ──────────────────────────────────────────────────
  const params: Record<string, string> = {
    select: '*',
    status: 'eq.active',
    order: `${sortBy}.${order}`,
    limit: String(limit),
    offset: String(offset),
  };

  if (category) params['category_id'] = `eq.${category}`;
  if (featured === 'true') params['is_featured'] = 'eq.true';

  let url = supabaseUrl('products', params);
  if (search) url += `&or=(title.ilike.*${encodeURIComponent(search)}*,title_ar.ilike.*${encodeURIComponent(search)}*)`;

  const { data, error } = await supabaseFetch<DbProduct[]>(url);

  if (error) {
    return NextResponse.json({ error: 'فشل تحميل المنتجات', detail: error }, { status: 500 });
  }

  return NextResponse.json({
    products: data || [],
    total: data?.length || 0,
    offset,
    limit,
    mode: 'supabase',
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
  });
}

// ─── POST /api/products (Admin only - create product) ────────────────────────
export async function POST(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'POST:/api/products', 'ADMIN');
  if (limitRes) return limitRes;

  const adminHeader = req.headers.get('x-admin-user');
  if (!adminHeader) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const bodyOrError = await validateBody(req, productCreateSchema);
  if (bodyOrError instanceof Response) return bodyOrError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      product: { id: `mock-${Date.now()}`, ...bodyOrError, created_at: new Date().toISOString() },
      message: 'تم إضافة المنتج بنجاح (وضع المحاكاة)',
      mode: 'mock'
    }, { status: 201 });
  }

  const { data, error } = await dbInsert<DbProduct>('products', {
    ...bodyOrError,
    status: 'active',
    sales_count: 0,
    views_count: 0,
    avg_rating: 0,
    reviews_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: 'فشل إنشاء المنتج', detail: error }, { status: 500 });

  return NextResponse.json({ product: data?.[0], message: 'تم إنشاء المنتج بنجاح', mode: 'supabase' }, { status: 201 });
}

// ─── PATCH /api/products (Admin only - update product) ───────────────────────
export async function PATCH(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'PATCH:/api/products', 'ADMIN');
  if (limitRes) return limitRes;

  const adminHeader = req.headers.get('x-admin-user');
  if (!adminHeader) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, ...updateFields } = body;

  if (!id) return NextResponse.json({ error: 'معرّف المنتج مطلوب للتعديل' }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      product: { id, ...updateFields },
      message: 'تم تعديل المنتج بنجاح (وضع المحاكاة)',
      mode: 'mock'
    });
  }

  const { data, error } = await dbUpdate<DbProduct>('products', `id=eq.${id}`, {
    ...updateFields,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: 'فشل تعديل المنتج', detail: error }, { status: 500 });

  return NextResponse.json({ product: data?.[0], message: 'تم تعديل المنتج بنجاح', mode: 'supabase' });
}

// ─── DELETE /api/products (Admin only - delete product) ───────────────────────
export async function DELETE(req: NextRequest) {
  const limitRes = applyRateLimit(req, 'DELETE:/api/products', 'ADMIN');
  if (limitRes) return limitRes;

  const adminHeader = req.headers.get('x-admin-user');
  if (!adminHeader) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'معرّف المنتج مطلوب للحذف' }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: 'تم حذف المنتج بنجاح (وضع المحاكاة)',
      mode: 'mock'
    });
  }

  const { error } = await dbDelete('products', `id=eq.${id}`);

  if (error) return NextResponse.json({ error: 'فشل حذف المنتج', detail: error }, { status: 500 });

  return NextResponse.json({ message: 'تم حذف المنتج بنجاح', mode: 'supabase' });
}
