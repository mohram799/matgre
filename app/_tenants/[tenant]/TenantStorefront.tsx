'use client';

/**
 * SHAMIKH LUXURY OS — Tenant Storefront UI
 * Renders a fully branded, tenant-isolated luxury storefront.
 * Theming, logo, product catalog, and WhatsApp CTA are all tenant-driven.
 */

import { useState } from 'react';
import type { TenantConfig } from './page';

interface TenantProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  slug: string;
  avg_rating: number;
  category: string;
  stock_quantity: number;
}

interface TenantStorefrontProps {
  config: TenantConfig;
  products: TenantProduct[];
}

export default function TenantStorefront({ config, products }: TenantStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const primary = config.primary_color || '#c9a84c';
  const accent = config.accent_color || '#1a1a2e';

  const whatsappUrl = config.whatsapp_number
    ? `https://wa.me/${config.whatsapp_number.replace(/\D/g, '')}?text=السلام عليكم، أريد الاستفسار عن منتج من متجر ${config.store_name}`
    : null;

  return (
    <div
      style={{ '--tenant-primary': primary, '--tenant-accent': accent } as React.CSSProperties}
      className="min-h-screen bg-[#0a0a0f] text-white font-sans"
      dir="rtl"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ background: `${accent}cc`, borderColor: `${primary}33` }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.store_name} className="h-10 w-auto object-contain" />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black"
                style={{ background: primary }}
              >
                {config.store_name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: primary }}>
                {config.store_name_ar || config.store_name}
              </h1>
              {config.tagline_ar && (
                <p className="text-xs text-white/50">{config.tagline_ar}</p>
              )}
            </div>
          </div>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{ background: primary, color: '#000' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.552 4.103 1.517 5.826L.057 23.5l5.835-1.53C7.601 22.885 9.76 23.5 12 23.5 18.627 23.5 24 18.127 24 11.5S18.627 0 12 0zm0 21.5c-1.85 0-3.576-.5-5.065-1.372l-.363-.216-3.765.987 1.006-3.679-.237-.378C2.566 15.203 2 13.669 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              تواصل معنا
            </a>
          )}
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        className="relative py-24 px-6 text-center overflow-hidden"
        style={{
          background: config.hero_image_url
            ? `url(${config.hero_image_url}) center/cover no-repeat`
            : `linear-gradient(135deg, ${accent} 0%, #0a0a0f 60%, ${primary}22 100%)`,
        }}
      >
        {config.hero_image_url && <div className="absolute inset-0 bg-black/60" />}
        <div className="relative z-10 max-w-3xl mx-auto">
          <div
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6 uppercase tracking-widest"
            style={{ background: `${primary}22`, color: primary, border: `1px solid ${primary}44` }}
          >
            {config.plan === 'enterprise' ? '⚜️ Enterprise Store' : config.plan === 'growth' ? '🌟 Growth Store' : '✦ Starter Store'}
          </div>
          <h2 className="text-5xl font-black mb-4" style={{ color: primary }}>
            {config.store_name_ar || config.store_name}
          </h2>
          <p className="text-xl text-white/70 mb-8">
            {config.tagline_ar || 'تسوق أفخر المنتجات بأسعار حصرية'}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-xl text-white placeholder-white/40 border text-right focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: `${primary}44`, ['--tw-ring-color' as string]: primary }}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
          </div>
        </div>
      </section>

      {/* ── Product Grid ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-bold text-white">
            {searchQuery ? `نتائج "${searchQuery}"` : 'المنتجات المميزة'}
          </h3>
          <span className="text-sm text-white/40">{filtered.length} منتج</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl">لا توجد منتجات مطابقة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(product => (
              <TenantProductCard key={product.id} product={product} primary={primary} whatsappUrl={whatsappUrl} storeName={config.store_name_ar || config.store_name} />
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
        <p>© {new Date().getFullYear()} {config.store_name_ar || config.store_name} — مدعوم بـ SHAMIKH LUXURY OS</p>
      </footer>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function TenantProductCard({
  product,
  primary,
  whatsappUrl,
  storeName,
}: {
  product: TenantProduct;
  primary: string;
  whatsappUrl: string | null;
  storeName: string;
}) {
  const image = product.images?.[0] || '/placeholder.jpg';
  const orderLink = whatsappUrl
    ? `${whatsappUrl}&text=السلام عليكم، أريد طلب: ${encodeURIComponent(product.title)} من ${storeName}`
    : null;

  return (
    <div className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[var(--tenant-primary)] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-white/5">
        <img
          src={image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
      </div>

      {/* Stock badge */}
      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
        <div className="absolute top-3 right-3 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
          آخر {product.stock_quantity} قطع
        </div>
      )}
      {product.stock_quantity === 0 && (
        <div className="absolute top-3 right-3 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          نفد المخزون
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        <h4 className="font-semibold text-white text-sm leading-tight mb-2 line-clamp-2 text-right">
          {product.title}
        </h4>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-white/40">{product.category}</span>
          <span className="text-lg font-black" style={{ color: primary }}>
            {product.price.toLocaleString('ar-SA')} ر.س
          </span>
        </div>
        {product.avg_rating > 0 && (
          <div className="flex items-center gap-1 mt-1 justify-end">
            {'★'.repeat(Math.round(product.avg_rating))}<span className="text-xs text-white/40 mr-1">{product.avg_rating.toFixed(1)}</span>
          </div>
        )}

        {/* CTA */}
        {orderLink && product.stock_quantity > 0 && (
          <a
            href={orderLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-3 py-2 rounded-xl text-xs font-bold text-center transition-all hover:opacity-90 active:scale-95"
            style={{ background: primary, color: '#000' }}
          >
            اطلب الآن عبر واتساب
          </a>
        )}
      </div>
    </div>
  );
}
