'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, SlidersHorizontal, Star, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProductDb } from '@/components/ProductDb';

export default function ProductsClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [activeFilter, setActiveFilter] = useState('الأكثر مبيعاً');

  const searchParams = useSearchParams();
  const search = searchParams.get('search');

  const categories = ['الكل', 'عطور حصرية', 'ساعات النخبة', 'مجوهرات ونوادر', 'إصدار محدود', 'هدايا كبار الشخصيات'];
  const filters = ['الأكثر مبيعاً', 'الأحدث', 'الأعلى تقييماً', 'السعر: من الأقل للأعلى', 'السعر: من الأعلى للأقل'];

  useEffect(() => {
    if (search) {
      setSearchQuery(search);
    }
  }, [search]);

  useEffect(() => {
    // Load products from ProductDb
    const loadProducts = () => {
      try {
        const all = ProductDb.getProducts();
        setProducts(all);
      } catch (err) {
        console.error('Failed to load local DB products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();

    // Listen for background Supabase updates
    window.addEventListener('shamikh_products_updated', loadProducts);
    return () => {
      window.removeEventListener('shamikh_products_updated', loadProducts);
    };
  }, []);

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchQuery) {
      result = result.filter(p => p.name.includes(searchQuery));
    }

    // Category
    if (activeCategory !== 'الكل') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Sorting
    switch (activeFilter) {
      case 'السعر: من الأقل للأعلى':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'السعر: من الأعلى للأقل':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'الأحدث':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'الأعلى تقييماً':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'الأكثر مبيعاً':
      default:
        result.sort((a, b) => b.sales - a.sales);
        break;
    }

    return result;
  }, [products, searchQuery, activeCategory, activeFilter]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pt-24 pb-20" dir="rtl">
      
      {/* ─── LIVE SEARCH & HEADER ─── */}
      <div className="bg-white border-b border-gray-100 sticky top-20 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <h1 className="text-3xl font-bold text-[#1A1A1A] shrink-0">التشكيلة الفاخرة</h1>
            
            {/* Live Search Bar */}
            <div className="relative w-full max-w-2xl">
              <input 
                type="text" 
                placeholder="ابحث عن العطور، الساعات، أو النوادر..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-4 pr-14 pl-6 text-[#1A1A1A] focus:outline-none focus:bg-white focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all shadow-inner"
              />
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-[#C5A059]" size={22} />
            </div>
          </div>
        </div>

        {/* ─── OVAL SLIDING CATEGORIES ─── */}
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 pb-6">
          <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar items-center">
            {categories.map((cat, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                  activeCategory === cat 
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#C5A059] hover:text-[#1A1A1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-10">
        
        {/* ─── ADVANCED FILTERS ROW ─── */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
            <SlidersHorizontal size={18} /> تصفية متقدمة:
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar">
            {filters.map(filter => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeFilter === filter ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="animate-spin text-[#C5A059]" size={48} />
          </div>
        ) : (
          <AnimatePresence>
            {filteredProducts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
                <Search className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-2xl font-bold text-gray-500">لم يتم العثور على مقتنيات</h3>
                <p className="text-gray-400 mt-2">جرب البحث باسم آخر.</p>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
                {filteredProducts.map((product) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    key={product.id}
                    className="group bg-white rounded-2xl md:rounded-3xl p-2.5 md:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-shadow duration-500"
                  >
                    <Link href={`/product/${product.slug}`}>
                      <div className="aspect-[4/5] overflow-hidden rounded-[1rem] md:rounded-[1.5rem] bg-gray-50 mb-3 md:mb-5 relative">
                        <img src={product.img} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        
                        {/* Status Badges Overlay */}
                        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2">
                          <span className="bg-black/60 backdrop-blur-md text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold tracking-widest uppercase">
                            {product.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="px-1 md:px-2">
                        <div className="flex justify-between items-start mb-1 md:mb-2">
                          <h3 className="text-xs md:text-xl font-bold text-[#1A1A1A] group-hover:text-[#C5A059] transition-colors line-clamp-2 leading-snug">{product.name}</h3>
                        </div>
                        
                        {/* Stats Row (Sales, Rating) — hidden on mobile to save space */}
                        <div className="hidden md:flex items-center gap-4 mb-4 text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            <TrendingUp size={14} /> +{product.sales.toLocaleString()} مبيع
                          </span>
                          <span className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" /> {product.rating} ({product.reviews})
                          </span>
                        </div>

                        {/* Mobile compact stats */}
                        <div className="flex md:hidden items-center gap-1.5 mb-2 text-[9px] font-bold text-gray-400">
                          <span className="flex items-center gap-0.5 text-green-600">
                            <TrendingUp size={10} /> {product.sales.toLocaleString()}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-0.5">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" /> {product.rating}
                          </span>
                        </div>

                        <div className="flex justify-between items-end border-t border-gray-100 pt-2 md:pt-4">
                          <div>
                            <span className="text-sm md:text-2xl font-bold text-[#1A1A1A]">{product.price.toLocaleString()}</span>
                            <span className="text-[9px] md:text-sm text-gray-500 mr-0.5 md:mr-1 font-medium">ر.س</span>
                          </div>
                          <button className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors shrink-0">
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
