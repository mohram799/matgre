'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ShoppingBag, ShieldCheck, Clock, Check, Sparkles, Fingerprint, Droplets } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    price: number;
    priceStr: string;
    description: string;
    images: string[];
    category: string;
    stock: number;
  };
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCart();
  
  // Apple-style parallax refs
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  const { scrollY } = useScroll();
  const stickyBarY = useTransform(scrollY, [0, 600], [-100, 0]);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      category: product.category
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 3000);
  };

  return (
    <div className="bg-[#FAFAFA] text-[#1A1A1A] font-sans min-h-screen" dir="rtl">
      
      {/* ─── STICKY GLASS BUY BAR ─── */}
      <motion.div 
        style={{ y: stickyBarY }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 px-6 py-4 flex justify-between items-center shadow-sm"
      >
        <div className="font-bold text-lg md:text-xl truncate ml-4 text-[#1A1A1A]">{product.name}</div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-medium hidden md:block text-gray-500">{product.priceStr}</span>
          <button 
            onClick={handleAddToCart}
            className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#C5A059] hover:scale-105 transition-all shadow-lg"
          >
            {isAdded ? 'تمت الإضافة ✔' : 'اقتنيها الآن'}
          </button>
        </div>
      </motion.div>

      {/* ─── BRIGHT IMMERSIVE HERO ─── */}
      <div ref={heroRef} className="relative h-[85svh] md:h-[95svh] w-full overflow-hidden bg-gray-100 flex flex-col justify-end pb-10 md:pb-20 px-4 md:px-12">
        {/* Back Button Overlay */}
        <div className="absolute top-8 right-8 z-30">
          <Link href="/" className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-xl border border-white/40 flex items-center justify-center hover:bg-white transition-colors text-[#1A1A1A] shadow-lg">
            <ArrowRight size={20} />
          </Link>
        </div>

        <motion.div 
          style={{ y: heroY, scale: heroScale }}
          className="absolute inset-0 w-full h-full"
        >
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
        </motion.div>

        {/* Floating Glass Content Box for legibility over any image */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-20 bg-white/80 backdrop-blur-2xl border border-white/50 p-5 md:p-12 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.05)] w-full max-w-3xl"
        >
          <p className="text-[#C5A059] text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase mb-2 md:mb-4">{product.category}</p>
          <h1 className="text-3xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-3 md:mb-6 text-[#1A1A1A]">{product.name}</h1>
          <p className="text-xl md:text-4xl font-light text-gray-500">{product.priceStr}</p>
        </motion.div>
      </div>

      {/* ─── BENTO BOX FEATURES (Light & Cheerful) ─── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-20 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
          className="mb-16 md:mb-24 max-w-4xl px-4"
        >
          <h2 className="text-2xl md:text-5xl font-light leading-relaxed text-gray-600">
            {product.description}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Action Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
          className="md:col-span-2 bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-16 relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between min-h-[280px] md:min-h-[400px]"
          >
            <motion.div 
              animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-gradient-to-br from-[#C5A059]/20 to-transparent blur-[80px] rounded-full pointer-events-none" 
            />
            
            <div className="relative z-10">
              <Sparkles className="text-[#C5A059] w-10 h-10 mb-6" />
              <h3 className="text-3xl md:text-6xl font-bold mb-4 text-[#1A1A1A]">اقتني الفخامة المُطلقة.</h3>
              <p className="text-gray-500 text-lg md:text-xl max-w-md mb-10">قطعة صُممت خصيصاً لترافقك، وتبرز ذوقك الاستثنائي في كل خطوة.</p>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className={`relative z-10 w-fit px-8 md:px-12 py-4 md:py-6 rounded-full font-bold text-lg md:text-xl flex items-center justify-center gap-3 transition-all duration-500 shadow-xl ${
                isAdded ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-[#1A1A1A] text-white hover:bg-[#C5A059] hover:shadow-[#C5A059]/30 hover:scale-105'
              }`}
            >
              {isAdded ? <><Check size={24} /> تمت الإضافة للسلة ✔</> : <><ShoppingBag size={24} /> إضافة إلى السلة</>}
            </button>
          </motion.div>

          {/* Scarcity Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden flex flex-col shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-gray-100 min-h-[250px] md:min-h-[400px]"
          >
            <Droplets className="text-gray-400 w-10 h-10 mb-6" />
            <h3 className="text-2xl font-bold mb-3 text-[#1A1A1A]">ندرة حقيقية</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">نصنع كميات محدودة جداً للحفاظ على التفرد والتميز المطلق لعملائنا.</p>
            
            {product.stock <= 5 && (
              <motion.div 
                animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="bg-red-50 border border-red-100 text-red-500 p-5 rounded-3xl flex items-center gap-4 mt-auto"
              >
                <Clock className="w-8 h-8 shrink-0" />
                <div>
                  <div className="font-bold">تحذير الكمية</div>
                  <div className="text-sm mt-1">متبقي {product.stock} قطع فقط.</div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Authenticity Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden flex flex-col justify-center shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-gray-100 min-h-[220px] md:min-h-[300px]"
          >
            <ShieldCheck className="text-[#C5A059] w-12 h-12 mb-6" />
            <h3 className="text-2xl font-bold mb-3 text-[#1A1A1A]">شهادة أصالة معتمدة</h3>
            <p className="text-gray-500 leading-relaxed">
              تأتي مع بطاقة ملكية فريدة (Zero-Trust Identity) مسجلة باسمك لتأكيد أصالتها العالمية.
            </p>
          </motion.div>

          {/* Packaging Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: 0.3 }}
          className="md:col-span-2 bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-gray-100 min-h-[220px] md:min-h-[300px]"
          >
            <div className="flex-1">
              <Fingerprint className="text-[#1A1A1A] w-10 h-10 mb-6" />
              <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">تغليف كبار الشخصيات (VIP)</h3>
              <p className="text-gray-500 text-lg leading-relaxed">
                تصلك القطعة في صندوق خشبي مبطن بالجلد الإيطالي الطبيعي. تجربة الفتح بحد ذاتها قصة مبهجة لا تُنسى.
              </p>
            </div>
            {product.images[1] && (
              <motion.div 
                whileInView={{ scale: 1.05 }} transition={{ duration: 1.5 }}
                className="w-full md:w-[40%] h-[250px] rounded-[2rem] overflow-hidden shrink-0 shadow-lg"
              >
                <img src={product.images[1]} className="w-full h-full object-cover" />
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>

    </div>
  );
}
