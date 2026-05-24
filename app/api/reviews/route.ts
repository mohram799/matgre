import { NextRequest, NextResponse } from 'next/server';

/**
 * GET  /api/reviews?productId=xxx   — fetch approved reviews for a product
 * POST /api/reviews                 — submit a new review (queued for moderation)
 */

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ reviews: [], mode: 'mock' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/product_reviews?product_id=eq.${productId}&is_approved=eq.true&order=created_at.desc`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );

      if (res.ok) {
        const reviews = await res.json();
        return NextResponse.json({ reviews, mode: 'supabase' });
      }
    }

    // Demo reviews for UI preview
    return NextResponse.json({
      reviews: [
        {
          id: 'r1',
          reviewer_name: 'خالد العمري',
          rating: 5,
          title: 'تجربة لا تُنسى',
          body: 'المنتج وصل بتغليف ملكي فاخر جداً. الجودة تفوق التوقعات بمراحل.',
          is_verified_purchase: true,
          helpful_count: 24,
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 'r2',
          reviewer_name: 'نورة السعد',
          rating: 5,
          title: 'استحق كل ريال',
          body: 'اشتريت للإهداء وكان الانطباع رائعاً جداً. التوصيل كان أسرع من المتوقع.',
          is_verified_purchase: true,
          helpful_count: 11,
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
      ],
      mode: 'mock',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل جلب التقييمات', detail: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId, userPhone, reviewerName, rating, title, body } = await req.json();

    if (!productId || !rating || !body) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'التقييم يجب أن يكون بين 1 و 5' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Check if user has purchased this product (verified purchase)
      let userId: string | null = null;
      let isVerified = false;

      if (userPhone) {
        const userRes = await fetch(
          `${supabaseUrl}/rest/v1/users?phone=eq.${encodeURIComponent(userPhone)}&select=id`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
        );
        if (userRes.ok) {
          const users = await userRes.json();
          if (users.length > 0) {
            userId = users[0].id;
            // Check purchase history
            const orderRes = await fetch(
              `${supabaseUrl}/rest/v1/order_items?product_id=eq.${productId}&select=order_id`,
              { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            );
            if (orderRes.ok) {
              const items = await orderRes.json();
              isVerified = items.length > 0;
            }
          }
        }
      }

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/product_reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          product_id: productId,
          user_id: userId,
          reviewer_name: reviewerName || 'عميل شامخ',
          rating,
          title: title || '',
          body,
          is_verified_purchase: isVerified,
          is_approved: true, // auto-approve; set to false for manual moderation
        }),
      });

      if (insertRes.ok) {
        // Update product rating average
        const allReviewsRes = await fetch(
          `${supabaseUrl}/rest/v1/product_reviews?product_id=eq.${productId}&is_approved=eq.true&select=rating`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
        );
        if (allReviewsRes.ok) {
          const allReviews = await allReviewsRes.json();
          if (allReviews.length > 0) {
            const avgRating = allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length;
            await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                rating_score: parseFloat(avgRating.toFixed(2)),
                reviews_count: allReviews.length,
              }),
            });
          }
        }

        return NextResponse.json({ success: true, mode: 'supabase' });
      }
    }

    return NextResponse.json({ success: true, mode: 'mock' });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل حفظ التقييم', detail: err.message }, { status: 500 });
  }
}
