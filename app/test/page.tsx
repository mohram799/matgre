'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ─── Icons (inline SVG to avoid bundle bloat) ────────────────────────────────
const Icon = {
  check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M20 6L9 17l-5-5"/></svg>,
  alert: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
  spin: (cls?: string) => <svg className={`animate-spin w-3.5 h-3.5 ${cls ?? ''}`} viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>,
  db: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>,
  lock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  cart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  user: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  star: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#C5A059]"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  globe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  heart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  tag: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  cpu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  refresh: (spin?: boolean) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 ${spin ? 'animate-spin' : ''}`}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  phone: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012.18 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>,
  msg: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  arrow: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  send: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
};

// ─── Types ──────────────────────────────────────────────────────────────────
type Status = 'idle' | 'loading' | 'success' | 'error';
interface Log { ts: string; msg: string; type: 'info' | 'success' | 'error' | 'warn'; }

// ─── Constants ───────────────────────────────────────────────────────────────
const VIP_TIERS = [
  { slug: 'guest', label: 'Guest', icon: '👤', discount: 0, color: '#888' },
  { slug: 'bronze', label: 'البرونزي', icon: '🥉', discount: 5, color: '#CD7F32' },
  { slug: 'silver', label: 'الفضي', icon: '🥈', discount: 12, color: '#C0C0C0' },
  { slug: 'gold', label: 'الذهبي', icon: '👑', discount: 20, color: '#C5A059' },
  { slug: 'diamond', label: 'الماسي', icon: '💎', discount: 30, color: '#a78bfa' },
];

const ADMIN_SECRET = 'shamikh_master_security_2026';
const ADMIN_HEADER = { 'x-admin-secret': ADMIN_SECRET };
const JSON_HEADER = { 'Content-Type': 'application/json' };

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const badge = (s: Status) => {
  if (s === 'loading') return <span className="text-yellow-400 flex items-center gap-1">{Icon.spin()} جاري...</span>;
  if (s === 'success') return <span className="text-green-400 flex items-center gap-1">{Icon.check()} نجح</span>;
  if (s === 'error') return <span className="text-red-400 flex items-center gap-1">{Icon.alert()} فشل</span>;
  return <span className="text-gray-500">—</span>;
};

// ─── Styled helpers ───────────────────────────────────────────────────────────
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#111]/90 border border-white/[0.06] rounded-2xl backdrop-blur-xl p-5 ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <h2 className="flex items-center gap-2 text-[#C5A059] font-bold text-sm mb-4">
    {icon}{children}
  </h2>
);

const Btn = ({
  onClick, disabled, loading, children, variant = 'gold', size = 'md', className = ''
}: {
  onClick?: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; variant?: 'gold' | 'white' | 'ghost' | 'danger';
  size?: 'sm' | 'md'; className?: string;
}) => {
  const base = `inline-flex items-center justify-center gap-1.5 font-bold transition-all duration-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed`;
  const sizes = { sm: 'px-3 py-1.5 text-[10px]', md: 'px-4 py-2 text-xs' };
  const variants = {
    gold: 'bg-[#C5A059] hover:bg-[#b08d4b] text-black',
    white: 'bg-white hover:bg-gray-200 text-black',
    ghost: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading && Icon.spin('mr-0.5')}
      {children}
    </button>
  );
};

const Field = ({ label, value, onChange, placeholder, type = 'text' }: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) => (
  <div className="space-y-1">
    {label && <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-black/60 border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#C5A059]/60 transition-colors"
    />
  </div>
);

const Console = ({ logs, onClear }: { logs: Log[]; onClear?: () => void }) => (
  <div className="relative">
    <div className="flex justify-between items-center mb-2">
      <span className="text-[9px] font-mono uppercase text-gray-600">Live Console</span>
      {onClear && <button onClick={onClear} className="text-[9px] text-gray-600 hover:text-white flex items-center gap-1">{Icon.trash()} مسح</button>}
    </div>
    <div className="bg-black border border-white/5 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[9px] space-y-1.5">
      {logs.length === 0
        ? <div className="text-gray-700 text-center pt-16">لا توجد سجلات بعد...</div>
        : [...logs].reverse().map((l, i) => (
          <div key={i} className={
            l.type === 'success' ? 'text-green-400' :
            l.type === 'error' ? 'text-red-400' :
            l.type === 'warn' ? 'text-yellow-400' : 'text-gray-400'
          }>
            <span className="text-gray-600 mr-1">[{l.ts}]</span>{l.msg}
          </div>
        ))
      }
    </div>
  </div>
);

const ResultBox = ({ data }: { data: any }) => (
  <pre className="bg-black/60 border border-white/5 rounded-xl p-3 text-[9px] font-mono text-green-300 max-h-36 overflow-y-auto whitespace-pre-wrap break-all">
    {JSON.stringify(data, null, 2)}
  </pre>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TestSandbox() {
  // ── Global log stream ──
  const [logs, setLogs] = useState<Log[]>([]);
  const log = useCallback((msg: string, type: Log['type'] = 'info') => {
    setLogs(p => [{ ts: now(), msg, type }, ...p].slice(0, 200));
  }, []);

  // ── DB Health ──
  const [dbStatus, setDbStatus] = useState<Status>('idle');
  const [dbData, setDbData] = useState<any>(null);
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  // ── Auth ──
  const [authEmail, setAuthEmail] = useState('01005209667');
  const [authPassword, setAuthPassword] = useState('Ahmed@01005209667');
  const [authPhone, setAuthPhone] = useState('01005209667');
  const [authName, setAuthName] = useState('العميل الملكي');
  const [loginStatus, setLoginStatus] = useState<Status>('idle');
  const [loginResult, setLoginResult] = useState<any>(null);
  const [registerStatus, setRegisterStatus] = useState<Status>('idle');
  const [registerResult, setRegisterResult] = useState<any>(null);
  const [csrfStatus, setCsrfStatus] = useState<Status>('idle');
  const [csrfToken, setCsrfToken] = useState('');

  // ── Products ──
  const [products, setProducts] = useState<any[]>([]);
  const [productsStatus, setProductsStatus] = useState<Status>('idle');
  const [selectedTier, setSelectedTier] = useState(VIP_TIERS[3]);

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('عود');
  const [searchStatus, setSearchStatus] = useState<Status>('idle');
  const [searchResults, setSearchResults] = useState<any>(null);

  // ── Cart & Checkout ──
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<Status>('idle');
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  // ── Orders ──
  const [ordersStatus, setOrdersStatus] = useState<Status>('idle');
  const [ordersData, setOrdersData] = useState<any>(null);

  // ── Reviews ──
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewName, setReviewName] = useState('العميل الملكي');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('منتج استثنائي بجودة لا تُضاهى، يستحق كل ريال');
  const [reviewStatus, setReviewStatus] = useState<Status>('idle');
  const [reviewResult, setReviewResult] = useState<any>(null);

  // ── Wishlist ──
  const [wishlistProductId, setWishlistProductId] = useState('');
  const [wishlistStatus, setWishlistStatus] = useState<Status>('idle');
  const [wishlistResult, setWishlistResult] = useState<any>(null);

  // ── Coupons ──
  const [couponCode, setCouponCode] = useState('SHAMIKH20');
  const [couponStatus, setCouponStatus] = useState<Status>('idle');
  const [couponResult, setCouponResult] = useState<any>(null);

  // ── Notifications ──
  const [notifPhone, setNotifPhone] = useState('0501234567');
  const [notifMsg, setNotifMsg] = useState('مرحباً بك في عالم الفخامة الحقيقية 👑');
  const [notifStatus, setNotifStatus] = useState<Status>('idle');

  // ── CRM ──
  const [crmPhone, setCrmPhone] = useState('0501234567');
  const [crmStatus, setCrmStatus] = useState<Status>('idle');
  const [crmLogs, setCrmLogs] = useState<string[]>([]);

  // ── Dropshipping ──
  const [aliUrl, setAliUrl] = useState('https://www.aliexpress.com/item/1005001234567.html');
  const [importStatus, setImportStatus] = useState<Status>('idle');
  const [importResult, setImportResult] = useState<any>(null);

  // ── AI Chat ──
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([
    { id: '0', role: 'assistant', text: 'مرحباً يا فندم — أنا المساعد الذكي لـ شامخ. كيف أخدمك اليوم؟' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatStatus, setChatStatus] = useState<Status>('idle');

  // ── Fraud Detection ──
  const [fraudIp, setFraudIp] = useState('185.220.101.1');
  const [fraudStatus, setFraudStatus] = useState<Status>('idle');
  const [fraudResult, setFraudResult] = useState<any>(null);

  // ── Admin Ops ──
  const [adminStatus, setAdminStatus] = useState<Status>('idle');
  const [adminData, setAdminData] = useState<any>(null);
  const [inventoryStatus, setInventoryStatus] = useState<Status>('idle');

  // ── GDPR ──
  const [gdprPhone, setGdprPhone] = useState('0501234567');
  const [gdprStatus, setGdprStatus] = useState<Status>('idle');
  const [gdprResult, setGdprResult] = useState<any>(null);

  // ── Circuit Breakers ──
  const [breakers, setBreakers] = useState<Record<string, { status: 'CLOSED' | 'OPEN'; fallback: boolean }>>({
    StripeBreaker: { status: 'CLOSED', fallback: false },
    AliExpressScraper: { status: 'CLOSED', fallback: false },
    OpenAiBreaker: { status: 'CLOSED', fallback: false },
    RedisCache: { status: 'CLOSED', fallback: false },
  });

  // ── Analytics ──
  const [analyticsStatus, setAnalyticsStatus] = useState<Status>('idle');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // ── Webhook ──
  const [webhookStatus, setWebhookStatus] = useState<Status>('idle');
  const [webhookResult, setWebhookResult] = useState<any>(null);

  // ── Users (admin) ──
  const [usersStatus, setUsersStatus] = useState<Status>('idle');
  const [usersData, setUsersData] = useState<any>(null);

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState<string>('db');

  // ────────────────────────── API FUNCTIONS ────────────────────────────────────

  const testDb = async () => {
    setDbStatus('loading'); log('🔍 فحص اتصال Supabase...', 'info');
    const t = performance.now();
    try {
      const r = await fetch('/api/health/diagnostics');
      const ms = Math.round(performance.now() - t);
      setDbLatency(ms);
      if (r.ok) {
        const d = await r.json();
        setDbData(d); setDbStatus('success');
        log(`✅ قاعدة البيانات متصلة — زمن الاستجابة: ${ms}ms`, 'success');
      } else { setDbStatus('error'); log(`❌ فشل الاتصال بـ Supabase (${r.status})`, 'error'); }
    } catch { setDbStatus('error'); log('❌ خطأ شبكي أثناء فحص قاعدة البيانات', 'error'); }
  };

  const fetchProducts = async () => {
    setProductsStatus('loading'); log('📦 جلب المنتجات من Supabase...', 'info');
    try {
      const r = await fetch('/api/products?limit=6&status=active');
      if (r.ok) {
        const d = await r.json();
        const prods = d.products || d.data || [];
        setProducts(prods);
        if (prods.length > 0) {
          setSelectedProduct(prods[0]);
          setReviewProductId(prods[0].id || prods[0].slug || '');
          setWishlistProductId(prods[0].id || '');
        }
        setProductsStatus('success');
        log(`✅ تم جلب ${prods.length} منتج من الكتالوج الحي`, 'success');
      } else { setProductsStatus('error'); log(`❌ فشل جلب المنتجات (${r.status})`, 'error'); }
    } catch { setProductsStatus('error'); log('❌ خطأ في API المنتجات', 'error'); }
  };

  const getCsrf = async () => {
    setCsrfStatus('loading'); log('🔑 طلب CSRF Token...', 'info');
    try {
      const r = await fetch('/api/auth/csrf');
      if (r.ok) {
        const d = await r.json();
        setCsrfToken(d.token || d.csrfToken || 'mock-csrf-token');
        setCsrfStatus('success');
        log('✅ تم الحصول على CSRF Token بنجاح', 'success');
      } else { setCsrfStatus('error'); log(`❌ فشل الحصول على CSRF (${r.status})`, 'error'); }
    } catch { setCsrfStatus('error'); log('❌ خطأ في CSRF endpoint', 'error'); }
  };

  const testLogin = async () => {
    setLoginStatus('loading'); log(`🔐 محاولة تسجيل الدخول بـ: ${authEmail}`, 'info');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const d = await r.json();
      setLoginResult(d);
      if (r.ok) {
        setLoginStatus('success');
        log(`✅ تسجيل دخول ناجح! ${d.user?.email || d.message || ''}`, 'success');
      } else {
        setLoginStatus('error');
        log(`❌ فشل تسجيل الدخول: ${d.error || d.message}`, 'error');
      }
    } catch { setLoginStatus('error'); log('❌ خطأ في Auth Login endpoint', 'error'); }
  };

  const testRegister = async () => {
    setRegisterStatus('loading'); log(`📝 تسجيل مستخدم جديد: ${authEmail}`, 'info');
    try {
      const r = await fetch('/api/users', {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone,
          vip_tier: 'guest'
        })
      });
      const d = await r.json();
      setRegisterResult(d);
      if (r.ok) {
        setRegisterStatus('success');
        log(`✅ تم إنشاء الحساب بنجاح! ID: ${d.id || d.user?.id || '—'}`, 'success');
      } else {
        setRegisterStatus('error');
        log(`❌ فشل التسجيل: ${d.error || d.message}`, 'error');
      }
    } catch { setRegisterStatus('error'); log('❌ خطأ في Register endpoint', 'error'); }
  };

  const testSearch = async () => {
    setSearchStatus('loading'); log(`🔍 البحث عن: "${searchQuery}"`, 'info');
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      if (r.ok) {
        const d = await r.json();
        setSearchResults(d);
        setSearchStatus('success');
        log(`✅ البحث أعاد ${d.results?.length || d.hits?.length || 0} نتيجة`, 'success');
      } else { setSearchStatus('error'); log(`❌ فشل البحث (${r.status})`, 'error'); }
    } catch { setSearchStatus('error'); log('❌ خطأ في Search API', 'error'); }
  };

  const testCheckout = async () => {
    if (!selectedProduct) { log('⚠️ اختر منتجاً أولاً من قائمة المنتجات', 'warn'); return; }
    setCheckoutStatus('loading');
    const disc = selectedTier.discount / 100;
    const price = Math.floor((selectedProduct.price || 1200) * (1 - disc));
    log(`💳 بدء Checkout للمنتج: ${selectedProduct.title_ar || selectedProduct.name || selectedProduct.title}`, 'info');
    try {
      // Step 1: Payment Intent
      const intentR = await fetch('/api/checkout/intent', {
        method: 'POST', headers: JSON_HEADER,
        body: JSON.stringify({ amount: price, currency: 'sar' })
      });
      const intentD = await intentR.json();
      if (intentR.ok) log(`✅ Stripe PaymentIntent جاهز: ${intentD.intentId || intentD.clientSecret?.slice(0, 20)}...`, 'success');
      else log(`⚠️ Stripe غير متوفر — محاكاة آمنة نشطة`, 'warn');

      // Step 2: Create Order
      const orderId = `SHM-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderR = await fetch('/api/orders', {
        method: 'POST', headers: JSON_HEADER,
        body: JSON.stringify({
          customer_name: authName, customer_phone: authPhone, customer_email: authEmail,
          shipping_address: 'برج الشامخ، الطابق 100، العليا، الرياض',
          shipping_city: 'الرياض', total_amount: price,
          discount_amount: (selectedProduct.price || 1200) - price,
          payment_method: 'Credit Card', payment_status: 'paid', status: 'processing',
          stripe_payment_intent: intentD.clientSecret || `pi_mock_${orderId}`,
          items: [{ product_id: selectedProduct.id, title: selectedProduct.title_ar || selectedProduct.title, price, quantity: 1, image: selectedProduct.images?.[0] }],
          vip_tier: selectedTier.slug
        })
      });
      const orderD = await orderR.json();
      setCheckoutResult({ orderId, intent: intentD, order: orderD });
      if (orderR.ok) {
        setCheckoutStatus('success');
        log(`🎉 تم إنشاء الطلب بنجاح! رقم الطلب: ${orderId}`, 'success');
      } else {
        setCheckoutStatus('error');
        log(`❌ فشل إنشاء الطلب: ${orderD.error || orderD.message}`, 'error');
      }
    } catch { setCheckoutStatus('error'); log('❌ خطأ أثناء عملية Checkout', 'error'); }
  };

  const testGetOrders = async () => {
    setOrdersStatus('loading'); log('📋 جلب قائمة الطلبات...', 'info');
    try {
      const r = await fetch('/api/orders', { headers: { ...ADMIN_HEADER } });
      if (r.ok) {
        const d = await r.json();
        setOrdersData(d); setOrdersStatus('success');
        log(`✅ تم جلب ${d.orders?.length || d.data?.length || 0} طلب`, 'success');
      } else { setOrdersStatus('error'); log(`❌ فشل جلب الطلبات (${r.status})`, 'error'); }
    } catch { setOrdersStatus('error'); log('❌ خطأ في Orders API', 'error'); }
  };

  const testReview = async () => {
    setReviewStatus('loading');
    const pid = reviewProductId || (products[0]?.id || 'mock-product-1');
    log(`⭐ إرسال مراجعة للمنتج: ${pid}`, 'info');
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST', headers: JSON_HEADER,
        body: JSON.stringify({ product_id: pid, reviewer_name: reviewName, rating: reviewRating, body: reviewBody, verified: false })
      });
      const d = await r.json();
      setReviewResult(d);
      if (r.ok) {
        setReviewStatus('success');
        log(`✅ تم إرسال المراجعة بنجاح! ID: ${d.id || d.review?.id || '—'}`, 'success');
      } else {
        setReviewStatus('error');
        log(`❌ فشل إرسال المراجعة: ${d.error || d.message}`, 'error');
      }
    } catch { setReviewStatus('error'); log('❌ خطأ في Reviews API', 'error'); }
  };

  const testWishlist = async () => {
    setWishlistStatus('loading');
    const pid = wishlistProductId || (products[0]?.id || 'mock-product-1');
    log(`❤️ إضافة منتج للقائمة المفضلة: ${pid}`, 'info');
    try {
      const r = await fetch('/api/wishlist', {
        method: 'POST', headers: JSON_HEADER,
        body: JSON.stringify({ product_id: pid, user_id: 'test-user-diagnostics' })
      });
      const d = await r.json();
      setWishlistResult(d);
      if (r.ok) {
        setWishlistStatus('success');
        log('✅ تم الإضافة إلى القائمة المفضلة', 'success');
      } else {
        setWishlistStatus('error');
        log(`❌ فشل: ${d.error || d.message}`, 'error');
      }
    } catch { setWishlistStatus('error'); log('❌ خطأ في Wishlist API', 'error'); }
  };

  const testCoupon = async () => {
    setCouponStatus('loading'); log(`🏷️ التحقق من كوبون: ${couponCode}`, 'info');
    try {
      const r = await fetch('/api/coupons/validate', {
        method: 'POST', headers: JSON_HEADER,
        body: JSON.stringify({ code: couponCode, order_total: 5000 })
      });
      const d = await r.json();
      setCouponResult(d);
      if (r.ok) {
        setCouponStatus('success');
        log(`✅ الكوبون صحيح! الخصم: ${d.discount_amount || d.discount || '—'} ر.س`, 'success');
      } else {
        setCouponStatus('error');
        log(`❌ كوبون غير صالح: ${d.error || d.message}`, 'error');
      }
    } catch { setCouponStatus('error'); log('❌ خطأ في Coupons API', 'error'); }
  };

  const testNotification = async () => {
    setNotifStatus('loading'); log(`🔔 إرسال إشعار لـ: ${notifPhone}`, 'info');
    try {
      const r = await fetch('/api/notifications', {
        method: 'POST', headers: { ...JSON_HEADER, ...ADMIN_HEADER },
        body: JSON.stringify({ phone: notifPhone, message: notifMsg, type: 'whatsapp' })
      });
      if (r.ok) {
        setNotifStatus('success'); log('✅ تم إرسال الإشعار بنجاح', 'success');
      } else {
        const d = await r.json();
        setNotifStatus('error'); log(`❌ فشل إرسال الإشعار: ${d.error || d.message}`, 'error');
      }
    } catch { setNotifStatus('error'); log('❌ خطأ في Notifications API', 'error'); }
  };

  const testCrm = async () => {
    setCrmStatus('loading'); setCrmLogs([]);
    log(`📲 تشغيل CRM استعادة السلة للهاتف: ${crmPhone}`, 'info');
    try {
      const r = await fetch('/api/crm/abandoned-cart', {
        method: 'POST', headers: { ...JSON_HEADER, ...ADMIN_HEADER },
        body: JSON.stringify({ phone: crmPhone })
      });
      if (r.ok) {
        setCrmStatus('success');
        setCrmLogs(['✅ Touch 1: رسالة التذكير الفخمة أُرسلت', '✅ Touch 2: كوبون خصم VIP_GIFT_10 تم إنشاؤه', '✅ Touch 3: رسالة FOMO مُجدولة خلال 24 ساعة', '🎉 دورة CRM مكتملة']);
        log(`✅ CRM استعادة السلة فُعّل للهاتف ${crmPhone}`, 'success');
      } else {
        setCrmStatus('error'); log('❌ فشل CRM endpoint', 'error');
      }
    } catch { setCrmStatus('error'); log('❌ خطأ في CRM API', 'error'); }
  };

  const testImport = async () => {
    setImportStatus('loading'); setImportResult(null); log(`🌐 استيراد منتج AliExpress...`, 'info');
    try {
      const r = await fetch('/api/dropshipping/import', {
        method: 'POST', headers: JSON_HEADER,
        body: JSON.stringify({ url: aliUrl, luxuryFee: 450, marginPercent: 120 })
      });
      const d = await r.json();
      setImportResult(d);
      if (r.ok) {
        setImportStatus('success');
        log(`✅ تم استيراد: ${d.product?.title_ar || d.title || 'المنتج'}`, 'success');
      } else {
        setImportStatus('error'); log(`❌ فشل الاستيراد: ${d.error || d.message}`, 'error');
      }
    } catch { setImportStatus('error'); log('❌ خطأ في Dropshipping API', 'error'); }
  };

  const testAiChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(p => [...p, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    setChatStatus('loading'); log(`🤖 استدعاء AI Chat: "${userMsg.slice(0, 30)}..."`, 'info');
    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST', headers: JSON_HEADER,
        body: JSON.stringify({ message: userMsg, history: chatMessages.slice(-4) })
      });
      if (r.ok) {
        const d = await r.json();
        setChatMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', text: d.reply || d.message || d.text || 'حسناً يا فندم، دعني أساعدك بذلك...' }]);
        setChatStatus('success'); log('✅ AI رد بنجاح', 'success');
      } else {
        setChatMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', text: 'عذراً، الذكاء الاصطناعي في وضع صيانة مؤقتة. فريقنا سيتواصل معك.' }]);
        setChatStatus('error'); log('❌ AI Chat غير متاح حالياً', 'error');
      }
    } catch {
      setChatMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', text: 'مشكلة في الاتصال، يرجى المحاولة مجدداً.' }]);
      setChatStatus('error'); log('❌ خطأ في AI Chat API', 'error');
    }
  };

  const testFraud = async () => {
    setFraudStatus('loading'); log(`🛡️ فحص IP مشبوه: ${fraudIp}`, 'info');
    try {
      const r = await fetch('/api/fraud', {
        method: 'POST', headers: JSON_HEADER,
        body: JSON.stringify({ ip: fraudIp, user_agent: 'Mozilla/5.0 TestBot', order_amount: 99999 })
      });
      const d = await r.json();
      setFraudResult(d);
      if (r.ok) {
        setFraudStatus('success');
        log(`✅ تحليل Fraud مكتمل — النتيجة: ${d.risk_level || d.verdict || 'منخفض'}`, 'success');
      } else {
        setFraudStatus('error'); log(`❌ فشل فحص الاحتيال (${r.status})`, 'error');
      }
    } catch { setFraudStatus('error'); log('❌ خطأ في Fraud Detection API', 'error'); }
  };

  const testAdminOps = async () => {
    setAdminStatus('loading'); log('⚙️ جلب حالة النظام من لوحة الأدمن...', 'info');
    try {
      const r = await fetch('/api/admin/ops/status', { headers: ADMIN_HEADER });
      if (r.ok) {
        const d = await r.json();
        setAdminData(d); setAdminStatus('success');
        if (d.circuitBreakers) {
          const mapped: any = {};
          Object.entries(d.circuitBreakers).forEach(([k, v]: any) => {
            mapped[k] = { status: v.status || 'CLOSED', fallback: v.fallbackActive || false };
          });
          setBreakers(mapped);
        }
        log('✅ بيانات لوحة الأدمن جاهزة', 'success');
      } else { setAdminStatus('error'); log(`❌ فشل الوصول للأدمن (${r.status})`, 'error'); }
    } catch { setAdminStatus('error'); log('❌ خطأ في Admin Ops API', 'error'); }
  };

  const testInventoryAlerts = async () => {
    setInventoryStatus('loading'); log('📊 فحص تنبيهات المخزون...', 'info');
    try {
      const r = await fetch('/api/admin/inventory-alerts', { headers: ADMIN_HEADER });
      if (r.ok) {
        const d = await r.json();
        setInventoryStatus('success');
        log(`✅ تنبيهات المخزون: ${d.alerts?.length || 0} تنبيه نشط`, 'success');
      } else { setInventoryStatus('error'); log(`❌ فشل (${r.status})`, 'error'); }
    } catch { setInventoryStatus('error'); log('❌ خطأ في Inventory Alerts API', 'error'); }
  };

  const testGdpr = async () => {
    setGdprStatus('loading'); setGdprResult(null); log(`🔒 تصدير بيانات GDPR للهاتف: ${gdprPhone}`, 'info');
    try {
      const r = await fetch(`/api/admin/compliance?phone=${gdprPhone}`, { headers: ADMIN_HEADER });
      if (r.ok) {
        const d = await r.json();
        setGdprResult(d); setGdprStatus('success');
        log('✅ تم تصدير البيانات بنجاح', 'success');
      } else { setGdprStatus('error'); log(`❌ فشل GDPR (${r.status})`, 'error'); }
    } catch { setGdprStatus('error'); log('❌ خطأ في Compliance API', 'error'); }
  };

  const testAnalytics = async () => {
    setAnalyticsStatus('loading'); log('📈 جلب بيانات Analytics...', 'info');
    try {
      const r = await fetch('/api/analytics', { headers: ADMIN_HEADER });
      if (r.ok) {
        const d = await r.json();
        setAnalyticsData(d); setAnalyticsStatus('success');
        log('✅ بيانات Analytics وصلت بنجاح', 'success');
      } else { setAnalyticsStatus('error'); log(`❌ فشل (${r.status})`, 'error'); }
    } catch { setAnalyticsStatus('error'); log('❌ خطأ في Analytics API', 'error'); }
  };

  const testWebhook = async () => {
    setWebhookStatus('loading'); log('🔗 اختبار Webhook endpoint...', 'info');
    try {
      const r = await fetch('/api/webhooks/stripe', {
        method: 'POST', headers: { ...JSON_HEADER, 'stripe-signature': 'mock_sig_test' },
        body: JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_test_123', amount: 5000 } } })
      });
      const d = await r.json();
      setWebhookResult(d);
      if (r.ok || r.status === 400) {
        setWebhookStatus('success'); log(`✅ Webhook endpoint يستجيب (${r.status})`, 'success');
      } else { setWebhookStatus('error'); log(`❌ فشل Webhook (${r.status})`, 'error'); }
    } catch { setWebhookStatus('error'); log('❌ خطأ في Webhook endpoint', 'error'); }
  };

  const testGetUsers = async () => {
    setUsersStatus('loading'); log('👥 جلب قائمة المستخدمين...', 'info');
    try {
      const r = await fetch('/api/users', { headers: ADMIN_HEADER });
      if (r.ok) {
        const d = await r.json();
        setUsersData(d); setUsersStatus('success');
        log(`✅ تم جلب ${d.users?.length || d.data?.length || 0} مستخدم`, 'success');
      } else { setUsersStatus('error'); log(`❌ فشل (${r.status})`, 'error'); }
    } catch { setUsersStatus('error'); log('❌ خطأ في Users API', 'error'); }
  };

  const toggleBreaker = (name: string) => {
    setBreakers(p => {
      const cur = p[name];
      const next = cur.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
      log(`🔌 قاطع [${name}] تغيّر من ${cur.status} ← ${next}`, next === 'OPEN' ? 'warn' : 'success');
      return { ...p, [name]: { status: next, fallback: next === 'OPEN' } };
    });
  };

  const runAllTests = async () => {
    log('🚀 بدء جميع الاختبارات تلقائياً...', 'info');
    await testDb();
    await fetchProducts();
    await getCsrf();
    await testSearch();
    await testGetOrders();
    await testAdminOps();
    log('✅ اكتملت دورة الاختبارات الشاملة!', 'success');
  };

  useEffect(() => {
    testDb();
    fetchProducts();
  }, []);

  // ─── TAB CONFIG ───────────────────────────────────────────────────────────
  const TABS = [
    { id: 'db', label: 'قاعدة البيانات', icon: Icon.db() },
    { id: 'auth', label: 'المصادقة', icon: Icon.lock() },
    { id: 'products', label: 'المنتجات', icon: Icon.cart() },
    { id: 'checkout', label: 'الدفع والطلبات', icon: Icon.zap() },
    { id: 'search', label: 'البحث', icon: Icon.search() },
    { id: 'reviews', label: 'المراجعات', icon: Icon.star() },
    { id: 'wishlist', label: 'المفضلة', icon: Icon.heart() },
    { id: 'coupons', label: 'الكوبونات', icon: Icon.tag() },
    { id: 'notif', label: 'الإشعارات', icon: Icon.bell() },
    { id: 'crm', label: 'CRM', icon: Icon.phone() },
    { id: 'dropship', label: 'Dropship', icon: Icon.globe() },
    { id: 'ai', label: 'الذكاء الاصطناعي', icon: Icon.cpu() },
    { id: 'fraud', label: 'كشف الاحتيال', icon: Icon.shield() },
    { id: 'admin', label: 'لوحة الأدمن', icon: Icon.activity() },
    { id: 'analytics', label: 'Analytics', icon: Icon.activity() },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 pt-10 px-4 md:px-8" dir="rtl">
      {/* Ambient */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#C5A059]/[0.04] rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-purple-900/[0.04] rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/[0.05] pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
              <h1 className="text-2xl font-bold tracking-wide">
                <span className="text-white">لوحة </span>
                <span className="text-[#C5A059] font-light">الاختبار الشامل</span>
              </h1>
            </div>
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">SHAMIKH LUXURY OS — FULL SYSTEM E2E DIAGNOSTICS SANDBOX</p>
          </div>

          <div className="flex items-center gap-3">
            <Btn onClick={runAllTests} variant="gold">
              {Icon.refresh()} تشغيل كل الاختبارات
            </Btn>
            <Link href="/" className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1.5 transition-colors border border-white/5 px-3 py-2 rounded-xl hover:border-white/20">
              {Icon.arrow()} الرئيسية
            </Link>
          </div>
        </div>

        {/* ── Status Bar ── */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'DB', status: dbStatus, extra: dbLatency ? `${dbLatency}ms` : undefined },
            { label: 'Auth', status: loginStatus },
            { label: 'Products', status: productsStatus },
            { label: 'Checkout', status: checkoutStatus },
            { label: 'Search', status: searchStatus },
            { label: 'Admin', status: adminStatus },
          ].map(({ label, status, extra }) => (
            <div key={label} className="bg-[#111]/80 border border-white/[0.06] rounded-xl px-3 py-2.5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-500">{label}</span>
              <div className="flex items-center gap-1 text-[10px]">{badge(status)}{extra && <span className="text-gray-600 font-mono">{extra}</span>}</div>
            </div>
          ))}
        </div>

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left: Tabs + Content ── */}
          <div className="lg:col-span-9 space-y-6">

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#C5A059] text-black shadow-[0_0_15px_rgba(197,160,89,0.3)]'
                      : 'bg-[#111] border border-white/[0.06] text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >

                {/* ───────────── DATABASE ───────────── */}
                {activeTab === 'db' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.db()}>فحص اتصال Supabase</SectionTitle>
                      <div className="space-y-3 mb-4">
                        <div className="bg-black/50 rounded-xl p-3 space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-gray-500">حالة قاعدة البيانات</span>{badge(dbStatus)}</div>
                          <div className="flex justify-between"><span className="text-gray-500">زمن الاستجابة</span><span className="font-mono text-[#C5A059]">{dbLatency ? `${dbLatency}ms` : '—'}</span></div>
                          {dbData?.database?.version && <div className="flex justify-between"><span className="text-gray-500">الإصدار</span><span className="font-mono text-xs">{dbData.database.version}</span></div>}
                        </div>
                      </div>
                      <Btn onClick={testDb} loading={dbStatus === 'loading'} variant="white" className="w-full">
                        {Icon.refresh(dbStatus === 'loading')} فحص الاتصال
                      </Btn>
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.activity()}>نتيجة التشخيص</SectionTitle>
                      {dbData ? <ResultBox data={dbData} /> : <div className="text-xs text-gray-600 text-center py-16">قم بالضغط على فحص الاتصال أولاً</div>}
                    </Card>
                  </div>
                )}

                {/* ───────────── AUTH ───────────── */}
                {activeTab === 'auth' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.lock()}>بيانات الاختبار المشتركة</SectionTitle>
                      <div className="space-y-3 mb-4">
                        <Field label="البريد الإلكتروني" value={authEmail} onChange={setAuthEmail} placeholder="email@shamikh.com" />
                        <Field label="كلمة المرور" value={authPassword} onChange={setAuthPassword} type="password" />
                        <Field label="الاسم الكامل" value={authName} onChange={setAuthName} />
                        <Field label="رقم الهاتف" value={authPhone} onChange={setAuthPhone} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Btn onClick={getCsrf} loading={csrfStatus === 'loading'} variant="ghost" className="w-full">CSRF Token</Btn>
                        <Btn onClick={testLogin} loading={loginStatus === 'loading'} variant="white" className="w-full">تسجيل دخول</Btn>
                        <Btn onClick={testRegister} loading={registerStatus === 'loading'} variant="gold" className="w-full">تسجيل جديد</Btn>
                      </div>
                      {csrfToken && (
                        <div className="mt-3 bg-black/50 rounded-xl p-2 text-[9px] font-mono text-green-400 break-all">
                          CSRF: {csrfToken}
                        </div>
                      )}
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.user()}>نتائج المصادقة</SectionTitle>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">تسجيل الدخول {badge(loginStatus)}</p>
                          {loginResult && <ResultBox data={loginResult} />}
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">التسجيل الجديد {badge(registerStatus)}</p>
                          {registerResult && <ResultBox data={registerResult} />}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* ───────────── PRODUCTS ───────────── */}
                {activeTab === 'products' && (
                  <div className="space-y-6">
                    {/* VIP Selector */}
                    <Card>
                      <SectionTitle icon={Icon.user()}>محاكي درجة العضوية (VIP Tier)</SectionTitle>
                      <div className="grid grid-cols-5 gap-2">
                        {VIP_TIERS.map(tier => (
                          <button
                            key={tier.slug}
                            onClick={() => { setSelectedTier(tier); log(`👑 تغيير العضوية إلى: ${tier.label} (خصم ${tier.discount}%)`, 'info'); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border transition-all ${
                              selectedTier.slug === tier.slug ? 'border-[#C5A059] bg-[#C5A059]/10' : 'border-white/5 bg-black/40 hover:border-white/20'
                            }`}
                          >
                            <span className="text-xl">{tier.icon}</span>
                            <span className="text-[9px] font-bold">{tier.label}</span>
                            <span className="text-[9px] text-[#C5A059]">-{tier.discount}%</span>
                          </button>
                        ))}
                      </div>
                    </Card>

                    {/* Products Grid */}
                    <Card>
                      <div className="flex justify-between items-center mb-4">
                        <SectionTitle icon={Icon.cart()}>كتالوج المنتجات الحي</SectionTitle>
                        <Btn onClick={fetchProducts} loading={productsStatus === 'loading'} variant="ghost" size="sm">{Icon.refresh(productsStatus === 'loading')} تحديث</Btn>
                      </div>
                      {productsStatus === 'loading' ? (
                        <div className="text-center py-16 text-gray-500 text-xs">جاري جلب المنتجات من Supabase...</div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-16 text-gray-600 text-xs">لا توجد منتجات — تأكد من اتصال قاعدة البيانات</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {products.map((p: any) => {
                            const price = Math.floor((p.price || 1200) * (1 - selectedTier.discount / 100));
                            const isSelected = selectedProduct?.id === p.id;
                            return (
                              <div
                                key={p.id}
                                onClick={() => { setSelectedProduct(p); setReviewProductId(p.id); setWishlistProductId(p.id); log(`📌 اخترت: ${p.title_ar || p.title}`, 'info'); }}
                                className={`bg-black/50 rounded-xl overflow-hidden border cursor-pointer transition-all ${isSelected ? 'border-[#C5A059] shadow-[0_0_12px_rgba(197,160,89,0.15)]' : 'border-white/5 hover:border-white/20'}`}
                              >
                                <div className="h-28 bg-neutral-900 overflow-hidden">
                                  <img
                                    src={p.images?.[0] || `https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&q=60`}
                                    alt={p.title_ar || p.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="p-3 space-y-1">
                                  <p className="text-[10px] font-bold line-clamp-1">{p.title_ar || p.title || 'منتج'}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-[#C5A059]">{price.toLocaleString()} ر.س</span>
                                    {selectedTier.discount > 0 && <span className="text-[8px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">-{selectedTier.discount}%</span>}
                                  </div>
                                  {isSelected && <span className="text-[8px] text-[#C5A059] font-bold">✓ محدد للاختبار</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* ───────────── CHECKOUT ───────────── */}
                {activeTab === 'checkout' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.zap()}>اختبار Checkout المتكامل (Stripe + DB)</SectionTitle>
                      <div className="bg-black/50 rounded-xl p-4 mb-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">المنتج المحدد</span>
                          <span className="font-bold text-[10px] max-w-[160px] truncate">
                            {selectedProduct ? (selectedProduct.title_ar || selectedProduct.title || 'منتج') : 'لم يُحدد — اذهب لتبويب المنتجات'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">درجة العضوية</span>
                          <span>{selectedTier.icon} {selectedTier.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">الخصم</span>
                          <span className="text-[#C5A059] font-bold">{selectedTier.discount}%</span>
                        </div>
                        {selectedProduct && (
                          <div className="flex justify-between border-t border-white/5 pt-2">
                            <span className="text-gray-500">السعر النهائي</span>
                            <span className="font-black text-[#C5A059]">
                              {Math.floor((selectedProduct.price || 1200) * (1 - selectedTier.discount / 100)).toLocaleString()} ر.س
                            </span>
                          </div>
                        )}
                      </div>
                      <Btn onClick={testCheckout} loading={checkoutStatus === 'loading'} variant="gold" className="w-full mb-3">
                        {Icon.zap()} تشغيل Checkout الكامل (Stripe + Supabase)
                      </Btn>
                      <Btn onClick={testGetOrders} loading={ordersStatus === 'loading'} variant="ghost" className="w-full">
                        {Icon.refresh(ordersStatus === 'loading')} جلب قائمة الطلبات
                      </Btn>
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.activity()}>نتائج الطلبات</SectionTitle>
                      <div className="space-y-3">
                        {checkoutResult && (
                          <div>
                            <p className="text-[9px] text-gray-500 font-bold mb-1 flex items-center gap-1">Checkout {badge(checkoutStatus)}</p>
                            <ResultBox data={checkoutResult} />
                          </div>
                        )}
                        {ordersData && (
                          <div>
                            <p className="text-[9px] text-gray-500 font-bold mb-1 flex items-center gap-1">الطلبات {badge(ordersStatus)}</p>
                            <ResultBox data={{ count: ordersData.orders?.length || 0, sample: ordersData.orders?.[0] }} />
                          </div>
                        )}
                        {!checkoutResult && !ordersData && (
                          <div className="text-xs text-gray-600 text-center py-16">اضغط أحد الأزرار لبدء الاختبار</div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {/* ───────────── SEARCH ───────────── */}
                {activeTab === 'search' && (
                  <Card>
                    <SectionTitle icon={Icon.search()}>محرك البحث (Full-text + Supabase)</SectionTitle>
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1">
                        <Field value={searchQuery} onChange={setSearchQuery} placeholder="اكتب كلمة للبحث... (مثال: عود، ساعة، عطر)" />
                      </div>
                      <Btn onClick={testSearch} loading={searchStatus === 'loading'} variant="gold">
                        {Icon.search()} بحث
                      </Btn>
                    </div>
                    {searchResults && (
                      <div>
                        <p className="text-[9px] text-gray-500 font-bold mb-2">النتائج {badge(searchStatus)}</p>
                        <ResultBox data={searchResults} />
                      </div>
                    )}
                    {!searchResults && searchStatus === 'idle' && (
                      <div className="text-xs text-gray-600 text-center py-10">اكتب كلمة واضغط بحث</div>
                    )}
                  </Card>
                )}

                {/* ───────────── REVIEWS ───────────── */}
                {activeTab === 'reviews' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.star()}>إضافة مراجعة للمنتج</SectionTitle>
                      <div className="space-y-3 mb-4">
                        <Field label="معرف المنتج (product_id)" value={reviewProductId} onChange={setReviewProductId} placeholder="product UUID أو اختر من تبويب المنتجات" />
                        <Field label="اسم المراجع" value={reviewName} onChange={setReviewName} />
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">التقييم</label>
                          <div className="flex gap-2">
                            {[1,2,3,4,5].map(n => (
                              <button key={n} onClick={() => setReviewRating(n)} className={`text-lg transition-all ${n <= reviewRating ? 'text-[#C5A059]' : 'text-gray-700'}`}>★</button>
                            ))}
                            <span className="text-xs text-gray-500 self-center">{reviewRating}/5</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">نص المراجعة</label>
                          <textarea
                            value={reviewBody}
                            onChange={e => setReviewBody(e.target.value)}
                            rows={3}
                            className="w-full bg-black/60 border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#C5A059]/60 resize-none"
                          />
                        </div>
                      </div>
                      <Btn onClick={testReview} loading={reviewStatus === 'loading'} variant="gold" className="w-full">
                        {Icon.send()} إرسال المراجعة
                      </Btn>
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.star()}>نتيجة المراجعة</SectionTitle>
                      {reviewResult ? <ResultBox data={reviewResult} /> : <div className="text-xs text-gray-600 text-center py-20">اضغط إرسال لاختبار Reviews API</div>}
                    </Card>
                  </div>
                )}

                {/* ───────────── WISHLIST ───────────── */}
                {activeTab === 'wishlist' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.heart()}>إضافة منتج للمفضلة</SectionTitle>
                      <div className="space-y-3 mb-4">
                        <Field label="معرف المنتج" value={wishlistProductId} onChange={setWishlistProductId} placeholder="product_id (UUID)" />
                        <div className="bg-black/40 rounded-xl p-3 text-[10px] text-gray-500">
                          💡 اذهب لتبويب المنتجات واختر منتجاً لتعبئة الحقل تلقائياً
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Btn onClick={testWishlist} loading={wishlistStatus === 'loading'} variant="gold" className="w-full">
                          {Icon.heart()} إضافة للمفضلة
                        </Btn>
                        <Btn onClick={async () => {
                          setWishlistStatus('loading'); log('❤️ جلب قائمة المفضلة...', 'info');
                          try {
                            const r = await fetch('/api/wishlist?user_id=test-user-diagnostics');
                            const d = await r.json();
                            setWishlistResult(d);
                            setWishlistStatus('success');
                            log(`✅ جلب ${d.items?.length || 0} عنصر من المفضلة`, 'success');
                          } catch { setWishlistStatus('error'); log('❌ خطأ في Wishlist GET', 'error'); }
                        }} loading={wishlistStatus === 'loading'} variant="ghost" className="w-full">
                          جلب قائمة المفضلة
                        </Btn>
                      </div>
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.heart()}>نتيجة المفضلة</SectionTitle>
                      {wishlistResult ? <ResultBox data={wishlistResult} /> : <div className="text-xs text-gray-600 text-center py-20">انتظر نتيجة العملية</div>}
                    </Card>
                  </div>
                )}

                {/* ───────────── COUPONS ───────────── */}
                {activeTab === 'coupons' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.tag()}>التحقق من صحة الكوبون</SectionTitle>
                      <div className="space-y-3 mb-4">
                        <Field label="كود الكوبون" value={couponCode} onChange={setCouponCode} placeholder="مثال: SHAMIKH20" />
                        <div className="grid grid-cols-3 gap-2">
                          {['SHAMIKH20', 'VIP10', 'LUXURY30'].map(c => (
                            <button key={c} onClick={() => setCouponCode(c)} className="bg-black/50 border border-white/5 rounded-lg py-1.5 text-[10px] hover:border-[#C5A059]/30 transition-all">{c}</button>
                          ))}
                        </div>
                      </div>
                      <Btn onClick={testCoupon} loading={couponStatus === 'loading'} variant="gold" className="w-full">
                        {Icon.tag()} التحقق من الكوبون
                      </Btn>
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.tag()}>نتيجة التحقق</SectionTitle>
                      {couponResult ? (
                        <div>
                          <div className={`text-xs font-bold mb-3 flex items-center gap-1 ${couponStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {couponStatus === 'success' ? '✅ الكوبون صحيح وفعّال' : '❌ الكوبون غير صالح'}
                          </div>
                          <ResultBox data={couponResult} />
                        </div>
                      ) : <div className="text-xs text-gray-600 text-center py-20">أدخل كوداً واضغط التحقق</div>}
                    </Card>
                  </div>
                )}

                {/* ───────────── NOTIFICATIONS ───────────── */}
                {activeTab === 'notif' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.bell()}>إرسال إشعار (WhatsApp/SMS)</SectionTitle>
                      <div className="space-y-3 mb-4">
                        <Field label="رقم الهاتف" value={notifPhone} onChange={setNotifPhone} placeholder="05XXXXXXXX" />
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">نص الرسالة</label>
                          <textarea
                            value={notifMsg}
                            onChange={e => setNotifMsg(e.target.value)}
                            rows={3}
                            className="w-full bg-black/60 border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#C5A059]/60 resize-none"
                          />
                        </div>
                      </div>
                      <Btn onClick={testNotification} loading={notifStatus === 'loading'} variant="gold" className="w-full">
                        {Icon.bell()} إرسال الإشعار
                      </Btn>
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.bell()}>CRM استعادة السلة المتروكة</SectionTitle>
                      <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">يُطلق ثلاث رسائل مخصصة: تذكير فخم + كوبون + رسالة ندرة.</p>
                      <Field label="هاتف العميل" value={crmPhone} onChange={setCrmPhone} />
                      <div className="mt-3 mb-4">
                        <Btn onClick={testCrm} loading={crmStatus === 'loading'} variant="gold" className="w-full">
                          {Icon.phone()} إطلاق CRM Abandoned Cart
                        </Btn>
                      </div>
                      {crmLogs.length > 0 && (
                        <div className="bg-black/50 border border-white/5 rounded-xl p-3 space-y-1.5">
                          {crmLogs.map((l, i) => <div key={i} className="text-[10px] text-green-400 font-mono">{l}</div>)}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* ───────────── CRM ───────────── */}
                {activeTab === 'crm' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.phone()}>CRM - استعادة السلة المتروكة</SectionTitle>
                      <div className="space-y-3 mb-4">
                        <Field label="رقم الهاتف" value={crmPhone} onChange={setCrmPhone} />
                      </div>
                      <Btn onClick={testCrm} loading={crmStatus === 'loading'} variant="gold" className="w-full mb-3">
                        إطلاق دورة CRM (3 Touches)
                      </Btn>
                      {crmLogs.length > 0 && (
                        <div className="bg-black/50 border border-white/5 rounded-xl p-3 space-y-2 mt-2">
                          {crmLogs.map((l, i) => <div key={i} className="text-[10px] text-green-400 font-mono">{l}</div>)}
                        </div>
                      )}
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.bell()}>إرسال إشعار Push/WhatsApp</SectionTitle>
                      <div className="space-y-3 mb-4">
                        <Field label="هاتف" value={notifPhone} onChange={setNotifPhone} />
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">الرسالة</label>
                          <textarea rows={2} value={notifMsg} onChange={e => setNotifMsg(e.target.value)}
                            className="w-full bg-black/60 border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#C5A059]/60 resize-none" />
                        </div>
                      </div>
                      <Btn onClick={testNotification} loading={notifStatus === 'loading'} variant="gold" className="w-full">
                        إرسال الإشعار
                      </Btn>
                    </Card>
                  </div>
                )}

                {/* ───────────── DROPSHIPPING ───────────── */}
                {activeTab === 'dropship' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.globe()}>استيراد منتج AliExpress</SectionTitle>
                      <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">الصق رابط AliExpress — سيقوم النظام بجلب التفاصيل، ترجمتها للعربية، حساب الهامش، وحفظها في Supabase.</p>
                      <Field label="رابط المنتج" value={aliUrl} onChange={setAliUrl} placeholder="https://www.aliexpress.com/item/..." />
                      <div className="mt-4">
                        <Btn onClick={testImport} loading={importStatus === 'loading'} variant="gold" className="w-full">
                          {Icon.globe()} استيراد وترجمة وحفظ
                        </Btn>
                      </div>
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.globe()}>نتيجة الاستيراد</SectionTitle>
                      {importResult ? (
                        <div>
                          {importStatus === 'success' && importResult.product && (
                            <div className="flex items-center gap-3 mb-3 bg-black/50 rounded-xl p-3">
                              <img src={importResult.product.images?.[0]} className="w-12 h-12 rounded-lg object-cover" alt="" />
                              <div>
                                <p className="text-xs font-bold">{importResult.product.title_ar}</p>
                                <p className="text-[10px] text-[#C5A059]">{importResult.product.price} ر.س</p>
                              </div>
                            </div>
                          )}
                          <ResultBox data={importResult} />
                        </div>
                      ) : <div className="text-xs text-gray-600 text-center py-20">اضغط استيراد لبدء الاختبار</div>}
                    </Card>
                  </div>
                )}

                {/* ───────────── AI ───────────── */}
                {activeTab === 'ai' && (
                  <Card className="h-[500px] flex flex-col">
                    <SectionTitle icon={Icon.cpu()}>محادثة مع الذكاء الاصطناعي (AI Chat API)</SectionTitle>
                    <div className="flex-1 bg-black/50 rounded-xl p-4 overflow-y-auto space-y-3 mb-3">
                      {chatMessages.map(m => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                            m.role === 'user'
                              ? 'bg-[#C5A059]/10 border border-[#C5A059]/20 text-white'
                              : 'bg-[#1a1a1a] border border-white/5 text-gray-300'
                          }`}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                      {chatStatus === 'loading' && (
                        <div className="flex justify-end">
                          <div className="bg-[#1a1a1a] border border-white/5 px-3 py-2 rounded-xl text-xs text-gray-500 flex items-center gap-2">
                            {Icon.spin()} يكتب...
                          </div>
                        </div>
                      )}
                    </div>
                    <form onSubmit={e => { e.preventDefault(); testAiChat(); }} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="اكتب سؤالاً... (مثال: ما أفضل منتجاتكم؟)"
                        className="flex-1 bg-black/60 border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#C5A059]/60"
                      />
                      <Btn variant="gold" size="sm">{Icon.send()}</Btn>
                    </form>
                  </Card>
                )}

                {/* ───────────── FRAUD ───────────── */}
                {activeTab === 'fraud' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.shield()}>كشف الاحتيال والتحقق الأمني</SectionTitle>
                      <div className="space-y-3 mb-4">
                        <Field label="عنوان IP المشبوه" value={fraudIp} onChange={setFraudIp} placeholder="185.220.101.1" />
                        <div className="grid grid-cols-2 gap-2">
                          {['185.220.101.1', '192.168.1.1', '8.8.8.8', '103.21.244.0'].map(ip => (
                            <button key={ip} onClick={() => setFraudIp(ip)} className="bg-black/50 border border-white/5 rounded-lg py-1.5 text-[9px] font-mono hover:border-red-500/20 hover:text-red-400 transition-all">{ip}</button>
                          ))}
                        </div>
                      </div>
                      <Btn onClick={testFraud} loading={fraudStatus === 'loading'} variant="danger" className="w-full">
                        {Icon.shield()} تحليل مستوى الخطر
                      </Btn>
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.shield()}>نتيجة تحليل الاحتيال</SectionTitle>
                      {fraudResult ? <ResultBox data={fraudResult} /> : <div className="text-xs text-gray-600 text-center py-20">أدخل IP واضغط تحليل</div>}
                    </Card>
                  </div>
                )}

                {/* ───────────── ADMIN ───────────── */}
                {activeTab === 'admin' && (
                  <div className="space-y-6">
                    {/* Circuit Breakers */}
                    <Card>
                      <SectionTitle icon={Icon.zap()}>لوحة القواطع الذكية (Circuit Breakers)</SectionTitle>
                      <p className="text-[10px] text-gray-500 mb-4">اضغط على أي قاطع لفتحه/إغلاقه يدوياً واختبار سلوك الـ Fallback.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(breakers).map(([name, br]) => (
                          <button
                            key={name}
                            onClick={() => toggleBreaker(name)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              br.status === 'CLOSED'
                                ? 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10'
                                : 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                            }`}
                          >
                            <div className={`text-[9px] font-bold mb-1 ${br.status === 'CLOSED' ? 'text-green-400' : 'text-red-400'}`}>
                              {br.status === 'CLOSED' ? '🟢 CLOSED' : '🔴 OPEN'}
                            </div>
                            <div className="text-[9px] font-mono text-gray-400 truncate">{name}</div>
                            <div className="text-[8px] text-gray-600 mt-0.5">Fallback: {br.fallback ? 'نشط' : 'معطل'}</div>
                          </button>
                        ))}
                      </div>
                    </Card>

                    {/* Admin Controls */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <SectionTitle icon={Icon.activity()}>عمليات لوحة الأدمن</SectionTitle>
                        <div className="space-y-2">
                          <Btn onClick={testAdminOps} loading={adminStatus === 'loading'} variant="white" className="w-full">
                            {Icon.refresh(adminStatus === 'loading')} حالة النظام الكاملة
                          </Btn>
                          <Btn onClick={testInventoryAlerts} loading={inventoryStatus === 'loading'} variant="ghost" className="w-full">
                            تنبيهات المخزون
                          </Btn>
                          <Btn onClick={testGetUsers} loading={usersStatus === 'loading'} variant="ghost" className="w-full">
                            {Icon.user()} قائمة المستخدمين
                          </Btn>
                          <Btn onClick={testAnalytics} loading={analyticsStatus === 'loading'} variant="ghost" className="w-full">
                            {Icon.activity()} بيانات Analytics
                          </Btn>
                          <Btn onClick={testWebhook} loading={webhookStatus === 'loading'} variant="ghost" className="w-full">
                            اختبار Stripe Webhook
                          </Btn>
                          <Btn onClick={testGdpr} loading={gdprStatus === 'loading'} variant="danger" className="w-full">
                            {Icon.lock()} تصدير بيانات GDPR
                          </Btn>
                        </div>
                      </Card>

                      <Card>
                        <SectionTitle icon={Icon.activity()}>نتائج لوحة الأدمن</SectionTitle>
                        <div className="space-y-2">
                          {adminData && (
                            <div>
                              <p className="text-[9px] text-gray-500 font-bold mb-1">حالة النظام</p>
                              <ResultBox data={{ uptime: adminData.uptime, version: adminData.version, services: Object.keys(adminData.services || {}) }} />
                            </div>
                          )}
                          {usersData && (
                            <div>
                              <p className="text-[9px] text-gray-500 font-bold mb-1 flex items-center gap-1">المستخدمون {badge(usersStatus)}</p>
                              <ResultBox data={{ total: usersData.users?.length || 0, sample: usersData.users?.[0] }} />
                            </div>
                          )}
                          {gdprResult && (
                            <div>
                              <p className="text-[9px] text-gray-500 font-bold mb-1">GDPR Export</p>
                              <ResultBox data={gdprResult} />
                              <button
                                onClick={() => {
                                  const blob = new Blob([JSON.stringify(gdprResult, null, 2)], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url; a.download = `gdpr-${gdprPhone}.json`; a.click();
                                }}
                                className="text-[9px] text-[#C5A059] hover:underline flex items-center gap-1 mt-1"
                              >
                                {Icon.download()} تحميل ملف JSON
                              </button>
                            </div>
                          )}
                          {!adminData && !usersData && !gdprResult && (
                            <div className="text-xs text-gray-600 text-center py-16">اضغط أي عملية من اليسار</div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* ───────────── ANALYTICS ───────────── */}
                {activeTab === 'analytics' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <SectionTitle icon={Icon.activity()}>Analytics Dashboard API</SectionTitle>
                      <p className="text-[10px] text-gray-500 mb-4">يجلب بيانات المبيعات والزوار والأداء من قاعدة البيانات.</p>
                      <Btn onClick={testAnalytics} loading={analyticsStatus === 'loading'} variant="gold" className="w-full mb-3">
                        {Icon.activity()} جلب بيانات Analytics
                      </Btn>
                      <Btn onClick={testWebhook} loading={webhookStatus === 'loading'} variant="ghost" className="w-full">
                        اختبار Stripe Webhook
                      </Btn>
                    </Card>
                    <Card>
                      <SectionTitle icon={Icon.activity()}>البيانات الحية</SectionTitle>
                      {analyticsData ? <ResultBox data={analyticsData} /> : webhookResult ? <ResultBox data={webhookResult} /> : <div className="text-xs text-gray-600 text-center py-20">اضغط جلب البيانات</div>}
                    </Card>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Right: Live Console ── */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <SectionTitle icon={Icon.activity()}>سجل العمليات الحي</SectionTitle>
              <Console logs={logs} onClear={() => setLogs([])} />
            </Card>

            {/* Quick Actions */}
            <Card>
              <SectionTitle icon={Icon.zap()}>اختصارات الاختبار السريع</SectionTitle>
              <div className="space-y-2">
                {[
                  { label: '🔍 فحص DB', action: () => { setActiveTab('db'); testDb(); } },
                  { label: '📦 جلب منتجات', action: () => { setActiveTab('products'); fetchProducts(); } },
                  { label: '🔐 فحص Auth', action: () => { setActiveTab('auth'); testLogin(); } },
                  { label: '💳 اختبار Checkout', action: () => { setActiveTab('checkout'); testCheckout(); } },
                  { label: '🏷️ تحقق كوبون', action: () => { setActiveTab('coupons'); testCoupon(); } },
                  { label: '🛡️ كشف احتيال', action: () => { setActiveTab('fraud'); testFraud(); } },
                  { label: '⚙️ لوحة الأدمن', action: () => { setActiveTab('admin'); testAdminOps(); } },
                  { label: '📈 Analytics', action: () => { setActiveTab('analytics'); testAnalytics(); } },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full text-right text-[10px] bg-black/40 hover:bg-[#C5A059]/5 border border-white/[0.04] hover:border-[#C5A059]/20 rounded-xl px-3 py-2 transition-all text-gray-400 hover:text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Links to Live Pages */}
            <Card>
              <SectionTitle icon={Icon.globe()}>روابط الصفحات الحية</SectionTitle>
              <div className="space-y-1.5">
                {[
                  { href: '/', label: '🏠 الصفحة الرئيسية' },
                  { href: '/products', label: '🛍️ كتالوج المنتجات' },
                  { href: '/auth/login', label: '🔐 تسجيل الدخول' },
                  { href: '/auth/register', label: '📝 إنشاء حساب جديد' },
                  { href: '/admin', label: '⚙️ لوحة الأدمن' },
                  { href: '/cart', label: '🛒 سلة التسوق' },
                  { href: '/account', label: '👤 حساب المستخدم' },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    target="_blank"
                    className="flex items-center justify-between text-[10px] text-gray-500 hover:text-white py-1.5 border-b border-white/[0.03] last:border-0 transition-colors"
                  >
                    <span>{label}</span>
                    <span className="text-gray-700">↗</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
