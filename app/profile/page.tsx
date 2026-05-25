'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, Heart, LogOut, ShieldCheck, Clock, ArrowRight, Truck, Settings } from 'lucide-react';
import Link from 'next/link';
import { ProductDb, Order } from '@/components/ProductDb';


export default function UserProfile() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(ProductDb.getOrders());
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pt-32 pb-20" dir="rtl">
      
      <div className="max-w-[1200px] mx-auto px-4 md:px-12 mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#C5A059] transition-colors bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-100">
          <ArrowRight size={18} />
          <span className="text-sm font-bold tracking-widest uppercase">العودة للتسوق</span>
        </Link>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-12 flex flex-col md:flex-row gap-6 md:gap-12">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-gray-100">
            <div className="w-20 h-20 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center text-3xl font-light mb-6 shadow-xl">
              م
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">محمد آل سعود</h2>
            <p className="text-[#C5A059] text-sm font-bold tracking-widest uppercase mb-8 flex items-center gap-1">
              <ShieldCheck size={16} /> عضوية VIP الماسية
            </p>

            <div className="flex flex-col gap-2">
              <Link href="/profile" className="flex items-center gap-3 text-[#1A1A1A] font-bold bg-gray-50 px-4 py-3 rounded-xl transition-colors">
                <Package size={20} /> طلباتي
              </Link>
              <Link href="/admin/dropshipping" className="flex items-center gap-3 text-[#C5A059] font-bold hover:bg-[#C5A059]/5 px-4 py-3 rounded-xl transition-colors border border-[#C5A059]/20 hover:border-[#C5A059] shadow-sm">
                <Settings size={20} /> لوحة تحكم الدروبشيبينغ
              </Link>
              <Link href="/profile" className="flex items-center gap-3 text-gray-500 font-medium hover:bg-gray-50 hover:text-[#1A1A1A] px-4 py-3 rounded-xl transition-colors">
                <MapPin size={20} /> العناوين المحفوظة
              </Link>
              <Link href="/products" className="flex items-center gap-3 text-gray-500 font-medium hover:bg-gray-50 hover:text-[#1A1A1A] px-4 py-3 rounded-xl transition-colors">
                <Heart size={20} /> المفضلات النادرة
              </Link>
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                  } catch (err) {
                    console.error('Logout error:', err);
                  }
                  window.location.href = '/auth';
                }}
                className="w-full flex items-center gap-3 text-red-400 font-medium hover:bg-red-50 px-4 py-3 rounded-xl transition-colors mt-4 text-right"
              >
                <LogOut size={20} /> تسجيل الخروج
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4">
          <h1 className="text-4xl font-light text-[#1A1A1A] mb-8 border-b border-gray-200 pb-6">مقتنياتك الفاخرة</h1>
          
          <div className="space-y-6">
            {orders.map((order, idx) => {
              const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
              const imgUrl = firstItem ? firstItem.image : "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=70";
              const titleText = order.items && order.items.length > 1 
                ? `${firstItem?.name} (و${order.items.length - 1} قطع أخرى)`
                : firstItem?.name || 'مقتنيات فاخرة';

              const isDelivered = order.status === 'تم التوصيل بأمان';
              const isShipped = order.status === 'تم الشحن عبر المورد';
              const isPendingDropship = order.status === 'بانتظار تلبية المورد' || order.status === 'بانتظار تلبية المورد';
              
              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center ${
                    isDelivered ? 'opacity-75' : ''
                  }`}
                >
                  <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 shadow-md bg-gray-50">
                    <img src={imgUrl} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                      <h3 className="text-xl font-bold text-[#1A1A1A]">{titleText}</h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                        isDelivered 
                          ? 'bg-green-50 text-green-600 border border-green-200' 
                          : isShipped 
                            ? 'bg-blue-50 text-blue-600 border border-blue-200 animate-pulse'
                            : isPendingDropship
                              ? 'bg-yellow-50 text-yellow-600 border border-yellow-200 animate-pulse'
                              : 'bg-orange-50 text-orange-600 border border-orange-200'
                      }`}>
                        {isDelivered && <ShieldCheck size={14} />}
                        {isShipped && <Truck size={14} />}
                        {(isPendingDropship || order.status === 'قيد التغليف اليدوي') && <Clock size={14} />}
                        {order.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-xs mb-3">
                      رقم الطلب: #{order.id} • تم الطلب في: {order.date}
                      {order.isDropship && (
                        <span className="mr-2 text-[9px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-2 py-0.5 rounded-full font-bold">
                          دروبشيبينغ مستورد
                        </span>
                      )}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-50">
                      <div>
                        <span className="text-2xl font-bold">{order.totalAmount.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 mr-1">ر.س</span>
                      </div>
                      
                      {order.trackingNumber ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200">
                            تتبع دولي: {order.trackingNumber}
                          </span>
                          <button className="text-xs font-bold text-white bg-black hover:bg-[#C5A059] px-4 py-2 rounded-full transition-colors shadow-md">
                            تتبع الطرود
                          </button>
                        </div>
                      ) : (
                        <button className="text-xs font-bold text-[#C5A059] hover:underline bg-[#C5A059]/5 px-4 py-2 rounded-full border border-[#C5A059]/10">
                          {order.isDropship ? 'بانتظار إصدار بوليصة التوريد' : 'تتبع مروحية التوصيل'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ─── VIP LOYALTY TIERS ─── */}
          <div className="mt-16 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#C5A059]/10 to-transparent rounded-full blur-[80px]" />
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2 relative z-10">عضويات النخبة السرية</h2>
            <p className="text-gray-500 mb-8 relative z-10 max-w-xl">كل عملية شراء تقربك خطوة من دوائر النخبة المغلقة. يتم فتح خصومات خيالية ومزايا استثنائية تلقائياً عند ترقيتك.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 opacity-50">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-gray-400 mb-4 shadow-sm text-lg">1</div>
                <h3 className="text-xl font-bold text-gray-700 mb-1">الكفو</h3>
                <p className="text-xs text-gray-500 font-bold mb-4">بعد 10 مشتريات فاخرة</p>
                <div className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold w-fit mb-3">خصم 5% - 7%</div>
                <p className="text-sm text-gray-400">تفتح لك أبواب الدعم الفني السريع وعروض حصرية.</p>
              </div>

              <div className="bg-gradient-to-b from-[#1A1A1A] to-[#2A2A2A] p-6 rounded-3xl shadow-xl transform scale-105 border border-white/10 relative">
                <div className="absolute top-4 left-4 bg-[#C5A059]/20 text-[#C5A059] px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">المستوى الحالي</div>
                <div className="w-12 h-12 bg-[#333] rounded-full flex items-center justify-center font-bold text-white mb-4 shadow-inner text-lg border border-white/10">2</div>
                <h3 className="text-xl font-bold text-white mb-1">الهيبة</h3>
                <p className="text-xs text-gray-400 font-bold mb-4">بعد 20 مشتريات فاخرة</p>
                <div className="bg-[#C5A059] text-white px-3 py-1.5 rounded-lg text-sm font-bold w-fit mb-3 shadow-[0_5px_15px_rgba(197,160,89,0.3)]">خصم 10% - 15%</div>
                <p className="text-sm text-gray-300 leading-relaxed">أنت الآن في دائرة الهيبة. تحصل على تغليف مصفح مجاناً، وتنبيهات قبل طرح الإصدارات المحدودة.</p>
              </div>

              <div className="bg-gradient-to-br from-[#C5A059] to-[#9A7B44] p-6 rounded-3xl shadow-[0_20px_40px_rgba(197,160,89,0.2)] text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-white mb-4 backdrop-blur-md text-lg">3</div>
                <h3 className="text-xl font-bold text-white mb-1">الشامخ (الذهبي)</h3>
                <p className="text-xs text-white/70 font-bold mb-4">بعد 30 مشتريات فاخرة</p>
                <div className="bg-white text-[#C5A059] px-3 py-1.5 rounded-lg text-sm font-bold w-fit mb-3 shadow-sm">خصم 20% - 50%</div>
                <p className="text-sm text-white/90 leading-relaxed">أعلى مراتب المجد. خط مباشر مع الإدارة، دعوات لأحداث النخبة السرية، وخصومات على أندر النوادر.</p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
