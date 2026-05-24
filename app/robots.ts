import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxury-os.com';

/**
 * SHAMIKH LUXURY OS — Robots.txt Generator
 * Controls crawler access:
 *  - Allow all product, collection, and content pages
 *  - Block admin, auth, API, and faceted filter URLs to conserve crawl budget
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/products', '/product/', '/gifts/', '/about', '/policies'],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/checkout/',
          '/profile/',
          '/_next/',
          '/test/',
          '/_tenants/',
          '/products?*sort=*',      // Block sort-only faceted URLs
          '/products?*page=*',      // Block pagination (use canonical instead)
        ],
      },
      {
        // Allow Google's image bot full access
        userAgent: 'Googlebot-Image',
        allow: '/uploads/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
