import './globals.css'
import { Inter, Noto_Kufi_Arabic } from 'next/font/google'
import SmoothScroll from '@/components/SmoothScroll'
import CartProvider from '@/components/CartProvider'
import type { Metadata } from 'next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const notoKufi = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-arabic',
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  preload: true,
})

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxury-os.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'شَامِخ | الفخامة الحقيقية',
    template: '%s | شامخ الفاخر',
  },
  description: 'اكتشف أرقى المنتجات الفاخرة في السعودية والخليج. عطور ملكية، ساعات نادرة، مجوهرات حصرية — مع توصيل فاخر وضمان ذهبي ممتد.',
  keywords: ['متجر فاخر', 'عطور فاخرة', 'ساعات فاخرة', 'شامخ', 'luxury store saudi arabia', 'مجوهرات حصرية', 'عود فاخر'],
  authors: [{ name: 'شامخ الفاخر' }],
  creator: 'SHAMIKH LUXURY OS',
  publisher: 'شامخ الفاخر',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: BASE_URL,
    siteName: 'شامخ الفاخر',
    title: 'شَامِخ | الفخامة الحقيقية',
    description: 'اكتشف أرقى المنتجات الفاخرة في السعودية والخليج. عطور ملكية، ساعات نادرة، مجوهرات حصرية.',
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'شامخ الفاخر — الفخامة الحقيقية',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'شَامِخ | الفخامة الحقيقية',
    description: 'اكتشف أرقى المنتجات الفاخرة في السعودية والخليج.',
    images: [`${BASE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'ar-SA': BASE_URL,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.variable} ${notoKufi.variable} font-arabic bg-light text-dark antialiased`}>

        <SmoothScroll>
          <CartProvider>
            {children}
          </CartProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}