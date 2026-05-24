'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Crown, ShieldCheck, MessageCircle,
  Phone, Mail, MapPin, ShoppingBag, Ban, CheckCircle2,
  TrendingUp, DollarSign, XCircle, Eye, RefreshCw,
  Diamond, Star, Loader2, AlertCircle
} from 'lucide-react';

// VIP Tier Config — aligned with Supabase vip_tier slug values
const VIP_CONFIG: Record<string, { label: string; arabicLabel: string; color: string; bg: string; border: string; discount: number; icon: string }> = {
  guest:   { label: 'Guest',   arabicLabel: 'عميل عادي',      color: 'text-gray-400',   bg: 'bg-gray-100',          border: 'border-gray-200',      discount: 0,  icon: '👤' },
  bronze:  { label: 'Bronze',  arabicLabel: 'الكفو',           color: 'text-amber-700',  bg: 'bg-amber-50',          border: 'border-amber-200',     discount: 5,  icon: '🥉' },
  silver:  { label: 'Silver',  arabicLabel: 'الهيبة',          color: 'text-gray-500',   bg: 'bg-gray-100',          border: 'border-gray-300',      discount: 12, icon: '🥈' },
  gold:    { label: 'Gold',    arabicLabel: 'الشامخ',          color: 'text-[#C5A059]',  bg: 'bg-[#C5A059]/5',       border: 'border-[#C5A059]/30',  discount: 20, icon: '👑' },
  diamond: { label: 'Diamond', arabicLabel: 'الملكي النادر',  color: 'text-blue-400',   bg: 'bg-blue-50',           border: 'border-blue-200',      discount: 30, icon: '💎' },
};

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vip_tier: string;
  total_spent: number;
  orders_count: number;
  points: number;
  is_blocked: boolean;
  created_at: string;
}

// Mock fallback data
const MOCK_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'الأمير فيصل بن خالد', phone: '+966501234567', email: 'faisal@royalfamily.sa', vip_tier: 'diamond', total_spent: 342000, orders_count: 18, points: 34200, is_blocked: false, created_at: new Date(Date.now() - 86400000 * 180).toISOString() },
  { id: 'cust-2', name: 'الشيخة نورة آل مكتوم', phone: '+971501234567', email: 'noura@ruling.ae',     vip_tier: 'gold',    total_spent: 87500,  orders_count: 11, points: 8750,  is_blocked: false, created_at: new Date(Date.now() - 86400000 * 90).toISOString() },
  { id: 'cust-3', name: 'خالد العليا',           phone: '+966559876543', email: null as any,            vip_tier: 'silver',  total_spent: 22000,  orders_count: 4,  points: 2200,  is_blocked: false, created_at: new Date(Date.now() - 86400000 * 60).toISOString() },
  { id: 'cust-4', name: 'محمد النخبة',           phone: '+966551112233', email: null as any,            vip_tier: 'bronze',  total_spent: 6500,   orders_count: 2,  points: 650,   is_blocked: false, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: 'cust-5', name: 'سلمى الفهد',            phone: '+966509876543', email: 'salma@luxury.sa',     vip_tier: 'guest',   total_spent: 1200,   orders_count: 1,  points: 120,   is_blocked: true,  created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
];

export default function AdminCustomersPage() {
  const [customers, setCustomers]         = useState<Customer[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [dataMode, setDataMode]           = useState<'supabase' | 'mock'>('mock');
  const [search, setSearch]               = useState('');
  const [filterTier, setFilterTier]       = useState('all');
  const [selected, setSelected]           = useState<Customer | null>(null);
  const [toggling, setToggling]           = useState<string | null>(null);

  // Load customers from /api/users, fall back to mock
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users?limit=100', {
        headers: { 'x-admin-user': JSON.stringify({ name: 'المشرف', role: 'SUPER_ADMIN' }) }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users && data.users.length > 0) {
          setCustomers(data.users);
          setDataMode(data.mode === 'supabase' ? 'supabase' : 'mock');
        } else {
          setCustomers(MOCK_CUSTOMERS);
          setDataMode('mock');
        }
      } else {
        setCustomers(MOCK_CUSTOMERS);
        setDataMode('mock');
      }
    } catch {
      setCustomers(MOCK_CUSTOMERS);
      setDataMode('mock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // Toggle block/unblock via PATCH /api/users/[id]
  const toggleBlock = async (customer: Customer) => {
    setToggling(customer.id);
    try {
      const res = await fetch(`/api/users/${customer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': JSON.stringify({ name: 'المشرف', role: 'SUPER_ADMIN' }),
        },
        body: JSON.stringify({ is_blocked: !customer.is_blocked }),
      });
      if (res.ok) {
        const updated = !customer.is_blocked;
        setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, is_blocked: updated } : c));
        if (selected?.id === customer.id) setSelected(s => s ? { ...s, is_blocked: updated } : s);
      }
    } catch {
      // Optimistic update for mock mode
      const updated = !customer.is_blocked;
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, is_blocked: updated } : c));
      if (selected?.id === customer.id) setSelected(s => s ? { ...s, is_blocked: updated } : s);
    } finally {
      setToggling(null);
    }
  };

  const filtered = customers.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === 'all' || c.vip_tier === filterTier;
    return matchSearch && matchTier;
  });

  const totalRevenue = customers.reduce((s, c) => s + (c.total_spent || 0), 0);
  const vipCount     = customers.filter(c => c.vip_tier !== 'guest').length;
  const blockedCount = customers.filter(c => c.is_blocked).length;

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-gray-900 font-sans pt-12 pb-24 px-6 md:px-10" dir="rtl">

      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C5A059]/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 mb-1">
            <Crown className="text-[#C5A059]" size={32} />
            ملفات <span className="text-[#C5A059] font-light">كبار الشخصيات</span>
          </h1>
          <p className="text-[10px] text-gray-500 tracking-widest uppercase font-mono">
            SHAMIKH VIP CUSTOMER INTELLIGENCE CENTER
            <span className={`mr-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${dataMode === 'supabase' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {dataMode === 'supabase' ? '🟢 Supabase Live' : '🟡 Mock Mode'}
            </span>
          </p>
        </div>
        <button
          onClick={loadCustomers}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-[#C5A059] text-gray-700 text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          تحديث البيانات
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── KPI Stats ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي العملاء',   value: customers.length,                                       icon: Users,      color: 'text-gray-700' },
            { label: 'عملاء VIP',         value: vipCount,                                               icon: Crown,      color: 'text-[#C5A059]' },
            { label: 'إجمالي الإنفاق',   value: `${totalRevenue.toLocaleString()} ر.س`,                icon: DollarSign, color: 'text-green-600' },
            { label: 'حسابات محظورة',    value: blockedCount,                                           icon: Ban,        color: 'text-red-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── VIP Tier Breakdown ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(VIP_CONFIG).map(([slug, cfg]) => {
            const count = customers.filter(c => c.vip_tier === slug).length;
            return (
              <button
                key={slug}
                onClick={() => setFilterTier(filterTier === slug ? 'all' : slug)}
                className={`${cfg.bg} ${cfg.border} border rounded-2xl p-4 text-right transition-all hover:shadow-md ${filterTier === slug ? 'ring-2 ring-[#C5A059]/40 shadow-md' : ''}`}
              >
                <div className="text-2xl mb-2">{cfg.icon}</div>
                <p className={`${cfg.color} font-bold text-xs`}>{cfg.arabicLabel}</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{count}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">خصم {cfg.discount}%</p>
              </button>
            );
          })}
        </div>

        {/* ── Search Bar ───────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="ابحث بالاسم أو رقم الجوال أو البريد الإلكتروني..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-gray-900 text-xs focus:outline-none focus:border-[#C5A059] transition-colors"
            />
          </div>
        </div>

        {/* ── Loading / Error ───────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin mr-3" />
            <span className="text-sm">جاري تحميل بيانات العملاء...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* ── Customers Grid ───────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(customer => {
              const cfg = VIP_CONFIG[customer.vip_tier] || VIP_CONFIG.guest;
              return (
                <motion.div
                  key={customer.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white border rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden cursor-pointer hover:shadow-md transition-all ${
                    customer.is_blocked ? 'border-red-200 opacity-75' : 'border-gray-200 hover:border-[#C5A059]/40'
                  }`}
                  onClick={() => setSelected(customer)}
                >
                  {/* Blocked badge */}
                  {customer.is_blocked && (
                    <div className="absolute top-3 left-3 bg-red-100 text-red-500 border border-red-200 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                      <Ban size={9} /> محظور
                    </div>
                  )}

                  {/* Avatar + Name + VIP badge */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{customer.name}</h3>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{customer.phone}</p>
                    </div>
                    <span className={`${cfg.color} ${cfg.bg} ${cfg.border} border px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 shrink-0`}>
                      <span>{cfg.icon}</span>
                      {cfg.arabicLabel}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                      <p className="text-[9px] text-gray-500 mb-0.5">طلبات</p>
                      <p className="text-sm font-bold text-gray-900">{customer.orders_count}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                      <p className="text-[9px] text-gray-500 mb-0.5">الإنفاق ر.س</p>
                      <p className="text-xs font-bold text-[#C5A059]">{(customer.total_spent || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                      <p className="text-[9px] text-gray-500 mb-0.5">النقاط</p>
                      <p className="text-xs font-bold text-gray-900">{(customer.points || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(customer); }}
                      className="flex-1 py-2 bg-gray-50 border border-gray-200 hover:border-[#C5A059]/40 rounded-xl text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-all flex items-center justify-center gap-1"
                    >
                      <Eye size={11} /> عرض الملف
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleBlock(customer); }}
                      disabled={toggling === customer.id}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                        customer.is_blocked
                          ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                          : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {toggling === customer.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : customer.is_blocked
                          ? <><CheckCircle2 size={11} /> رفع الحظر</>
                          : <><Ban size={11} /> حظر</>
                      }
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-20 text-gray-400">
                <Users className="mx-auto mb-4 opacity-30" size={48} />
                <p className="text-sm">لا يوجد عملاء مطابقون للبحث.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Customer Detail Modal ────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">ملف العميل</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              {(() => {
                const cfg = VIP_CONFIG[selected.vip_tier] || VIP_CONFIG.guest;
                return (
                  <div className="space-y-5">
                    {/* Profile card */}
                    <div className={`rounded-2xl p-5 border text-center ${cfg.bg} ${cfg.border}`}>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-3 border-2 ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        {selected.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{selected.name}</h3>
                      <span className={`${cfg.color} text-xs font-bold flex items-center justify-center gap-1 mt-1`}>
                        <span>{cfg.icon}</span> {cfg.arabicLabel} — خصم {cfg.discount}%
                      </span>
                      {selected.is_blocked && (
                        <span className="mt-2 inline-flex items-center gap-1 bg-red-100 text-red-500 border border-red-200 px-3 py-1 rounded-full text-xs font-bold">
                          <Ban size={11} /> حساب محظور
                        </span>
                      )}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'الهاتف',        value: selected.phone,                              icon: Phone },
                        { label: 'البريد الإلكتروني', value: selected.email || '—',                  icon: Mail },
                        { label: 'إجمالي الإنفاق', value: `${(selected.total_spent || 0).toLocaleString()} ر.س`, icon: DollarSign },
                        { label: 'عدد الطلبات',   value: selected.orders_count || 0,                icon: ShoppingBag },
                        { label: 'النقاط',         value: `${(selected.points || 0).toLocaleString()} نقطة`, icon: Star },
                        { label: 'تاريخ الانضمام', value: selected.created_at ? new Date(selected.created_at).toLocaleDateString('ar-EG') : '—', icon: TrendingUp },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                            <Icon size={11} />
                            <p className="text-[9px] uppercase tracking-wider">{label}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Block/Unblock action */}
                    <button
                      onClick={() => toggleBlock(selected)}
                      disabled={toggling === selected.id}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                        selected.is_blocked
                          ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                          : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {toggling === selected.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : selected.is_blocked
                          ? <><CheckCircle2 size={14} /> رفع الحظر عن العميل</>
                          : <><Ban size={14} /> حظر هذا العميل</>
                      }
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
