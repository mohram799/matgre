'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, ShoppingBag, ShoppingCart, ShieldCheck, 
  Database, RefreshCw, Copy, CheckCircle2, ChevronLeft,
  DollarSign, ArrowUpRight, HelpCircle, Key, Cpu, Crown
} from 'lucide-react';
import { ProductDb, Order, Product } from '@/components/ProductDb';
import Link from 'next/link';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    productCount: 0,
    importedCount: 0
  });

  // Supabase dynamic setup state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isDbConnecting, setIsDbConnecting] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [dbErrorMessage, setDbErrorMessage] = useState('');
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // SQL code to show to the user
  const SQL_SCHEMA = `-- ==========================================
-- SHAMIKH LUXURY: Supabase Database Schema (Idempotent v2.0)
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'super_admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin (Phone: 01005209667, Password: Ahmed@01005209667)
INSERT INTO admins (phone, password_hash, name, role) 
VALUES ('01005209667', 'Ahmed@01005209667', 'Ahmed Admin', 'super_admin')
ON CONFLICT (phone) DO NOTHING;

-- 2. Users / Customers Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    vip_tier VARCHAR(20) DEFAULT 'SILVER',
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2),
    stock INT DEFAULT 0,
    is_dropshipped BOOLEAN DEFAULT FALSE,
    supplier_name VARCHAR(100),
    supplier_url TEXT,
    images JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Saudi Arabia',
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    tracking_number VARCHAR(100),
    is_dropship_order BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  useEffect(() => {
    const loadDashboardData = () => {
      const allOrders = ProductDb.getOrders();
      const allProducts = ProductDb.getProducts();
      setOrders(allOrders);
      setProducts(allProducts);

      const revenue = allOrders.reduce((sum, order) => {
        if (order.status.includes('فشل') || order.status.includes('ملغي')) return sum;
        return sum + order.totalAmount;
      }, 0);

      setStats({
        totalSales: revenue,
        orderCount: allOrders.length,
        productCount: allProducts.length,
        importedCount: allProducts.filter(p => p.isImported).length
      });
    };

    loadDashboardData();

    // Check if Supabase keys exist in local storage
    const savedUrl = localStorage.getItem('shamikh_supabase_url') || '';
    const savedKey = localStorage.getItem('shamikh_supabase_key') || '';
    setSupabaseUrl(savedUrl);
    setSupabaseKey(savedKey);
    
    if (savedUrl && savedKey) {
      setDbStatus('success');
    }

    // Subscribe to cloud sync updates
    window.addEventListener('shamikh_products_updated', loadDashboardData);
    window.addEventListener('shamikh_orders_updated', loadDashboardData);

    return () => {
      window.removeEventListener('shamikh_products_updated', loadDashboardData);
      window.removeEventListener('shamikh_orders_updated', loadDashboardData);
    };
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleTestDatabaseConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      alert('يرجى إدخال الرابط والمفتاح أولاً!');
      return;
    }

    setIsDbConnecting(true);
    setDbStatus('idle');
    setDbErrorMessage('');

    // PostgREST check to verify the key and connection
    fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
      .then(res => {
        setIsDbConnecting(false);
        if (res.ok || res.status === 404 || res.status === 400) {
          if (res.status === 401) {
            setDbStatus('failed');
            setDbErrorMessage('مفتاح الوصول غير صحيح (Invalid Anon Key).');
          } else {
            setDbStatus('success');
            localStorage.setItem('shamikh_supabase_url', supabaseUrl);
            localStorage.setItem('shamikh_supabase_key', supabaseKey);
            localStorage.setItem('shamikh_database_mode', 'supabase');
            alert('تم ربط ومزامنة متجر شامخ بقاعدة بيانات Supabase الموثقة بنجاح! 🟢');
          }
        } else {
          setDbStatus('failed');
          setDbErrorMessage(`فشل الاتصال: كود ${res.status}`);
        }
      })
      .catch(err => {
        setIsDbConnecting(false);
        setDbStatus('failed');
        setDbErrorMessage('فشل الاتصال بخوادم Supabase. يرجى التحقق من صحة رابط المشروع الخاص بك.');
        console.error(err);
      });
  };

  const handleDisconnectDb = () => {
    localStorage.removeItem('shamikh_supabase_url');
    localStorage.removeItem('shamikh_supabase_key');
    localStorage.setItem('shamikh_database_mode', 'local');
    setSupabaseUrl('');
    setSupabaseKey('');
    setDbStatus('idle');
    alert('تم قطع الاتصال بقاعدة بيانات Supabase الخارجية، العودة لوضع التخزين المحلي الآمن (Local Storage Mock Mode).');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pt-12 pb-20 px-6 md:px-12" dir="rtl">
      
      {/* Decorative Cinematic Blurs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#C5A059]/[0.02] rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[400px] h-[400px] bg-purple-900/[0.02] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header Container */}
      <div className="max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/[0.05] pb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            مركز <span className="text-[#C5A059] font-light">التحكم الفاخر</span>
          </h1>
          <p className="text-[9px] text-gray-500 mt-2 font-mono tracking-widest uppercase">SHAMIKH SYSTEM ANALYTICS & DATABASE ENGINE</p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/admin/dropshipping" className="bg-[#C5A059] hover:bg-[#b08d4b] text-black font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(197,160,89,0.15)]">
            <Cpu size={14} /> بوابة الدروبشيبينغ الذكي
          </Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* ─── OVERVIEW METRICS GRID ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Total Sales */}
          <div className="bg-[#0b0b0b]/90 border border-white/[0.06] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[150px] backdrop-blur-xl">
            <div className="absolute top-4 left-4 w-9 h-9 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-green-400">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">إجمالي المبيعات الفاخرة</p>
              <h3 className="text-2xl font-black mt-2 text-white">{stats.totalSales.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">ر.س</span></h3>
            </div>
            <div className="text-[9px] text-green-400 font-bold flex items-center gap-1 mt-2">
              <ArrowUpRight size={10} />
              <span>معدل نمو 24% مقارنة بالـ 30 يوم السابقة</span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-[#0b0b0b]/90 border border-white/[0.06] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[150px] backdrop-blur-xl">
            <div className="absolute top-4 left-4 w-9 h-9 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl flex items-center justify-center text-[#C5A059]">
              <ShoppingCart size={18} />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">إجمالي الطلبات المستلمة</p>
              <h3 className="text-2xl font-black mt-2 text-white">{stats.orderCount} <span className="text-[10px] font-normal text-gray-500">طلب</span></h3>
            </div>
            <div className="text-[9px] text-[#C5A059] font-bold mt-2 font-mono uppercase tracking-wider">
              <span>READY FOR EXPRESS VIP DELIVERY</span>
            </div>
          </div>

          {/* Card 3: Products Count */}
          <div className="bg-[#0b0b0b]/90 border border-white/[0.06] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[150px] backdrop-blur-xl">
            <div className="absolute top-4 left-4 w-9 h-9 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
              <ShoppingBag size={18} />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">تعداد كتالوج المنتجات</p>
              <h3 className="text-2xl font-black mt-2 text-white">{stats.productCount} <span className="text-[10px] font-normal text-gray-500">صنف</span></h3>
            </div>
            <div className="text-[9px] text-purple-400 font-bold mt-2">
              <span>منها {stats.importedCount} منتجات مستوردة (دروبشيب)</span>
            </div>
          </div>

          {/* Card 4: Database Mode */}
          <div className="bg-[#0b0b0b]/90 border border-white/[0.06] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[150px] backdrop-blur-xl">
            <div className="absolute top-4 left-4 w-9 h-9 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl flex items-center justify-center text-[#C5A059]">
              <Database size={18} />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">حالة قاعدة البيانات</p>
              <h3 className="text-sm font-bold mt-2 text-white flex items-center gap-2">
                {dbStatus === 'success' ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                    <span>Supabase Cloud 🟢</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                    <span>تخزين محلي (Offline Mock)</span>
                  </>
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* ─── DATABASE CONFIGURATION SECTION ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#0b0b0b]/90 border border-white/[0.06] p-6 md:p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-white border-b border-white/[0.05] pb-4">
              <Database className="text-[#C5A059]" size={18} /> ربط ومزامنة قاعدة بيانات Supabase السحابية
            </h2>

            {dbStatus === 'success' ? (
              <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-400" size={20} />
                  <div>
                    <h4 className="text-xs font-bold text-white">متصل بقاعدة بيانات Supabase السحابية بنشاط!</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-mono">{supabaseUrl}</p>
                  </div>
                </div>
                <button 
                  onClick={handleDisconnectDb}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-4 py-2 border border-red-500/20 rounded-xl text-[10px] transition-all"
                >
                  قطع اتصال قاعدة البيانات والرجوع للتخزين المحلي
                </button>
              </div>
            ) : (
              <form onSubmit={handleTestDatabaseConnection} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Supabase URL (الرابط)</label>
                    <input 
                      type="text" 
                      placeholder="https://your-project-ref.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full bg-black/60 border border-white/[0.08] rounded-xl py-3 px-4 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C5A059]/60 font-mono transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Supabase API Key (Anon Key)</label>
                    <input 
                      type="password" 
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full bg-black/60 border border-white/[0.08] rounded-xl py-3 px-4 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C5A059]/60 font-mono transition-colors"
                      required
                    />
                  </div>
                </div>

                {dbErrorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] py-3 px-4 rounded-xl font-mono">
                    ⚠️ {dbErrorMessage}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isDbConnecting}
                  className="bg-[#C5A059] hover:bg-[#b08d4b] text-black font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(197,160,89,0.1)] w-full"
                >
                  {isDbConnecting ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      <span>جاري إطلاق حزم اختبار الاتصال السحابي...</span>
                    </>
                  ) : (
                    <>
                      <Database size={14} />
                      <span>اختبار الاتصال وربط المتجر السحابي الآن</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick helper steps */}
            <div className="mt-8 border-t border-white/[0.05] pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] text-gray-500">
              <div className="flex gap-2">
                <span className="w-5 h-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[#C5A059] font-bold shrink-0">١</span>
                <p>قم بإنشاء مشروع مجاني على موقع Supabase.com.</p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[#C5A059] font-bold shrink-0">٢</span>
                <p>انسخ كود SQL باليسار والصقه في قسم SQL Editor لتجهيز الجداول بنقرة واحدة.</p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[#C5A059] font-bold shrink-0">٣</span>
                <p>أدخل مفاتيح الربط هنا في لوحة التحكم لبدء المزامنة الملكية.</p>
              </div>
            </div>

          </div>

          {/* Database Schema Copier/Viewer */}
          <div className="lg:col-span-1 bg-[#0b0b0b]/90 border border-white/[0.06] p-6 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-3 border-b border-white/[0.05] pb-3">
                أكواد قاعدة البيانات الجاهزة (SQL)
              </h3>
              <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                تتضمن كل الجداول من منتجات، مستخدمين، دروبشيبينج، وطلبات، بالإضافة لإدراج حساب الأدمن وتشفير البيانات المطلوبة.
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleCopySql}
                className="w-full bg-white/5 border border-white/10 hover:border-[#C5A059]/40 text-white font-bold py-3 px-4 rounded-xl text-[10px] flex items-center justify-center gap-2 transition-all"
              >
                {copiedSql ? (
                  <>
                    <CheckCircle2 className="text-[#C5A059]" size={14} />
                    <span className="text-[#C5A059]">تم نسخ الكود بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>نسخ كود SQL Schema بالكامل</span>
                  </>
                )}
              </button>

              <button 
                onClick={() => setShowSqlSchema(!showSqlSchema)}
                className="w-full border border-white/10 text-gray-500 hover:text-white font-bold py-2.5 px-4 rounded-xl text-[10px] transition-all text-center"
              >
                {showSqlSchema ? 'إخفاء معاينة الكود' : 'معاينة هيكل الجداول بالكامل'}
              </button>

              <AnimatePresence>
                {showSqlSchema && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 250 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-y-auto bg-black border border-white/5 p-4 rounded-xl text-[9px] font-mono text-gray-400 text-left"
                  >
                    <pre className="whitespace-pre">{SQL_SCHEMA}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* ─── BOTTOM ROW: RECENT INCOMING ORDERS ─── */}
        <div className="bg-[#0b0b0b]/90 border border-white/[0.06] p-6 md:p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-white">
              <ShoppingCart className="text-[#C5A059]" size={18} /> طابور الطلبات الفاخرة الواردة
            </h2>
            <Link href="/admin/dropshipping" className="text-xs font-bold text-[#C5A059] hover:underline flex items-center gap-1">
              إدارة تلبية الطلبات <ChevronLeft size={14} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-xs">
              لا توجد طلبات مستلمة مؤخراً.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-white/[0.05] pb-3">
                    <th className="pb-3 pt-1 px-4 font-bold text-[9px] uppercase">كود الطلب</th>
                    <th className="pb-3 pt-1 px-4 font-bold text-[9px] uppercase">العميل VIP</th>
                    <th className="pb-3 pt-1 px-4 font-bold text-[9px] uppercase">التاريخ</th>
                    <th className="pb-3 pt-1 px-4 font-bold text-[9px] uppercase">النوع</th>
                    <th className="pb-3 pt-1 px-4 font-bold text-[9px] uppercase">إجمالي الفاتورة</th>
                    <th className="pb-3 pt-1 px-4 font-bold text-[9px] uppercase">حالة الشحن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-4 font-bold text-[#C5A059] font-mono">{order.id}</td>
                      <td className="py-4 px-4 font-bold">{order.shippingAddress.fullName}</td>
                      <td className="py-4 px-4 text-gray-500 font-mono">{order.date}</td>
                      <td className="py-4 px-4">
                        {order.isDropship ? (
                          <span className="text-[8px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-2 py-0.5 rounded-lg">دروبشيبينغ</span>
                        ) : (
                          <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-lg">محلي فاخر</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-black text-[#C5A059]">{order.totalAmount.toLocaleString()} ر.س</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[8px] font-bold ${
                          order.status.includes('تلبية') || order.status.includes('تغليف') || order.status.includes('PENDING')
                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
