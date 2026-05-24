import { Metadata } from 'next';
import { ProductDb } from '@/components/ProductDb';
import ProductDetailClient from '@/components/ProductDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxury-os.com';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// ─── Cinematic fallback data ───
const getProduct = (slug: string) => {
  const localProd = ProductDb.getProductBySlugOrId(slug);
  if (localProd) {
    return {
      id: String(localProd.id),
      name: localProd.name,
      price: localProd.price,
      priceStr: `${localProd.price.toLocaleString()} ر.س`,
      description: localProd.description,
      images: localProd.images && localProd.images.length > 0 ? localProd.images : [localProd.img],
      category: localProd.category,
      stock: localProd.stock,
    };
  }

  // Pure fallback
  return {
    id: String(slug || 'fallback'),
    name: 'دهن عود سيوفي معتق',
    price: 2500,
    priceStr: '2,500 ر.س',
    description: 'تحفة عطرية لا تتكرر. تم استخلاصه من غابات أندونيسيا المعزولة، وتم تعتيقه تحت الأرض لمدة 15 عاماً ليمنحك رائحة لا تُنسى وثباتاً يدوم طويلاً.',
    images: [
      'https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=2000&q=100',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=90',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=90'
    ],
    category: 'إصدار حصري (Exclusive Edition)',
    stock: 3
  };
};

// ─── DYNAMIC METADATA GENERATION ───
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProduct(params.slug);
  const title = `⚜️ ${product.name} | شامخ الفاخر`;
  const description = `${product.description.slice(0, 150)}... اقتن الفخامة المطلقة مع شحن ملكي سريع وضمان ذهبي ممتد.`;
  const canonicalUrl = `https://luxury-os.com/product/${params.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: product.images[0], width: 1200, height: 630, alt: product.name }],
      type: 'website',
      siteName: 'شامخ الفاخر',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.images[0]],
    },
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProduct(params.slug);

  // ─── JSON-LD Product Structured Data ───
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    sku: `SH-${product.id}`,
    mpn: `SH-MPN-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'شامخ الفاخر',
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/product/${params.slug}`,
      priceCurrency: 'SAR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'شامخ الفاخر',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '128',
    },
  };

  // ─── JSON-LD Breadcrumb Structured Data ───
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
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${BASE_URL}/product/${params.slug}`,
      },
    ],
  };

  return (
    <>
      {/* Inject Product and Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}

