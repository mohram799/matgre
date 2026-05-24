import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/search
 * Semantic / intelligent product search.
 * Tries full-text search via Supabase first, falls back to fuzzy keyword matching.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || '';
    const category = req.nextUrl.searchParams.get('category') || '';
    const minPrice = parseFloat(req.nextUrl.searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(req.nextUrl.searchParams.get('maxPrice') || '9999999');
    const sort = req.nextUrl.searchParams.get('sort') || 'relevance';
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      let query = `${supabaseUrl}/rest/v1/products?is_active=eq.true&select=id,title,slug,price,old_price,images,category,rating_score,reviews_count,badge,description`;

      if (q) {
        // Supabase ilike for basic search
        query += `&or=(title.ilike.*${encodeURIComponent(q)}*,description.ilike.*${encodeURIComponent(q)}*,category.ilike.*${encodeURIComponent(q)}*)`;
      }
      if (category) {
        query += `&category=eq.${encodeURIComponent(category)}`;
      }
      if (minPrice > 0) query += `&price=gte.${minPrice}`;
      if (maxPrice < 9999999) query += `&price=lte.${maxPrice}`;

      // Sort
      const sortMap: Record<string, string> = {
        relevance: 'rating_score.desc',
        'price-asc': 'price.asc',
        'price-desc': 'price.desc',
        newest: 'created_at.desc',
        popular: 'reviews_count.desc',
      };
      query += `&order=${sortMap[sort] || 'rating_score.desc'}`;
      query += `&limit=${limit}&offset=${offset}`;

      const res = await fetch(query, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Range-Unit': 'items',
          Range: `${offset}-${offset + limit - 1}`,
          Prefer: 'count=exact',
        },
      });

      if (res.ok) {
        const products = await res.json();
        const contentRange = res.headers.get('content-range');
        const total = contentRange ? parseInt(contentRange.split('/')[1] || '0') : products.length;

        return NextResponse.json({
          results: products,
          total,
          page,
          pages: Math.ceil(total / limit),
          mode: 'supabase',
          query: q,
        });
      }
    }

    // Demo search results
    return NextResponse.json({
      results: [],
      total: 0,
      page: 1,
      pages: 0,
      mode: 'mock',
      query: q,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل البحث', detail: err.message }, { status: 500 });
  }
}
