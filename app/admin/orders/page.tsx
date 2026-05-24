'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, Filter, CheckCircle2, Clock,
  Truck, XCircle, RefreshCw, Eye, ChevronDown, AlertCircle,
  TrendingUp, DollarSign, Package, Loader2, Landmark
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  'pending':    { label: 'قيد الانتظار',    color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200', icon: Clock },
  'confirmed':  { label: 'تم التأكيد',      color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   icon: Package },
  'processing': { label: 'جاري التجهيز',    color: 'text-blue-500',   bg: 'bg-blue-50 border-blue-200',     icon: RefreshCw },
  'shipped':    { label: 'تم الشحن',        color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', icon: Truck },
  'delivered':  { label: 'تم التسليم',      color: 'text-green-600',  bg: 'bg-green-50 border-green-200',   icon: CheckCircle2 },
  'failed':     { label: 'فشل الدفع',       color: 'text-red-500',    bg: 'bg-red-50 border-red-200',       icon: XCircle },
  'cancelled':  { label: 'ملغي',            color: 'text-gray-500',   bg: 'bg-gray-100 border-gray-200',    icon: XCircle },
  'refunded':   { label: 'مسترجع',          color: 'text-rose-500',   bg: 'bg-rose-50 border-rose-200',     icon: XCircle },
};

const STATUS_SEQUENCE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  order_number: number;
  order_number_str?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_country?: string;
  total_amount: number;
  discount_amount?: number;
  coupon_code?: string;
  payment_method?: string;
  payment_status?: string;
  status: string;
  is_dropship_order?: boolean;
  tracking_number?: string;
  tracking_carrier?: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<'supabase' | 'mock'>('mock');
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Custom Status Edit States
  const [editStatus, setEditStatus] = useState('');
  const [editTrackingNum, setEditTrackingNum] = useState('');
  const [editTrackingCarrier, setEditTrackingCarrier] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        headers: { 'x-admin-user': JSON.stringify({ name: 'المشرف', role: 'SUPER_ADMIN' }) }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setDataMode(data.mode === 'supabase' ? 'supabase' : 'mock');
      } else {
        throw new Error('فشل تحميل الطلبات من الخادم');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
      setDataMode('mock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateOrderStatus = async (orderId: string, status: string, trackingNum = '', trackingCarrier = '') => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': JSON.stringify({ name: 'المشرف', role: 'SUPER_ADMIN' }),
        },
        body: JSON.stringify({
          status,
          tracking_number: trackingNum,
          tracking_carrier: trackingCarrier,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        // Update local list
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated.order } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, ...updated.order } : null);
        }
      }
    } catch {
      // Optimistic update for mock
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status,
        tracking_number: trackingNum || o.tracking_number,
        tracking_carrier: trackingCarrier || o.tracking_carrier
      } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          status,
          tracking_number: trackingNum || prev.tracking_number,
          tracking_carrier: trackingCarrier || prev.tracking_carrier
        } : null);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter(o => {
    const term = search.toLowerCase();
    const matchSearch = !search ||
      o.id.toLowerCase().includes(term) ||
      (o.order_number_str && o.order_number_str.toLowerCase().includes(term)) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.customer_phone.includes(term);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders
    .filter(o => !['failed', 'cancelled', 'refunded'].includes(o.status))
    .reduce((s, o) => s + (o.total_amount || 0), 0);

  const pendingCount = orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length;

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || { label: status, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', icon: Clock };
  };

  // Sync edit fields when selectedOrder changes
  useEffect(() => {
    if (selectedOrder) {
      setEditStatus(selectedOrder.status);
      setEditTrackingNum(selectedOrder.tracking_number || '');
      setEditTrackingCarrier(selectedOrder.tracking_carrier || '');
    }
  }, [selectedOrder]);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-gray-900 font-sans pt-12 pb-24 px-6 md:px-10" dir="rtl">

      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#C5A059]/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="max-w-[1400px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3 mb-1">
            <ShoppingCart className="text-[#C5A059]" size={32} />
            مركز <span className="text-[#C5A059] font-light">إدارة الطلبات</span>
          </h1>
          <p className="text-[10px] text-gray-500 tracking-widest uppercase font-mono">
            SHAMIKH ORDER MANAGEMENT CENTER
            <span className={`mr-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${dataMode === 'supabase' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {dataMode === 'supabase' ? '🟢 Supabase Live' : '🟡 Mock Mode'}
            </span>
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-[#C5A059] text-gray-700 text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          تحديث الطلبات
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الطلبات', value: orders.length, icon: ShoppingCart, color: 'text-gray-700' },
            { label: 'إجمالي الإيرادات', value: `${totalRevenue.toLocaleString()} ر.س`, icon: DollarSign, color: 'text-green-600' },
            { label: 'طلبات معلقة', value: pendingCount, icon: Clock, color: 'text-yellow-500' },
            { label: 'طلب تم تسليمه', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle2, color: 'text-green-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <s.icon className={s.color} size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="ابحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-gray-900 text-xs focus:outline-none focus:border-[#C5A059] transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'failed'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-full text-[10px] font-bold transition-all border ${
                  filterStatus === s
                    ? 'bg-[#C5A059] text-white border-[#C5A059]'
                    : 'bg-gray-50 text-gray-500 hover:bg-white border-gray-200'
                }`}
              >
                {s === 'all' ? 'الكل' : getStatusConfig(s).label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900">جدول الطلبات المباشرة ({filtered.length})</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 size={32} className="animate-spin mr-3" />
              <span className="text-sm">جاري تحميل لوحة المبيعات...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingCart className="mx-auto mb-4 opacity-30" size={48} />
              <p className="text-xs">لا توجد طلبات مطابقة للفرز الحالي.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 bg-gray-50/30">
                    {['الرقم التسلسلي', 'العميل', 'المبلغ', 'الحالة', 'النوع', 'تاريخ الطلب', 'إجراءات'].map(h => (
                      <th key={h} className="pb-3 pt-4 px-6 font-bold text-[10px] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(order => {
                    const sc = getStatusConfig(order.status);
                    const StatusIcon = sc.icon;
                    const orderNumLabel = order.order_number_str || `SHM-${String(order.order_number || order.id.slice(0, 6)).toUpperCase()}`;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-[#C5A059]">{orderNumLabel}</td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-900">{order.customer_name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{order.customer_phone}</p>
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-900">
                          {order.total_amount.toLocaleString()} <span className="text-[9px] text-gray-500">ر.س</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`${sc.color} ${sc.bg} border px-2.5 py-1 rounded-full text-[9px] font-bold inline-flex items-center gap-1`}>
                            <StatusIcon size={10} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {order.is_dropship_order
                            ? <span className="bg-blue-50 text-blue-500 border border-blue-200 px-2 py-0.5 rounded-full text-[9px] font-bold">دروبشيب</span>
                            : <span className="bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-bold">محلي</span>
                          }
                        </td>
                        <td className="py-4 px-6 text-gray-400 font-mono text-[10px]">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG') : '—'}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setSelectedOrder(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">تفاصيل الفاتورة الفاخرة</h2>
                  <p className="text-[10px] text-[#C5A059] font-mono mt-0.5">
                    ID: {selectedOrder.order_number_str || selectedOrder.id}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              {/* Status and Actions */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">الحالة الحالية</p>
                  {(() => {
                    const sc = getStatusConfig(selectedOrder.status);
                    const StatusIcon = sc.icon;
                    return (
                      <span className={`${sc.color} ${sc.bg} border px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-2`}>
                        <StatusIcon size={12} />
                        {sc.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-end justify-start md:justify-end gap-2">
                  {STATUS_SEQUENCE.indexOf(selectedOrder.status) !== -1 && selectedOrder.status !== 'delivered' && (
                    <button
                      onClick={() => {
                        const idx = STATUS_SEQUENCE.indexOf(selectedOrder.status);
                        const next = STATUS_SEQUENCE[idx + 1] || 'delivered';
                        updateOrderStatus(selectedOrder.id, next, editTrackingNum, editTrackingCarrier);
                      }}
                      disabled={updatingId === selectedOrder.id}
                      className="bg-[#C5A059] text-white hover:bg-[#b08d4b] font-bold px-4 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                    >
                      {updatingId === selectedOrder.id ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
                      المرحلة التالية
                    </button>
                  )}
                </div>
              </div>

              {/* Customer and Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">بيانات العميل</p>
                  <p className="text-sm font-bold text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-1">{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedOrder.customer_email}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">عنوان الشحن</p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {selectedOrder.shipping_address}
                  </p>
                  <p className="text-xs text-gray-900 font-bold mt-1.5">
                    {selectedOrder.shipping_city} {selectedOrder.shipping_country ? `، ${selectedOrder.shipping_country}` : ''}
                  </p>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">المنتجات المطلوبة</p>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 border-b border-gray-200/50 pb-3 last:border-0 last:pb-0">
                      {item.image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {item.price.toLocaleString()} ر.س × {item.quantity}
                        </p>
                      </div>
                      <p className="text-xs font-black text-gray-900 shrink-0">
                        {(item.price * item.quantity).toLocaleString()} ر.س
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">لا تتوفر تفاصيل للمنتجات الفردية.</p>
                )}

                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">المجموع الإجمالي</span>
                  <span className="text-base font-black text-[#C5A059]">
                    {selectedOrder.total_amount.toLocaleString()} ر.س
                  </span>
                </div>
              </div>

              {/* Tracking form & details */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-4">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">لوجستيات وتتبع الشحن</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-gray-500 block mb-1">شركة الشحن</label>
                    <input
                      type="text"
                      value={editTrackingCarrier}
                      onChange={e => setEditTrackingCarrier(e.target.value)}
                      placeholder="مثال: شامخ VIP"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 block mb-1">رقم التتبع</label>
                    <input
                      type="text"
                      value={editTrackingNum}
                      onChange={e => setEditTrackingNum(e.target.value)}
                      placeholder="مثال: TRK-5541..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 flex-1"
                  >
                    {Object.keys(STATUS_CONFIG).map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, editStatus, editTrackingNum, editTrackingCarrier)}
                    disabled={updatingId === selectedOrder.id}
                    className="bg-gray-900 text-white font-bold px-4 py-2 rounded-xl text-[10px] hover:bg-gray-800 transition-colors shrink-0"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
