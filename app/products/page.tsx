import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProductsClient from '@/components/ProductsClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxury-os.com';

// ─── STATIC METADATA FOR CATALOG PAGE ───
export const metadata: Metadata = {
  title: 'التشكيلة الفاخرة والمقتنيات الاستثنائية | شامخ',
  description: 'تصفح الكتالوج الكامل للقطع الحصرية وعطور النخبة الفاخرة والمجوهرات الملكية النادرة. اقتن مقتنيات مصممة لتصنع الفارق بضمان الذهبي الأصيل وتوصيل ملكي.',
  alternates: {
    canonical: `${BASE_URL}/products`,
  },
  openGraph: {
    title: 'التشكيلة الفاخرة والمقتنيات الاستثنائية | شامخ',
    description: 'تصفح الكتالوج الكامل للقطع الحصرية وعطور النخبة الفاخرة والمجوهرات الملكية النادرة.',
    url: `${BASE_URL}/products`,
    type: 'website',
    siteName: 'شامخ الفاخر',
  },
};

export default function ProductsPage() {
  // ─── BREADCRUMB SCHEMA FOR CATALOG ───
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'التشكيلة الفاخرة',
        item: `${BASE_URL}/products`,
      },
    ],
  };

  return (
    <>
      {/* Breadcrumb Rich Snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Suspense fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#C5A059]" size={48} />
        </div>
      }>
        <ProductsClient />
      </Suspense>
    </>
  );
}
