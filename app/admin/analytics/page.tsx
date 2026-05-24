'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, DollarSign, ShoppingCart,
  ShoppingBag, Users, Crown, Globe, Zap, ArrowUpRight,
  Calendar, Package, Truck
} from 'lucide-react';
import { ProductDb, Order, Product } from '@/components/ProductDb';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setOrders(ProductDb.getOrders());
    setProducts(ProductDb.getProducts());
  }, []);

  const completedOrders = orders.filter(o => !['FAILED', 'CANCELLED'].includes(o.status));
  const totalRevenue = completedOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCost = completedOrders.reduce((s, o) => {
    const costTotal = o.items.reduce((sum, item) => {
      const product = products.find(p => p.name === item.name);
      return sum + (product?.costPrice || 0) * item.quantity;
    }, 0);
    return s + costTotal;
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const dropshipOrders = completedOrders.filter(o => o.isDropship);
  const dropshipRevenue = dropshipOrders.reduce((s, o) => s + o.totalAmount, 0);

  // Top products by sales
  const productSales: Record<string, { name: string; count: number; revenue: number; category: string }> = {};
  completedOrders.forEach(o => {
    o.items.forEach(item => {
      if (!productSales[item.name]) {
        productSales[item.name] = { name: item.name, count: 0, revenue: 0, category: item.category };
      }
      productSales[item.name].count += item.quantity;
      productSales[item.name].revenue += item.price * item.quantity;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Category breakdown
  const catBreakdown: Record<string, number> = {};
  completedOrders.forEach(o => {
    o.items.forEach(item => {
      catBreakdown[item.category] = (catBreakdown[item.category] || 0) + item.price * item.quantity;
    });
  });
  const totalCatRevenue = Object.values(catBreakdown).reduce((s, v) => s + v, 0) || 1;

  const DEMO_CHART = [45, 78, 55, 92, 68, 120, 88, 95, 72, 115, 140, 108];
  const maxChart = Math.max(...DEMO_CHART);

  const statCards = [
    { label: 'إجمالي الإيرادات', value: `${totalRevenue.toLocaleString()} ر.س`, change: '+24%', icon: DollarSign, color: 'text-green-400', positive: true },
    { label: 'صافي الأرباح', value: `${totalProfit.toLocaleString()} ر.س`, change: '+18%', icon: TrendingUp, color: 'text-blue-600', positive: true },
    { label: 'إجمالي الطلبات', value: orders.length, change: `${completedOrders.length} مكتمل`, icon: ShoppingCart, color: 'text-blue-400', positive: true },
    { label: 'إيرادات دروبشيب', value: `${dropshipRevenue.toLocaleString()} ر.س`, change: `${dropshipOrders.length} طلب`, icon: Globe, color: 'text-purple-400', positive: true },
    { label: 'المنتجات النشطة', value: products.length, change: `${products.filter(p => p.isImported).length} مستورد`, icon: ShoppingBag, color: 'text-yellow-400', positive: true },
    { label: 'متوسط قيمة الطلب', value: `${Math.round(totalRevenue / (completedOrders.length || 1)).toLocaleString()} ر.س`, change: 'AOV', icon: Zap, color: 'text-cyan-400', positive: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans pt-12 pb-20 px-6 md:px-10" dir="rtl">

      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="max-w-[1400px] mx-auto mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3 mb-1">
          <BarChart2 className="text-blue-600" size={32} />
          مركز <span className="text-blue-600 font-light">التحليلات الذكية</span>
        </h1>
        <p className="text-xs text-gray-500 tracking-widest uppercase">SHAMIKH INTELLIGENCE & BUSINESS ANALYTICS COMMAND</p>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden group hover:border-[#C5A059]/20 transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/3 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <stat.icon className={stat.color} size={20} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  stat.positive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400'
                } flex items-center gap-1`}>
                  {stat.positive && <ArrowUpRight size={9} />}
                  {stat.change}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart + Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Monthly Revenue Chart */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="text-blue-600" size={16} />
                  اتجاه الإيرادات الشهرية (2026)
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">MONTHLY REVENUE PERFORMANCE INDEX</p>
              </div>
              <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <ArrowUpRight size={9} /> +24% YoY
              </span>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end gap-2 h-48">
              {DEMO_CHART.map((val, idx) => {
                const height = (val / maxChart) * 100;
                const isCurrentMonth = idx === new Date().getMonth();
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group/bar">
                    <div className="w-full relative" style={{ height: '100%' }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: idx * 0.04, duration: 0.6, ease: 'easeOut' }}
                        className={`absolute bottom-0 w-full rounded-t-lg transition-all cursor-pointer ${
                          isCurrentMonth
                            ? 'bg-gradient-to-t from-[#C5A059] to-[#f0c87a] shadow-[0_0_15px_rgba(197,160,89,0.3)]'
                            : 'bg-white/10 group-hover/bar:bg-blue-600/30'
                        }`}
                      />
                    </div>
                    <span className="text-[8px] text-gray-600">{MONTHS_AR[idx].slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-600" />
                <span className="text-[10px] text-gray-400">الشهر الحالي</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-white/15" />
                <span className="text-[10px] text-gray-400">الأشهر السابقة</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6">
              <ShoppingBag className="text-blue-600" size={16} />
              توزيع المبيعات بالقسم
            </h3>

            {Object.keys(catBreakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(catBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, revenue], i) => {
                    const percentage = Math.round((revenue / totalCatRevenue) * 100);
                    const COLORS = ['bg-blue-600', 'bg-blue-500', 'bg-purple-500', 'bg-green-500'];
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-300 font-bold text-[10px]">{cat}</span>
                          <span className="text-gray-500 text-[10px]">{percentage}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className={`h-full rounded-full ${COLORS[i % COLORS.length]}`}
                          />
                        </div>
                        <p className="text-[9px] text-gray-600 mt-1">{revenue.toLocaleString()} ر.س</p>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-600">
                <BarChart2 className="mx-auto mb-3 opacity-30" size={36} />
                <p className="text-xs">لا تتوفر بيانات مبيعات بعد</p>
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">إجمالي المبيعات</span>
                <span className="font-black text-gray-900">{totalRevenue.toLocaleString()} ر.س</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products + Order Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Products */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Crown className="text-blue-600" size={16} />
              أعلى المنتجات مبيعاً
            </h3>

            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, i) => (
                  <div key={product.name} className="flex items-center gap-4">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      i === 0 ? 'bg-blue-600 text-black' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                      <p className="text-[9px] text-gray-500">{product.category} · {product.count} وحدة مباعة</p>
                    </div>
                    <span className="text-xs font-black text-blue-600 shrink-0">{product.revenue.toLocaleString()} ر.س</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-600">
                <Package className="mx-auto mb-3 opacity-30" size={36} />
                <p className="text-xs">لا توجد مبيعات مسجلة بعد</p>
              </div>
            )}
          </div>

          {/* Order Pipeline */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Truck className="text-blue-600" size={16} />
              حالة خط أنابيب الطلبات
            </h3>

            <div className="space-y-4">
              {[
                { label: 'قيد الانتظار', status: 'PENDING', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
                { label: 'جاري التجهيز', status: 'PROCESSING', color: 'bg-blue-500', textColor: 'text-blue-400' },
                { label: 'تم الشحن', status: 'SHIPPED', color: 'bg-purple-500', textColor: 'text-purple-400' },
                { label: 'تم التسليم', status: 'DELIVERED', color: 'bg-green-500', textColor: 'text-green-400' },
                { label: 'ملغي/فشل', status: 'FAILED', color: 'bg-red-500', textColor: 'text-red-400' },
              ].map(({ label, status, color, textColor }) => {
                const count = orders.filter(o => o.status === status || (status === 'FAILED' && o.status === 'CANCELLED')).length;
                const percentage = Math.round((count / (orders.length || 1)) * 100);
                return (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-[10px] font-bold ${textColor}`}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">{count} طلب</span>
                        <span className="text-[10px] text-gray-700">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xl font-black text-gray-900">{orders.length}</p>
                <p className="text-[9px] text-gray-500">إجمالي الطلبات</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-blue-600">
                  {orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0}%
                </p>
                <p className="text-[9px] text-gray-500">معدل الإكمال</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
