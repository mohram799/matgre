import { MetadataRoute } from 'next';
import { ProductDb } from '@/components/ProductDb';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxury-os.com';

/**
 * SHAMIKH LUXURY OS — Dynamic Sitemap Generator
 * Auto-generates sitemap.xml for all products, collections, and static pages.
 * Runs at edge/build time — Googlebot discovers new pages within minutes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ─── Static Priority Pages ─────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/policies`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/checkout`,
      lastModified: now,
      changeFrequency: 'never',
      priority: 0.3,
    },
  ];

  // ─── Programmatic Collection Pages ────────────────────────────────────────
  const categories = [
    'perfumes',
    'watches',
    'bags',
    'jewelry',
    'accessories',
    'bakhoor',
    'limited-edition',
    'exclusive-perfumes',
    'rare-jewelry',
  ];

  const collectionPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/products?category=${cat}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // ─── Programmatic Gift Pages (Semantic SEO Long-Tail) ─────────────────────
  const giftPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/gifts/vip`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/gifts/wedding`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${BASE_URL}/gifts/eid`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/gifts/corporate`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // ─── Product Detail Pages ─────────────────────────────────────────────────
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const products = ProductDb.getProducts();
    productPages = products.map((product) => ({
      url: `${BASE_URL}/product/${product.slug || product.id}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch {
    // Supabase not configured — skip product pages in sitemap
  }

  return [
    ...staticPages,
    ...collectionPages,
    ...giftPages,
    ...productPages,
  ];
}
