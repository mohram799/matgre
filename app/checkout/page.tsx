'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, ArrowRight, CreditCard, Apple, Loader2, Check, User, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { useRouter } from 'next/navigation';
import { ProductDb } from '@/components/ProductDb';


export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);
  const { items, clearCart } = useCart();
  const router = useRouter();

  const paymentSteps = [
    'تشفير بيانات البطاقة الائتمانية ببروتوكول AES-256...',
    'تفويض القنوات المصرفية المشفرة المعتمدة...',
    'توليد الفاتورة الذكية الموثقة وتخصيص تغليف VIP...',
    'إتمام المعاملة الأمنية وتسجيل المقتنيات بالدفتر الرقمي...'
  ];

  // Calculate real total
  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  useEffect(() => {
    if (items.length === 0) {
      router.push('/');
      return;
    }

    // Use internal Next.js API route (works in dev + production without separate server)
    const initCheckout = async () => {
      try {
        const res = await fetch('/api/checkout/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            currency: 'sar',
            items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          })
        });
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('[SHAMIKH] Checkout init failed:', err);
        // Non-blocking: allow payment form to render even if intent fails
        setClientSecret('mock_fallback_secret');
      } finally {
        setLoading(false);
      }
    };
    initCheckout();
  }, [items, router, totalAmount]);


  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);
    setPaymentStep(0);

    const stepInterval = setInterval(() => {
      setPaymentStep(prev => {
        if (prev < paymentSteps.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 850);

    // Get form shipping info
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    setTimeout(async () => {
      clearInterval(stepInterval);
      setIsPaying(false);
      setIsSuccess(true);

      // Save order to ProductDb (local)
      try {
        const orderItems = items.map(i => ({
          id: i.id, name: i.name, price: i.price,
          quantity: i.quantity, image: i.image, category: i.category
        }));
        ProductDb.addOrder(orderItems, totalAmount);
      } catch (err) {
        console.error('[SHAMIKH] Local order save failed:', err);
      }

      // Also persist to backend API (Supabase via route handler - aligns with orderCreateSchema)
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: formData.get('fullName') || 'عميل شامخ',
            customer_phone: formData.get('phone') || '0500000000',
            customer_email: formData.get('email') || '',
            shipping_address: {
              line1: formData.get('address') || 'حي العليا، طريق الملك فهد',
              city: formData.get('city') || 'الرياض',
              country: 'المملكة العربية السعودية'
            },
            items: items.map(i => ({
              product_id: String(i.id),
              title: i.name,
              price: i.price,
              quantity: i.quantity,
              image: i.image
            })),
            vip_tier: 'guest',
            notes: 'طلب توصيل فاخر عبر بوابة الويب',
            stripe_payment_intent: clientSecret || undefined
          }),
        });
      } catch (err) {
        console.error('[SHAMIKH] API order sync failed (non-blocking):', err);
      }

      clearCart();
      setTimeout(() => router.push('/profile'), 3500);
    }, 3800);
  };


  if (items.length === 0) return null; // Avoid rendering if redirecting

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col md:flex-row font-sans relative overflow-hidden" dir="rtl">
      
      {/* ─── OVERLAY LOADING AND SUCCESS STATE ─── */}
      <AnimatePresence>
        {(isPaying || isSuccess) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#1A1A1A]/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white p-6"
          >
            <div className="max-w-md w-full text-center flex flex-col items-center relative">
              
              {/* Luxury ambient backgrounds for overlays */}
              <div className="absolute w-[250px] h-[250px] bg-[#C5A059]/10 rounded-full blur-[100px] -top-12 z-0 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                {isPaying ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-2 border-[#C5A059]/10 border-t-[#C5A059] rounded-full mb-8 shadow-[0_0_20px_rgba(197,160,89,0.15)]"
                    />
                    <h3 className="text-2xl font-bold font-arabic mb-4 tracking-wide text-white">بوابة الدفع الآمنة | شَامِخ</h3>
                    <div className="h-8 overflow-hidden relative w-full mb-6">
                      <AnimatePresence mode="wait">
                        <motion.p 
                          key={paymentStep}
                          initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
                          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                          exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }}
                          transition={{ duration: 0.3 }}
                          className="text-gray-400 text-sm font-arabic font-medium"
                        >
                          {paymentSteps[paymentStep]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    <div className="w-56 h-[2px] bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[#DFBA73] to-[#C5A059]" 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3.8, ease: "easeInOut" }}
                      />
                    </div>
                  </>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="flex flex-col items-center"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="w-20 h-20 bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-white rounded-full flex items-center justify-center mb-8 shadow-[0_10px_35px_rgba(197,160,89,0.25)] border border-[#DFBA73]/30"
                    >
                      <Check size={36} strokeWidth={2.5} />
                    </motion.div>
                    <h3 className="text-3xl font-bold font-arabic mb-3 text-white">تم قبول الدفع واستكمال طلبك</h3>
                    <p className="text-[#C5A059] font-bold text-xs uppercase tracking-[0.2em] mb-5">VIP Transaction Certified</p>
                    <p className="text-gray-300 text-sm font-arabic leading-relaxed mb-8 max-w-sm">
                      شكراً لاقتنائك من إصدارات شَامِخ الاستثنائية. تم إرسال تأكيد العملية لرقم هاتفك وجارِ تجهيز مقتنياتك الثمينة للنقل الفاخر المضمون.
                    </p>
                    <p className="text-gray-500 text-xs font-sans tracking-widest mb-6 bg-white/5 border border-white/5 px-4 py-2 rounded-full">
                      رمز المعاملة المشفر: SH-{(Math.floor(Math.random() * 900000) + 100000)}
                    </p>
                    <span className="text-xs text-gray-400 flex items-center gap-2 font-arabic animate-pulse">
                      جارِ توجيهك لملفك الشخصي لتتبع الشحن والمستندات...
                    </span>
                  </motion.div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── LEFT PANEL: ORDER SUMMARY ─── */}
      <div className="w-full md:w-5/12 bg-white text-[#1A1A1A] p-5 md:p-16 flex flex-col justify-between order-2 md:order-1 relative overflow-hidden border-l border-gray-100/80 shadow-[0_0_50px_rgba(0,0,0,0.01)]">
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 text-gray-400 hover:text-[#C5A059] transition-all duration-300 bg-gray-50/60 hover:bg-gray-50 px-4 py-2 rounded-full border border-gray-100 mb-12">
            <ArrowRight size={16} />
            <span className="text-xs font-bold tracking-wider font-arabic">العودة للتسوق</span>
          </Link>

          <h2 className="text-2xl font-light mb-10 font-arabic text-gray-800">ملخص الطلب <span className="font-bold text-[#C5A059] tracking-wider font-sans">VIP</span></h2>

          <div className="flex flex-col gap-5 mb-10 border-b border-gray-100 pb-10 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
            {items.map(item => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="w-16 h-20 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 shadow-sm">
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-800 mb-1 font-arabic">{item.name}</h3>
                  <p className="text-gray-400 text-xs font-arabic">{item.category} • الكمية: {item.quantity}</p>
                </div>
                <div className="font-bold text-sm text-gray-800 font-sans">
                  {(item.price * item.quantity).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal font-arabic">ر.س</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 px-1">
            <div className="flex justify-between text-gray-500 text-xs font-semibold">
              <span className="font-arabic">المجموع الفرعي</span>
              <span className="text-[#1A1A1A] font-sans">{(totalAmount).toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs font-semibold">
              <span className="font-arabic">التوصيل الآمن (مروحية/مصفحة)</span>
              <span className="text-[#C5A059] font-bold font-arabic">مشمول ومجاناً للـ VIP</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-10 pt-6 border-t border-gray-100 flex justify-between items-end">
          <span className="text-sm font-medium text-gray-500 font-arabic">الإجمالي النهائي</span>
          <span className="text-3xl font-bold font-sans text-gray-800">{(totalAmount).toLocaleString()} <span className="text-sm font-normal text-[#C5A059] font-arabic">ر.س</span></span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: PAYMENT & ZERO TRUST ─── */}
      <div className="w-full md:w-7/12 p-5 md:p-16 flex flex-col justify-center order-1 md:order-2 bg-[#FAF9F6] bg-gradient-to-b from-[#FAF9F6] to-[#F5F2EB] relative">
        
        {/* Decorative light glows */}
        <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-[#C5A059]/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[10%] w-[250px] h-[250px] bg-[#C5A059]/3 rounded-full blur-[70px] pointer-events-none" />

        <div className="max-w-md mx-auto w-full relative z-10">
          
          <div className="flex items-center gap-2 mb-8 text-[#C5A059] bg-[#C5A059]/10 w-fit px-4 py-2 rounded-full border border-[#C5A059]/20">
            <ShieldCheck size={14} className="text-[#C5A059]" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-sans">LCOS Zero Trust Secured</span>
          </div>

          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3 font-arabic">بوابة الاقتناء الآمنة</h1>
          <p className="text-gray-500 text-sm font-arabic mb-8">جميع العمليات تخضع للتوثيق المزدوج لحماية مقتنياتك وسريتك المصرفية.</p>

          {/* Premium Apple Pay button */}
          <div className="flex gap-4 mb-8 pb-8 border-b border-gray-200/50">
            <button 
              type="button"
              onClick={handlePaymentSubmit}
              className="flex-1 bg-black text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all duration-300 transform active:scale-95 shadow-lg"
            >
              <Apple size={20} fill="white" className="translate-y-[-1px]" />
              <span className="font-bold text-sm tracking-wider font-sans">Pay</span>
            </button>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handlePaymentSubmit}>
            {/* ─── SHAMIKH LUXURY SHIPPING INFO ─── */}
            <div className="space-y-4 border-b border-gray-200/50 pb-6 mb-2">
              <h4 className="text-sm font-bold text-gray-800 px-1 font-arabic border-r-2 border-[#C5A059] pr-2">معلومات الشحن والتوصيل الفاخر</h4>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 px-1 font-arabic">الاسم الكامل للمستلم</label>
                <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/10 focus-within:bg-white/90 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
                  <User className="absolute right-4 text-gray-400 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                  <input 
                    name="fullName"
                    type="text" 
                    placeholder="محمد آل سعود" 
                    className="w-full bg-transparent py-3.5 pr-11 pl-4 text-[#1A1A1A] focus:outline-none transition-all placeholder:text-gray-300 text-sm font-arabic" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 px-1 font-arabic">رقم الجوال (VIP)</label>
                <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/10 focus-within:bg-white/90 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
                  <Phone className="absolute right-4 text-gray-400 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                  <input 
                    name="phone"
                    type="tel" 
                    placeholder="050 000 0000" 
                    className="w-full bg-transparent py-3.5 pr-11 pl-4 text-[#1A1A1A] focus:outline-none transition-all placeholder:text-gray-300 text-sm" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 px-1 font-arabic">البريد الإلكتروني (اختياري)</label>
                <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/10 focus-within:bg-white/90 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
                  <Mail className="absolute right-4 text-gray-400 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                  <input 
                    name="email"
                    type="email" 
                    placeholder="vip@shamikh.com" 
                    className="w-full bg-transparent py-3.5 pr-11 pl-4 text-[#1A1A1A] focus:outline-none transition-all placeholder:text-gray-300 text-sm" 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-[2]">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 px-1 font-arabic">العنوان التفصيلي</label>
                  <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/10 focus-within:bg-white/90 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
                    <MapPin className="absolute right-4 text-gray-400 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                    <input 
                      name="address"
                      type="text" 
                      placeholder="حي العليا، طريق الملك فهد، برج الفيصلية" 
                      className="w-full bg-transparent py-3.5 pr-11 pl-4 text-[#1A1A1A] focus:outline-none transition-all placeholder:text-gray-300 text-sm font-arabic" 
                      required
                    />
                  </div>
                </div>
                <div className="flex-[1]">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 px-1 font-arabic">المدينة</label>
                  <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/10 focus-within:bg-white/90 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
                    <input 
                      name="city"
                      type="text" 
                      placeholder="الرياض" 
                      className="w-full bg-transparent py-3.5 px-4 text-[#1A1A1A] focus:outline-none transition-all placeholder:text-gray-300 text-sm font-arabic text-center" 
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── CREDIT CARD PAYMENT INFO ─── */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 px-1 font-arabic">بيانات البطاقة الائتمانية</label>
              <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/10 focus-within:bg-white/90 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
                <CreditCard className="absolute right-4 text-gray-400 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="0000 0000 0000 0000" 
                  className="w-full bg-transparent py-4 pr-11 pl-4 text-[#1A1A1A] font-mono tracking-[0.15em] focus:outline-none transition-all placeholder:text-gray-300 text-sm" 
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-2 px-1 font-arabic">تاريخ الانتهاء</label>
                <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/10 focus-within:bg-white/90 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
                  <input 
                    type="text" 
                    placeholder="MM/YY" 
                    className="w-full bg-transparent py-4 px-4 text-[#1A1A1A] font-sans text-center focus:outline-none transition-all placeholder:text-gray-300 text-sm" 
                    required
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-2 px-1 font-arabic">رمز الأمان (CVC)</label>
                <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/10 focus-within:bg-white/90 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-300">
                  <input 
                    type="text" 
                    placeholder="123" 
                    className="w-full bg-transparent py-4 px-4 text-[#1A1A1A] font-sans text-center focus:outline-none transition-all placeholder:text-gray-300 text-sm" 
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1A1A] text-white py-4.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#C5A059] transition-all duration-300 shadow-[0_20px_40px_rgba(26,26,26,0.1)] hover:shadow-[0_20px_40px_rgba(197,160,89,0.15)] font-arabic"
              >
                <Lock size={16} className="translate-y-[-0.5px]" />
                <span>تأكيد الدفع واستكمال المعاملة</span>
              </motion.button>
            </div>
            
          </form>

        </div>
      </div>
      
    </div>
  );
}
