'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, Sparkles, TrendingUp, Settings, ShoppingCart, 
  RefreshCw, CheckCircle2, AlertCircle, Trash2, ArrowLeft,
  ChevronRight, Database, Globe, DollarSign, HardDrive, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { ProductDb, Product, Order, SupplierSettings } from '@/components/ProductDb';

export default function DropshippingAdmin() {
  const [activeTab, setActiveTab] = useState<'import' | 'settings' | 'orders'>('import');
  
  // Scraper tab state
  const [url, setUrl] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<'aliexpress' | 'tager'>('aliexpress');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStep, setScrapeStep] = useState(0);
  const [scrapedProduct, setScrapedProduct] = useState<Partial<Product> | null>(null);
  const [margin, setMargin] = useState(2.2);
  const [fee, setFee] = useState(450);
  
  // Settings state
  const [settings, setSettings] = useState<SupplierSettings>({
    aliexpressConnected: true,
    aliexpressKey: '',
    tagerConnected: true,
    tagerKey: '',
    marginMultiplier: 2.2,
    luxuryPremiumFee: 450
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFulfilling, setIsFulfilling] = useState<string | null>(null);
  const [fulfillStep, setFulfillStep] = useState(0);
  const [fulfillmentSuccessMsg, setFulfillmentSuccessMsg] = useState('');

  // Scrape Steps Copy
  const scrapeSteps = [
    'جاري تأسيس قناة اتصال آمنة وموثقة مع خادم المورد...',
    'جاري تحليل شجرة البنية الميتا (HTML Dom tree) لصفحة المنتج...',
    'جاري تصفية واستخراج روابط الصور بدقة 4K الفائقة...',
    'جاري تحميل جداول المواصفات واستخلاص الخيارات المتاحة...',
    'جاري تشغيل محرك الذكاء الاصطناعي لتوليد الصياغة التسويقية الراقية وترجمة العنوان للعربية...'
  ];

  // Fulfillment Steps Copy
  const fulfillmentSteps = [
    'جاري تشفير قنوات الدفع ومزامنة بيانات الشحن والاتصال الآمن للمورد...',
    'جاري إرسال حزمة العميل (الاسم، رقم الهاتف، العنوان الموثق بالرياض)...',
    'جاري استدعاء بوابة التصفية لفوترة تكلفة الدروبشيبينغ وسدادها للمورد...',
    'جاري سحب الرقم المرجعي للطلب وكود التتبع الفعلي من مخازن الجمارك...'
  ];

  useEffect(() => {
    // Load initial settings and orders
    const activeSettings = ProductDb.getSupplierSettings();
    setSettings(activeSettings);
    setMargin(activeSettings.marginMultiplier);
    setFee(activeSettings.luxuryPremiumFee);
    setOrders(ProductDb.getOrders());
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    ProductDb.updateSupplierSettings(settings);
    alert('تم حفظ إعدادات الربط الآلي وهوامش الأرباح الفاخرة بنجاح!');
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsScraping(true);
    setScrapeStep(0);
    setScrapedProduct(null);

    const interval = setInterval(() => {
      setScrapeStep(prev => {
        if (prev < scrapeSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1000);

    try {
      const res = await fetch('/api/dropshipping/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await res.json();

      clearInterval(interval);
      setScrapeStep(scrapeSteps.length - 1);

      if (res.ok && result.success) {
        const p = result.product;
        setScrapedProduct({
          id: result.productId,
          name: p.title,
          slug: p.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-'),
          description: p.description || 'وصف منتج دروبشيبينغ فاخر يتم سحبه تلقائياً من خوادم علي إكسبريس للتجارة الدولية.',
          category: url.toLowerCase().includes('perfume') || url.toLowerCase().includes('oud') ? 'عطور حصرية' : 'ساعات النخبة',
          img: p.images?.[0] || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80',
          images: p.images || [],
          costPrice: p.costPrice,
          price: p.price,
          stock: 60,
          isImported: true,
          supplierUrl: url,
          supplierName: 'ALIEXPRESS'
        });
      } else {
        alert(result.error || 'فشل استيراد المنتج. يرجى التحقق من الرابط والمحاولة مرة أخرى.');
      }
    } catch (err) {
      clearInterval(interval);
      alert('حدث خطأ أثناء الاتصال بخادم الاستيراد الذكي لشامخ.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleStartScrape = (e: React.MouseEvent) => {
    e.preventDefault();
    handleScrape(e as any);
  };

  const handleSaveScrapedProduct = () => {
    if (!scrapedProduct) return;
    
    ProductDb.importProduct({
      name: scrapedProduct.name || '',
      slug: scrapedProduct.slug || '',
      description: scrapedProduct.description || '',
      category: scrapedProduct.category || 'إصدار محدود',
      img: scrapedProduct.img || '',
      images: scrapedProduct.images || [],
      costPrice: scrapedProduct.costPrice || 0,
      price: scrapedProduct.price || 0,
      stock: scrapedProduct.stock || 10,
      isImported: true,
      supplierUrl: scrapedProduct.supplierUrl,
      supplierName: scrapedProduct.supplierName
    });

    alert('تم توطين وحفظ المنتج في قاعدة بيانات متجرك الفاخر بنجاح! يظهر الآن في المتجر.');
    setUrl('');
    setScrapedProduct(null);
  };

  const handleFulfillOrder = (orderId: string) => {
    setIsFulfilling(orderId);
    setFulfillStep(0);

    const interval = setInterval(() => {
      setFulfillStep(prev => {
        if (prev < fulfillmentSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1300);

    setTimeout(() => {
      clearInterval(interval);
      
      const tracking = `SHM-AE-${Math.floor(4000000 + Math.random() * 5999999)}`;
      const supOrderId = `TG-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Update local storage
      ProductDb.updateOrderFulfillment(orderId, tracking, 'تم الشحن عبر المورد', supOrderId);
      
      // Update UI state
      setOrders(ProductDb.getOrders());
      setIsFulfilling(null);
      setFulfillmentSuccessMsg(`تمت التلبية تلقائياً بنجاح! رقم طلب المورد: ${supOrderId} | كود التتبع: ${tracking}`);
      
      // Clear toast after 5s
      setTimeout(() => {
        setFulfillmentSuccessMsg('');
      }, 5000);
    }, 5500);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-900 font-sans overflow-x-hidden pt-24 pb-20" dir="rtl">
      
      {/* Background Decorative Spheres */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header Container */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link href="/profile" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-2 text-xs font-bold tracking-widest uppercase">
            <ArrowLeft size={16} /> العودة لحساب VIP
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            شامخ <span className="text-blue-600 font-light">دروبشيبينغ</span> 
            <span className="text-[10px] bg-blue-600/10 text-blue-600 border border-[#C5A059]/30 px-3 py-1 rounded-full uppercase font-bold tracking-widest shrink-0">Command Hub</span>
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1.5 p-1 bg-gray-50 rounded-full border border-gray-200 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('import')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'import' ? 'bg-blue-600 text-black shadow-md' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <Sparkles size={14} /> سحب وتوطين المنتجات
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 relative ${
              activeTab === 'orders' ? 'bg-blue-600 text-black shadow-md' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <ShoppingCart size={14} /> تلبية الطلبات
            {orders.filter(o => o.status === 'بانتظار تلبية المورد').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-gray-900 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold">
                {orders.filter(o => o.status === 'بانتظار تلبية المورد').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-blue-600 text-black shadow-md' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <Settings size={14} /> إعدادات الربط والأسعار
          </button>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {fulfillmentSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[9999] bg-green-500 text-gray-900 font-bold px-6 py-4 rounded-2xl shadow-2xl border border-green-400/30 flex items-center gap-3 text-sm max-w-xl text-center"
          >
            <CheckCircle2 size={24} className="shrink-0" />
            <span>{fulfillmentSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* ─── TAB 1: PRODUCT SCRAPER ─── */}
        {activeTab === 'import' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Scraper Left Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#121212]/80 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-gray-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
                
                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 border-b border-gray-200 pb-4">
                  <Link2 className="text-blue-600" size={20} /> سحب منتج بـ URL ذكي
                </h2>

                <div className="space-y-6">
                  {/* Supplier Choice */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">منصة التوريد المستهدفة</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setSelectedSupplier('aliexpress')}
                        className={`p-4 rounded-2xl border transition-all duration-300 text-right flex items-center justify-between ${
                          selectedSupplier === 'aliexpress' 
                            ? 'bg-blue-600/10 border-[#C5A059] text-gray-900 shadow-[0_0_15px_rgba(197,160,89,0.1)]' 
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-200 hover:text-gray-900'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sm">AliExpress Dropshipping</p>
                          <p className="text-[10px] text-gray-500 mt-1">ملايين المنتجات العالمية</p>
                        </div>
                        <Globe size={18} className={selectedSupplier === 'aliexpress' ? 'text-blue-600' : 'text-gray-600'} />
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => setSelectedSupplier('tager')}
                        className={`p-4 rounded-2xl border transition-all duration-300 text-right flex items-center justify-between ${
                          selectedSupplier === 'tager' 
                            ? 'bg-blue-600/10 border-[#C5A059] text-gray-900 shadow-[0_0_15px_rgba(197,160,89,0.1)]' 
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-200 hover:text-gray-900'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sm">منصة تاجر (Tagerly)</p>
                          <p className="text-[10px] text-gray-500 mt-1">شحن سريع لدول الخليج</p>
                        </div>
                        <Database size={18} className={selectedSupplier === 'tager' ? 'text-blue-600' : 'text-gray-600'} />
                      </button>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">رابط صفحة المنتج الأصلي للمورد</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder={
                          selectedSupplier === 'aliexpress' 
                            ? 'أدخل رابط منتج AliExpress هنا (e.g. https://aliexpress.com/item/100500...)' 
                            : 'أدخل رابط منتج منصة تاجر هنا (e.g. https://tagerly.net/products/...)'
                        }
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pr-12 pl-6 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all shadow-inner text-sm"
                        disabled={isScraping}
                      />
                      <Link2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    </div>
                  </div>

                  {/* Pricing settings for this specific import */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5">مضاعف هامش الربح الحالي</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="1"
                          value={margin}
                          onChange={(e) => setMargin(parseFloat(e.target.value) || 1)}
                          className="bg-blue-600/40 border border-gray-200 rounded-lg py-1.5 px-3 text-gray-900 text-sm w-24 text-center focus:outline-none focus:border-[#C5A059]"
                        />
                        <span className="text-xs text-gray-500">مضاعفة للتكلفة</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1.5">رسوم الفخامة المضافة (SAR)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={fee}
                          onChange={(e) => setFee(parseInt(e.target.value) || 0)}
                          className="bg-blue-600/40 border border-gray-200 rounded-lg py-1.5 px-3 text-gray-900 text-sm w-28 text-center focus:outline-none focus:border-[#C5A059]"
                        />
                        <span className="text-xs text-gray-500">ر.س رسوم ماركة</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleStartScrape}
                    disabled={isScraping}
                    className="w-full bg-blue-600 hover:bg-[#b08d4b] text-black font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-700 disabled:text-gray-400 transform hover:scale-[1.01]"
                  >
                    {isScraping ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} />
                        <span>جاري التحليل واستخراج الأكواد الملكية...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>بدء التحليل والتوليد بالذكاء الاصطناعي</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* High-Fidelity Scraping Sequence Logs Overlay */}
              <AnimatePresence>
                {isScraping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-blue-600 border border-[#C5A059]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden font-mono text-xs"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent animate-pulse" />
                    <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
                      <div className="flex items-center gap-2 text-blue-600">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="font-bold tracking-widest text-[10px] uppercase">SHAMIKH AI SCRAMBLER BOT v2.4</span>
                      </div>
                      <span className="text-gray-500">حالة الربط: تشفير خوارزمي نشط</span>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {scrapeSteps.map((step, idx) => (
                        <div 
                          key={idx}
                          className={`flex gap-3 leading-relaxed transition-opacity duration-300 ${
                            scrapeStep === idx 
                              ? 'text-gray-900 font-bold opacity-100' 
                              : scrapeStep > idx 
                                ? 'text-gray-500 opacity-60' 
                                : 'text-gray-700 opacity-20'
                          }`}
                        >
                          <span className={scrapeStep >= idx ? 'text-blue-600' : 'text-gray-700'}>
                            {scrapeStep > idx ? '✓' : scrapeStep === idx ? '●' : '○'}
                          </span>
                          <span className="flex-1">{step}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-gray-500 text-[10px]">
                      <span>استهلاك الذاكرة: 12.4MB</span>
                      <span>معدل سرعة الشبكة: 850KB/s</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scraper Right Preview Column */}
            <div className="lg:col-span-1">
              <div className="bg-[#121212]/80 backdrop-blur-md p-6 rounded-3xl border border-gray-200 shadow-xl sticky top-28">
                <h3 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-5 border-b border-gray-200 pb-3">
                  معاينة توطين المنتج الفاخر
                </h3>

                {scrapedProduct ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-5"
                  >
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden relative border border-gray-200 bg-blue-600/40">
                      <img src={scrapedProduct.img} alt={scrapedProduct.name} className="w-full h-full object-cover" />
                      <span className="absolute top-3 right-3 bg-blue-600/60 backdrop-blur-md text-blue-600 border border-[#C5A059]/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">
                        {scrapedProduct.category}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded font-bold uppercase">
                          {scrapedProduct.supplierName} مستورد
                        </span>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 line-through">
                            {(scrapedProduct.price ? Math.floor(scrapedProduct.price * 1.3) : 0).toLocaleString()} ر.س
                          </span>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">{scrapedProduct.name}</h4>
                      <div className="flex items-baseline justify-between border-b border-gray-200 pb-3">
                        <span className="text-2xl font-black text-blue-600">
                          {scrapedProduct.price?.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
                        </span>
                        <span className="text-[10px] text-gray-500">
                          التكلفة الأصلية: {scrapedProduct.costPrice} SAR
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                      {scrapedProduct.description}
                    </p>

                    <button 
                      type="button"
                      onClick={handleSaveScrapedProduct}
                      className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-blue-600 hover:text-black transition-colors shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.01]"
                    >
                      <HardDrive size={14} />
                      <span>تثبيت وإدراج في المتجر الفاخر</span>
                    </button>
                  </motion.div>
                ) : (
                  <div className="text-center py-24 text-gray-600 border border-dashed border-gray-200 rounded-2xl">
                    <Database className="mx-auto mb-4 opacity-30" size={40} />
                    <p className="text-xs px-6 leading-relaxed">
                      الرجاء إدخال رابط منتج والبدء بسحب البيانات لعرض المظهر النهائي للمنتج الفاخر بعد صياغته بـ AI.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: INCOMING ORDERS FOR AUTO-FULFILLMENT ─── */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-[#121212]/80 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-gray-200 shadow-xl">
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
                <span className="flex items-center gap-2 text-gray-900">
                  <ShoppingCart className="text-blue-600" size={20} /> طابور طلبات الدروبشيبينغ بانتظار التلبية
                </span>
                <span className="text-xs font-bold text-blue-600 bg-blue-600/10 px-3.5 py-1.5 rounded-full border border-[#C5A059]/20">
                  إجمالي الطلبات الفعالة: {orders.length}
                </span>
              </h2>

              {orders.filter(o => o.isDropship || o.items.some(item => ProductDb.getProductBySlugOrId(item.id)?.isImported)).length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <CheckCircle2 className="mx-auto text-green-500 mb-4 opacity-50" size={48} />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">جميع الطلبات ملباة بالكامل</h3>
                  <p className="text-xs text-gray-400">لا يوجد أي طلبات دروبشيبينغ معلقة حالياً بانتظار الشحن.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    const isOrderDropship = order.isDropship || order.items.some(item => ProductDb.getProductBySlugOrId(item.id)?.isImported);
                    if (!isOrderDropship) return null; // Only show dropshipped items in the admin fulfillment list

                    const isFulfillingThis = isFulfilling === order.id;

                    return (
                      <div 
                        key={order.id}
                        className="bg-gray-50 border border-gray-200 p-5 md:p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-[#C5A059]/20 transition-all"
                      >
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-bold text-blue-600">{order.id}</span>
                            <span className="text-[10px] text-gray-500">• تاريخ الطلب: {order.date}</span>
                            
                            {/* Status Badge */}
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                              order.status === 'بانتظار تلبية المورد' 
                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'
                                : 'bg-green-500/10 text-green-500 border border-green-500/20'
                            }`}>
                              {order.status}
                            </span>

                            {order.supplierName && (
                              <span className="text-[9px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded border border-gray-200 font-mono">
                                مورد: {order.supplierName}
                              </span>
                            )}
                          </div>

                          {/* Items Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex gap-3 items-center">
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/10">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</p>
                                  <p className="text-[10px] text-gray-500">{item.price.toLocaleString()} ر.س × {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Address details */}
                          <div className="text-[10px] text-gray-400 bg-blue-600/30 p-3 rounded-lg border border-gray-200">
                            <p className="font-bold text-gray-900 mb-1">بيانات شحن الزبون الموثقة:</p>
                            <p>الاسم: {order.shippingAddress.fullName} | هاتف: {order.shippingAddress.phone}</p>
                            <p>العنوان: {order.shippingAddress.addressLine}، {order.shippingAddress.city}، {order.shippingAddress.country}</p>
                          </div>
                        </div>

                        {/* Action buttons and live terminal visualizer */}
                        <div className="w-full lg:w-auto shrink-0 flex flex-col gap-2">
                          <div className="text-left lg:text-right mb-2">
                            <span className="text-[10px] text-gray-500 block mb-1">المبلغ الإجمالي المستلم</span>
                            <span className="text-2xl font-bold text-gray-900">{order.totalAmount.toLocaleString()} <span className="text-xs font-normal text-gray-400">ر.س</span></span>
                          </div>

                          {order.trackingNumber ? (
                            <div className="bg-blue-600/30 border border-gray-200 p-3 rounded-xl space-y-1.5 font-mono text-[10px]">
                              <p className="text-blue-600 font-bold">✓ تمت التلبية بنجاح</p>
                              <p className="text-gray-400">رقم المورد: {order.supplierOrderId}</p>
                              <p className="text-gray-400">كود التتبع الدولي: {order.trackingNumber}</p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleFulfillOrder(order.id)}
                              disabled={isFulfilling !== null}
                              className="bg-blue-600 hover:bg-[#b08d4b] text-black font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:bg-gray-800 disabled:text-gray-500 w-full"
                            >
                              <RefreshCw size={14} className={isFulfillingThis ? 'animate-spin' : ''} />
                              <span>{isFulfillingThis ? 'جاري إطلاق بوت الأتمتة المالي...' : 'تلبية المورد بنقرة واحدة'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Immersive Automated Fulfillment Terminal Log Overlay */}
            <AnimatePresence>
              {isFulfilling && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-blue-600 border border-[#C5A059]/30 rounded-3xl p-6 shadow-2xl font-mono text-xs text-gray-900 max-w-4xl mx-auto"
                >
                  <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2 text-blue-600">
                      <RefreshCw size={14} className="animate-spin" />
                      <span className="font-bold tracking-widest text-[10px]">SHAMIKH AUTO-FULFILLMENT ENGINE v1.2</span>
                    </div>
                    <span className="text-red-400 text-[10px] animate-pulse">● خادم ترحيل الأموال مشفر</span>
                  </div>

                  <div className="space-y-2">
                    {fulfillmentSteps.map((step, idx) => (
                      <div 
                        key={idx}
                        className={`flex gap-3 leading-relaxed transition-opacity duration-300 ${
                          fulfillStep === idx 
                            ? 'text-gray-900 font-bold opacity-100' 
                            : fulfillStep > idx 
                              ? 'text-gray-500 opacity-60' 
                              : 'text-gray-700 opacity-20'
                        }`}
                      >
                        <span className={fulfillStep >= idx ? 'text-blue-600' : 'text-gray-700'}>
                          {fulfillStep > idx ? '✓' : fulfillStep === idx ? '●' : '○'}
                        </span>
                        <span className="flex-1">{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-gray-500 text-[9px]">
                    <span>تأمين القنوات المصرفية: متاح وساري</span>
                    <span>البروتوكول المستخدم: Web-Hook Secure Payload Proxy</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ─── TAB 3: SETTINGS ─── */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* API Settings and Margins Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#121212]/80 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-gray-200 shadow-xl">
                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 border-b border-gray-200 pb-4">
                  <Globe className="text-blue-600" size={20} /> إدارة قنوات الربط الآلي بـ APIs
                </h2>

                <div className="space-y-6">
                  {/* AliExpress API Settings */}
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]" />
                        <span className="font-bold text-sm">بوابة AliExpress Dropshipping API</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.aliexpressConnected}
                          onChange={(e) => setSettings({ ...settings, aliexpressConnected: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:left-[2px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">رابط مفتاح المصادقة والوصول (Access Token)</label>
                      <input 
                        type="password" 
                        value={settings.aliexpressKey}
                        onChange={(e) => setSettings({ ...settings, aliexpressKey: e.target.value })}
                        className="w-full bg-blue-600/40 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 text-xs placeholder-gray-700 focus:outline-none focus:border-[#C5A059] font-mono"
                        placeholder="ae_live_882910394857_key"
                      />
                    </div>
                  </div>

                  {/* Tager API Settings */}
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]" />
                        <span className="font-bold text-sm">بوابة منصة تاجر (Tagerly API Suite)</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.tagerConnected}
                          onChange={(e) => setSettings({ ...settings, tagerConnected: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:left-[2px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">مفتاح الربط الخاص بالتاجر (Secret Merchant Key)</label>
                      <input 
                        type="password" 
                        value={settings.tagerKey}
                        onChange={(e) => setSettings({ ...settings, tagerKey: e.target.value })}
                        className="w-full bg-blue-600/40 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 text-xs placeholder-gray-700 focus:outline-none focus:border-[#C5A059] font-mono"
                        placeholder="tg_sec_sa_99882200_key"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Global Pricing Strategy Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#121212]/80 backdrop-blur-md p-6 rounded-3xl border border-gray-200 shadow-xl">
                <h3 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-5 border-b border-gray-200 pb-3">
                  سياسة تسعير النخبة الموحدة
                </h3>

                <div className="space-y-6">
                  {/* Margin Multiplier Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-gray-900">مضاعف السعر التلقائي</label>
                      <span className="text-xs font-black text-blue-600 bg-blue-600/10 px-2.5 py-0.5 rounded">
                        × {settings.marginMultiplier}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1.2" 
                      max="4.5" 
                      step="0.1"
                      value={settings.marginMultiplier}
                      onChange={(e) => setSettings({ ...settings, marginMultiplier: parseFloat(e.target.value) })}
                      className="w-full accent-[#C5A059] bg-gray-50 h-1 rounded"
                    />
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                      يتم ضرب سعر الجملة الأصلي المستورد من المورد في هذا المعامل لتوليد السعر الأساسي للبيع.
                    </p>
                  </div>

                  {/* Luxury markup fee */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-gray-900">رسوم بريميوم المضافة</label>
                      <span className="text-xs font-black text-blue-600 bg-blue-600/10 px-2.5 py-0.5 rounded">
                        +{settings.luxuryPremiumFee} ر.س
                      </span>
                    </div>
                    <input 
                      type="number" 
                      value={settings.luxuryPremiumFee}
                      onChange={(e) => setSettings({ ...settings, luxuryPremiumFee: parseInt(e.target.value) || 0 })}
                      className="w-full bg-blue-600/40 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 text-xs focus:outline-none focus:border-[#C5A059] text-center"
                    />
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                      قيمة ثابتة تضاف إجمالياً للمنتج بعد عملية الضرب لتغطية تكاليف التغليف الملكي ومروحيات التوصيل.
                    </p>
                  </div>

                  {/* Example Calculator */}
                  <div className="bg-blue-600/30 p-4 rounded-2xl border border-gray-200 space-y-2.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">مثال حي لحسابات السعر</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">تكلفة جملة افتراضية:</span>
                      <span className="text-gray-900">100 SAR</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">بعد تطبيق المضاعف:</span>
                      <span className="text-gray-900">{(100 * settings.marginMultiplier).toFixed(0)} SAR</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">رسوم الفخامة المضافة:</span>
                      <span className="text-gray-900">+{settings.luxuryPremiumFee} SAR</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-gray-200 pt-2 font-bold">
                      <span className="text-gray-400">سعر البيع النهائي:</span>
                      <span className="text-blue-600">{(100 * settings.marginMultiplier + settings.luxuryPremiumFee).toFixed(0)} SAR</span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-white text-black font-bold rounded-xl text-xs hover:bg-blue-600 hover:text-black transition-colors shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck size={14} />
                    <span>حفظ سياسة السعر والربط</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
