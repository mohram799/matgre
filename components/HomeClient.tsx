'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import CinematicSequence from '@/components/CinematicSequence';
import DraggableCarousel from '@/components/DraggableCarousel';
import { useCart } from '@/components/CartProvider';
import { ProductDb } from '@/components/ProductDb';

// Fallback Data to preserve the cinematic look if the API is offline or empty
const fallbackBestSellers = [
  {
    id: 1,
    name: 'دهن عود سيوفي معتق',
    price: '2,500 ر.س',
    img: 'https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=600&q=70',
    category: 'إصدار حصري',
  },
  {
    id: 2,
    name: 'ساعة سويسرية مرصعة',
    price: '45,000 ر.س',
    img: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=70',
    category: 'قطعة فريدة',
  },
  {
    id: 3,
    name: 'شنطة جلد تمساح طبيعي',
    price: '12,900 ر.س',
    img: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=70',
    category: 'الأكثر طلباً',
  },
];

const fallbackSpecialOffers = [
  {
    id: 4,
    name: 'طقم ألماس ملكي',
    price: '85,000 ر.س',
    oldPrice: '120,000 ر.س',
    img: 'https://images.unsplash.com/photo-1599643478514-4a4e09d52f78?w=600&q=70',
    category: 'عرض خاص',
  },
  {
    id: 5,
    name: 'مسك الغزال الأصلي',
    price: '1,800 ر.س',
    oldPrice: '2,200 ر.س',
    img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=70',
    category: 'لفترة محدودة',
  },
  {
    id: 6,
    name: 'إسوارة ذهب عيار 21',
    price: '8,500 ر.س',
    oldPrice: '10,000 ر.س',
    img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=70',
    category: 'فرصة حصرية',
  },
];

const ProductCard = ({ product, delay, onAddToCart, carousel = false }: { product: any, delay: number, onAddToCart: (p: any) => void, carousel?: boolean }) => {
  const isApi = !!product.slug;
  const imageUrl = isApi && product.images?.length > 0
    ? (typeof product.images[0] === 'object' ? product.images[0].url : product.images[0])
    : product.img || 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=70';
  const priceText = typeof product.price === 'number' ? `${product.price.toLocaleString()} ر.س` : product.price;
  const categoryText = isApi && product.category && typeof product.category === 'object' ? product.category.name : product.category;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: '-30px' }} 
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }} 
      className={`group flex flex-col gap-3 md:gap-5 ${
        carousel
          ? 'w-[68vw] sm:w-[44vw] md:w-[28vw] lg:w-[22vw] shrink-0 snap-start'
          : ''
      }`}
    >
      <div className="aspect-[4/5] overflow-hidden rounded-2xl md:rounded-3xl shadow-[0_15px_30px_rgba(0,0,0,0.07)] relative">
        <Link href={`/product/${product.slug || product.id}`}>
          <motion.img 
            whileHover={{ scale: 1.05 }} 
            transition={{ duration: 0.8 }} 
            src={imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover cursor-pointer" 
          />
        </Link>
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px] pointer-events-none">
           <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
              className="px-5 md:px-8 py-2.5 md:py-3 bg-white text-[#1A1A1A] rounded-full font-bold text-xs md:text-sm shadow-xl hover:bg-[#C5A059] hover:text-white transition-colors duration-300 pointer-events-auto"
            >
              اقتنيها الآن
            </motion.button>
        </div>
      </div>

      <div className="flex flex-col gap-1 md:gap-2 px-1 md:px-2">
        <p className="text-[#C5A059] text-[9px] md:text-xs font-bold tracking-[0.18em] uppercase">{categoryText}</p>
        <Link href={`/product/${product.slug || product.id}`}>
          <h3 className="text-sm md:text-xl font-bold text-[#1A1A1A] cursor-pointer hover:text-[#C5A059] transition-colors leading-snug line-clamp-2">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm md:text-lg font-semibold text-[#1A1A1A]">{priceText}</p>
          {product.oldPrice && (
            <p className="text-xs font-light text-gray-400 line-through">{product.oldPrice}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function HomeClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { items: globalCartItems, addItem, setIsCartOpen } = useCart();
  const cartItemsCount = globalCartItems.reduce((acc, item) => acc + item.quantity, 0);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load products from ProductDb
    const loadProducts = () => {
      try {
        const all = ProductDb.getProducts();
        setDbProducts(all);
      } catch (err) {
        console.error('Failed to load local DB products:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });
  const cartY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const handleAddToCart = (product: any) => {
    const isApi = !!product.slug;
    const imageUrl = isApi && product.images?.length > 0
      ? (typeof product.images[0] === 'object' ? product.images[0].url : product.images[0])
      : product.img;
    addItem({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'string' ? parseInt(product.price.replace(/[^0-9]/g, '')) : product.price,
      quantity: 1,
      image: imageUrl,
      category: isApi && product.category && typeof product.category === 'object' ? product.category.name : product.category
    });
  };

  // Divide into sections dynamically
  const displayBestSellers = dbProducts.length > 0 ? dbProducts.slice(0, 3) : fallbackBestSellers;
  const displaySpecialOffers = dbProducts.length > 3 ? dbProducts.slice(3, 7) : fallbackSpecialOffers;

  return (
    <div ref={containerRef} className="text-[#1A1A1A] relative z-0 bg-transparent">

      {/* ─── FLOATING MAGNETIC CART ─── */}
      <motion.div 
        style={{ y: cartY }} 
        className="fixed bottom-12 left-12 z-[9999] flex items-center gap-4 pointer-events-auto"
      >
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ type: 'spring', delay: 0.5 }}
           whileHover={{ scale: 1.15, rotate: -10 }}
           whileTap={{ scale: 0.9 }}
           onClick={() => setIsCartOpen(true)}
           className="relative cursor-pointer bg-[#1A1A1A] text-[#C5A059] p-5 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-[#C5A059]/30"
        >
          {cartItemsCount > 0 && (
            <div className="absolute -top-3 -right-3 bg-[#C5A059] text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-[#1A1A1A]">
              {cartItemsCount}
            </div>
          )}
          <ShoppingBag size={28} strokeWidth={2} />
        </motion.div>
      </motion.div>

      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-[3px] bg-[#C5A059] z-[100] origin-left" style={{ scaleX }} />

      {/* ─── THE NEW APPLE-STYLE SCROLL VIDEO SEQUENCE ─── */}
      <CinematicSequence />

      {/* ─── PRODUCTS WRAPPER (Full Width to Cover Video) ─── */}
      <div className="w-full bg-[#FAFAFA] relative z-10 shadow-[0_-30px_60px_rgba(0,0,0,0.1)] rounded-t-[3rem] mt-[-2rem] pb-20">
        
        {/* BEST SELLERS SECTION */}
        <section id="best-sellers" className="pt-20 md:pt-32 pb-10 md:pb-20">
          <div className="flex justify-between items-end mb-8 md:mb-14 px-5 md:px-20 max-w-[1400px] mx-auto">
            <motion.h2 initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8 }} className="text-2xl md:text-5xl font-bold border-r-4 border-[#C5A059] pr-4 md:pr-5">
              الأكثر طلباً عندنا
            </motion.h2>
            <Link href="/products" className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-gray-500 hover:text-[#C5A059] transition-colors">
              عرض الكل <ArrowLeft size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="w-full py-20 flex justify-center items-center">
              <Loader2 className="animate-spin text-[#C5A059]" size={48} />
            </div>
          ) : (
            <DraggableCarousel className="gap-4 md:gap-8 px-5 md:px-20 pb-4">
              {displayBestSellers.map((product, idx) => (
                <ProductCard key={product.id} product={product} delay={idx * 0.1} onAddToCart={handleAddToCart} carousel />
              ))}
              {/* Spacer at end so last item isn't flush against edge */}
              <div className="shrink-0 w-3 md:w-8" />
            </DraggableCarousel>
          )}
        </section>

        {/* SPECIAL OFFERS SECTION */}
        <section id="offers" className="py-10 md:py-20">
          <div className="flex justify-between items-end mb-8 md:mb-14 px-5 md:px-20 max-w-[1400px] mx-auto">
            <motion.h2 initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8 }} className="text-2xl md:text-5xl font-bold border-r-4 border-[#C5A059] pr-4 md:pr-5">
              عروض النخبة
            </motion.h2>
            <Link href="/products" className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-gray-500 hover:text-[#C5A059] transition-colors">
              كل العروض <ArrowLeft size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="w-full py-20 flex justify-center items-center">
              <Loader2 className="animate-spin text-[#C5A059]" size={48} />
            </div>
          ) : (
            <DraggableCarousel className="gap-4 md:gap-8 px-5 md:px-20 pb-4">
              {displaySpecialOffers.map((product, idx) => (
                <ProductCard key={product.id} product={product} delay={idx * 0.1} onAddToCart={handleAddToCart} carousel />
              ))}
              <div className="shrink-0 w-3 md:w-8" />
            </DraggableCarousel>
          )}
        </section>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-200 py-20 px-8 text-center bg-white z-10 relative">
        <p className="text-4xl font-bold mb-4 tracking-tighter">شَامِخ <span className="text-[#C5A059] font-light">SHAMIKH</span></p>
        <div className="flex justify-center gap-6 mb-6">
          <Link href="/policies" className="text-sm font-medium text-gray-500 hover:text-[#C5A059] transition-colors">السياسات والشروط (VIP)</Link>
          <Link href="/products" className="text-sm font-medium text-gray-500 hover:text-[#C5A059] transition-colors">تصفح المتجر</Link>
        </div>
        <p className="text-gray-400 text-sm">© 2026 جميع الحقوق محفوظة — الرياض، المملكة العربية السعودية</p>
      </footer>
    </div>
  );
}
