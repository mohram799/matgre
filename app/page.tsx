import { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxury-os.com';

// ─── STATIC METADATA FOR HOME PAGE ───
export const metadata: Metadata = {
  title: 'شَامِخ الفاخر | منصة الفخامة الحقيقية والنوادر',
  description: 'البوابة الرقمية الأولى لأرقى المقتنيات الفاخرة في السعودية والخليج. استكشف دهن العود المعتق، ساعات النخبة السويسرية، ومجوهرات الألماس الملكي الحصرية مع شحن VIP مجاني وضمان أصالة ممتد.',
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'شَامِخ الفاخر | منصة الفخامة الحقيقية والنوادر',
    description: 'البوابة الرقمية الأولى لأرقى المقتنيات الفاخرة في السعودية والخليج. استكشف عطور النخبة والساعات النادرة والمجوهرات الحصرية.',
    url: BASE_URL,
    type: 'website',
    siteName: 'شامخ الفاخر',
  },
};

export default function HomePage() {
  // ─── JSON-LD Structured Data Schema ───
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'شامخ الفاخر | SHAMIKH LUXURY OS',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${BASE_URL}/#store`,
    name: 'شامخ الفاخر',
    url: BASE_URL,
    logo: `${BASE_URL}/og-image.jpg`,
    description: 'البوابة الرقمية الأولى لأرقى المقتنيات الفاخرة في السعودية والخليج.',
    telephone: '+966-500000000',
    priceRange: '$$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'طريق الملك فهد، حي العليا',
      addressLocality: 'الرياض',
      addressRegion: 'منطقة الرياض',
      postalCode: '11564',
      addressCountry: 'SA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 24.6877,
      longitude: 46.7219,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      opens: '00:00',
      closes: '23:59',
    },
    sameAs: [
      'https://instagram.com/shamikh.luxury',
      'https://twitter.com/shamikh_luxury',
    ],
  };

  return (
    <>
      {/* Dynamic SEO JSON-LD Injections */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      <HomeClient />
    </>
  );
}