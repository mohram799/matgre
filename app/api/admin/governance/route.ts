/**
 * SHAMIKH LUXURY OS — SaaS Tenant Provisioning & Governance API
 * Route: /api/admin/governance
 *
 * GET: Retrieve aggregate metrics, subscription distributions, and tenant list.
 * POST: Provision a new luxury tenant store (subdomain, quota mapping, starter seed catalog).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { sentry } from '@/lib/sentry';

export const runtime = 'nodejs';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── ADMIN AUTH GUARD ────────────────────────────────────────────────────────

async function verifySuperAdmin(req: NextRequest): Promise<boolean> {
  const accessToken = req.cookies.get('shamikh_access_token')?.value;
  if (!accessToken) return false;

  const payload = await verifyJWT(accessToken) as any;
  if (!payload || payload.role !== 'SUPER_ADMIN') {
    return false;
  }
  return true;
}

// ─── GET: SaaS Platform Governance Summary ───────────────────────────────────

export async function GET(req: NextRequest) {
  const authorized = await verifySuperAdmin(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Requires SUPER_ADMIN privileges' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    // 1. Fetch tenants count & plan distribution
    const { data: tenants } = await supabase
      .from('saas_tenants')
      .select('id, subdomain, store_name, plan, is_active, created_at');

    const totalTenants = tenants?.length || 0;
    const planCounts = { starter: 0, growth: 0, enterprise: 0 };
    tenants?.forEach(t => {
      const plan = (t.plan || 'starter') as keyof typeof planCounts;
      if (planCounts[plan] !== undefined) planCounts[plan]++;
    });

    // 2. Fetch billing quota usage
    const { data: billing } = await supabase
      .from('tenant_billing')
      .select('tenant_id, current_product_count, max_product_quota, billing_status');

    let totalProductsCount = 0;
    let quotaAlertsCount = 0;

    billing?.forEach(b => {
      totalProductsCount += b.current_product_count || 0;
      if ((b.current_product_count || 0) >= (b.max_product_quota || 100)) {
        quotaAlertsCount++;
      }
    });

    return NextResponse.json({
      summary: {
        totalTenants,
        totalProductsCount,
        quotaAlertsCount,
        planDistribution: planCounts,
      },
      tenants: tenants || [],
      billingUsage: billing || [],
    });
  } catch (err: any) {
    sentry.captureError(err, { message: 'SaaS Governance metrics fetch failure' });
    return NextResponse.json({ error: 'Failed to build governance report' }, { status: 500 });
  }
}

// ─── POST: Provision New Luxury Tenant Store ─────────────────────────────────

export async function POST(req: NextRequest) {
  const authorized = await verifySuperAdmin(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Requires SUPER_ADMIN privileges' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.subdomain || !body?.storeName || !body?.storeNameAr) {
    return NextResponse.json({ error: 'Subdomain, storeName, and storeNameAr are required parameters' }, { status: 400 });
  }

  const { subdomain, storeName, storeNameAr, plan = 'starter', whatsappNumber } = body;
  const normalizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    // 1. Check if subdomain already exists
    const { data: existing } = await supabase
      .from('saas_tenants')
      .select('id')
      .eq('subdomain', normalizedSubdomain)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Subdomain "${normalizedSubdomain}" is already registered` }, { status: 409 });
    }

    // 2. Insert new tenant
    const { data: tenant, error: tenantErr } = await supabase
      .from('saas_tenants')
      .insert({
        subdomain: normalizedSubdomain,
        store_name: storeName,
        store_name_ar: storeNameAr,
        plan,
        whatsapp_number: whatsappNumber || null,
        is_active: true,
        monthly_product_limit: plan === 'enterprise' ? 1000 : plan === 'growth' ? 300 : 50,
      })
      .select('*')
      .single();

    if (tenantErr) throw new Error(tenantErr.message);

    // 3. Initialize billing quota
    const { error: billingErr } = await supabase
      .from('tenant_billing')
      .insert({
        tenant_id: tenant.id,
        subscription_plan: plan,
        max_product_quota: tenant.monthly_product_limit,
        current_product_count: 0,
        billing_status: 'active',
      });

    if (billingErr) throw new Error(billingErr.message);

    // 4. Seed basic starter product catalog for the tenant
    const starterProducts = [
      {
        tenant_id: tenant.id,
        title: `عطر مسك ملكي — متجر ${storeNameAr}`,
        price: 250,
        images: ['https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=600'],
        stock_quantity: 20,
        slug: `royal-musk-${normalizedSubdomain}`,
        category: 'perfumes',
        avg_rating: 5,
        is_active: true,
      },
      {
        tenant_id: tenant.id,
        title: `بخور عود فاخر — متجر ${storeNameAr}`,
        price: 490,
        images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600'],
        stock_quantity: 15,
        slug: `luxury-oud-${normalizedSubdomain}`,
        category: 'bakhoor',
        avg_rating: 4.8,
        is_active: true,
      }
    ];

    const { error: seedErr } = await supabase.from('products').insert(starterProducts);
    if (seedErr) {
      console.warn('[GOVERNANCE] Failed to seed starter product catalog:', seedErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Luxury tenant provisioned and seeded successfully.',
      tenant,
      subdomain: normalizedSubdomain,
      seedingStatus: seedErr ? 'failed' : 'success',
    });
  } catch (err: any) {
    sentry.captureError(err, { message: 'Tenant provisioning execution failure' });
    return NextResponse.json({ error: 'Failed to provision tenant' }, { status: 500 });
  }
}
