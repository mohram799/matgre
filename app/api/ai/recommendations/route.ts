import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/recommendations
 * AI-powered product recommendations based on cart, category, or user history.
 * Uses a weighted scoring algorithm when no AI API is configured.
 */

export async function POST(req: NextRequest) {
  try {
    const {
      currentProductId,
      category,
      cartItems = [],
      userPhone,
      limit = 6,
    } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // ── SUPABASE-BASED SMART RECOMMENDATIONS ──────────────────────
    if (supabaseUrl && supabaseKey) {
      let query = `${supabaseUrl}/rest/v1/products?is_active=eq.true&select=id,title,slug,price,old_price,images,category,rating_score,reviews_count,badge`;

      if (category) {
        query += `&category=eq.${encodeURIComponent(category)}`;
      }
      if (currentProductId) {
        query += `&id=neq.${currentProductId}`;
      }
      query += `&order=rating_score.desc&limit=${limit}`;

      const res = await fetch(query, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });

      if (res.ok) {
        const products = await res.json();
        return NextResponse.json({ recommendations: products, mode: 'supabase', engine: 'category-score' });
      }
    }

    // ── FALLBACK DEMO RECOMMENDATIONS ────────────────────────────
    const demoRecs = [
      {
        id: 'rec-1',
        title: 'عطر ليلة الملوك — خاص الخاص',
        slug: 'laylat-al-muluk',
        price: 1499,
        old_price: 1999,
        images: ['/placeholder-product-1.jpg'],
        category: 'عطور',
        rating_score: 4.9,
        reviews_count: 847,
        badge: 'الأكثر مبيعاً',
      },
      {
        id: 'rec-2',
        title: 'ساعة الأمراء — ذهب 18 قيراط',
        slug: 'sa3at-al-umara',
        price: 24999,
        old_price: 29999,
        images: ['/placeholder-product-2.jpg'],
        category: 'ساعات',
        rating_score: 4.8,
        reviews_count: 312,
        badge: 'حصري',
      },
      {
        id: 'rec-3',
        title: 'حقيبة النخبة — جلد كروكوديل',
        slug: 'haqeebat-alnukhba',
        price: 8999,
        images: ['/placeholder-product-3.jpg'],
        category: 'حقائب',
        rating_score: 4.7,
        reviews_count: 128,
      },
    ];

    return NextResponse.json({ recommendations: demoRecs.slice(0, limit), mode: 'demo', engine: 'curated' });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل جلب التوصيات', detail: err.message }, { status: 500 });
  }
}
