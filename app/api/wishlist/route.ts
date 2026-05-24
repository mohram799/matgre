import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/wishlist
 * Add a product to the user's wishlist in Supabase
 *
 * GET /api/wishlist?phone=xxx
 * Fetch a user's wishlist from Supabase
 */

export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ wishlist: [], mode: 'mock' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // 1. Find user by phone
      const userRes = await fetch(
        `${supabaseUrl}/rest/v1/users?phone=eq.${encodeURIComponent(phone)}&select=id`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );

      if (userRes.ok) {
        const users = await userRes.json();
        if (users.length > 0) {
          const userId = users[0].id;

          // 2. Fetch wishlist with product details
          const wishRes = await fetch(
            `${supabaseUrl}/rest/v1/wishlists?user_id=eq.${userId}&select=*,products(id,title,slug,price,old_price,images)`,
            { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
          );

          if (wishRes.ok) {
            const wishlist = await wishRes.json();
            return NextResponse.json({ wishlist, mode: 'supabase' });
          }
        }
      }
    }

    return NextResponse.json({ wishlist: [], mode: 'mock' });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل جلب قائمة الأمنيات', detail: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId, userPhone } = await req.json();

    if (!productId || !userPhone) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Ensure user exists
      const userRes = await fetch(
        `${supabaseUrl}/rest/v1/users?phone=eq.${encodeURIComponent(userPhone)}&select=id`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );

      if (userRes.ok) {
        const users = await userRes.json();
        if (users.length > 0) {
          const userId = users[0].id;

          const insertRes = await fetch(`${supabaseUrl}/rest/v1/wishlists`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Prefer: 'return=representation',
            },
            body: JSON.stringify({ user_id: userId, product_id: productId }),
          });

          if (insertRes.ok || insertRes.status === 409) { // 409 = already exists (unique constraint)
            return NextResponse.json({ success: true, mode: 'supabase' });
          }
        }
      }
    }

    return NextResponse.json({ success: true, mode: 'mock' });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل إضافة المنتج لقائمة الأمنيات', detail: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { productId, userPhone } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && productId && userPhone) {
      const userRes = await fetch(
        `${supabaseUrl}/rest/v1/users?phone=eq.${encodeURIComponent(userPhone)}&select=id`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );

      if (userRes.ok) {
        const users = await userRes.json();
        if (users.length > 0) {
          const userId = users[0].id;
          await fetch(
            `${supabaseUrl}/rest/v1/wishlists?user_id=eq.${userId}&product_id=eq.${productId}`,
            {
              method: 'DELETE',
              headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
            }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل حذف المنتج', detail: err.message }, { status: 500 });
  }
}
