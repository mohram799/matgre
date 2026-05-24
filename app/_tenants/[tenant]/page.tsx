/**
 * SHAMIKH LUXURY OS — SaaS Multi-Tenant Dynamic Store Router
 * Route: /_tenants/[tenant]/[...path]
 *
 * Serves tenant-specific storefront experiences.
 * Each tenant gets isolated product catalog, theme colors, and brand identity.
 * Tenant config is loaded from the `saas_tenants` table via subdomain key.
 */

import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import TenantStorefront from './TenantStorefront';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantConfig {
  id: string;
  subdomain: string;
  store_name: string;
  store_name_ar: string;
  tagline: string;
  tagline_ar: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  hero_image_url: string | null;
  plan: 'starter' | 'growth' | 'enterprise';
  is_active: boolean;
  monthly_product_limit: number;
  whatsapp_number: string | null;
  custom_domain: string | null;
}

// ─── Supabase Server Client ───────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Fetch Tenant Config ──────────────────────────────────────────────────────

async function getTenantConfig(subdomain: string): Promise<TenantConfig | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('saas_tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as TenantConfig;
}

// ─── Fetch Tenant Products ───────────────────────────────────────────────────

async function getTenantProducts(tenantId: string, limit = 24) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data } = await supabase
    .from('products')
    .select('id, title, price, images, slug, avg_rating, category, stock_quantity')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('avg_rating', { ascending: false })
    .limit(limit);

  return data || [];
}

// ─── Page Props ───────────────────────────────────────────────────────────────

interface TenantPageProps {
  params: { tenant: string; path?: string[] };
}

// ─── Page Component (Server Component) ───────────────────────────────────────

export default async function TenantPage({ params }: TenantPageProps) {
  const { tenant } = params;

  const config = await getTenantConfig(tenant);

  if (!config) {
    notFound();
  }

  const products = await getTenantProducts(config.id);

  return <TenantStorefront config={config} products={products} />;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: TenantPageProps) {
  const config = await getTenantConfig(params.tenant);

  if (!config) {
    return { title: 'Store Not Found' };
  }

  return {
    title: `${config.store_name} — متجر فاخر`,
    description: config.tagline_ar || config.tagline || `تسوق في ${config.store_name}`,
    openGraph: {
      title: config.store_name,
      description: config.tagline_ar || config.tagline,
      images: config.logo_url ? [{ url: config.logo_url }] : [],
    },
  };
}
