'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldCheck, LayoutDashboard, ShoppingCart, ShoppingBag,
  Settings, LogOut, Sparkles, Database, Menu, X, ArrowLeft,
  Crown, MessageCircle, BarChart2
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; role: string } | null>(null);

  // Auth Guard Checking
  useEffect(() => {
    const isLoginPath = pathname === '/admin/login';
    const session = localStorage.getItem('shamikh_admin_session');
    
    if (session === 'true') {
      setIsAuthenticated(true);
      const userStr = localStorage.getItem('shamikh_admin_user');
      if (userStr) setAdminUser(JSON.parse(userStr));
      
      if (isLoginPath) {
        router.push('/admin');
      }
    } else {
      setIsAuthenticated(false);
      if (!isLoginPath) {
        router.push('/admin/login');
      }
    }
  }, [pathname, router]);

  const isLoginPath = pathname === '/admin/login';
  
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center font-sans">
        <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] text-gray-600 tracking-widest uppercase font-mono">SHAMIKH SYSTEM SECURE LAUNCH...</p>
      </div>
    );
  }

  if (isLoginPath) {
    return <>{children}</>;
  }

  if (!isAuthenticated && !isLoginPath) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center font-sans">
        <p className="text-xs text-[#C5A059] tracking-widest uppercase font-bold animate-pulse">جاري التحقق من التشفير الأمني للمنصة...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('shamikh_admin_session');
    localStorage.removeItem('shamikh_admin_user');
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard },
    { name: 'المنتجات', href: '/admin/products', icon: ShoppingBag },
    { name: 'الطلبات', href: '/admin/orders', icon: ShoppingCart },
    { name: 'العملاء VIP', href: '/admin/customers', icon: Crown },
    { name: 'شات الدعم', href: '/admin/chat', icon: MessageCircle },
    { name: 'التحليلات', href: '/admin/analytics', icon: BarChart2 },
    { name: 'دروبشيبينغ', href: '/admin/dropshipping', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex overflow-hidden relative" dir="rtl">
      
      {/* Dynamic Cinematic Glares */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C5A059]/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-purple-900/[0.03] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-[#0b0b0b]/90 border-l border-white/[0.06] backdrop-blur-xl shrink-0 relative overflow-hidden">
        {/* Brand Header */}
        <div className="p-8 border-b border-white/[0.05] flex items-center gap-4">
          <div className="w-10 h-10 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl flex items-center justify-center shadow-lg shadow-[#C5A059]/5">
            <Crown className="text-[#C5A059]" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wide text-white">شامخ</h2>
            <p className="text-[9px] text-[#C5A059] tracking-widest uppercase font-mono font-bold">LUXURY OS</p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={idx}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 shadow-[0_0_15px_rgba(197,160,89,0.05)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#C5A059]' : 'text-gray-500'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Meta Card */}
        {adminUser && (
          <div className="m-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">المدير المتصل</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            </div>
            <p className="text-xs font-bold text-white">{adminUser.name}</p>
            <p className="text-[9px] text-[#C5A059] font-mono">{adminUser.role}</p>
          </div>
        )}

        {/* Logout & Return */}
        <div className="p-6 border-t border-white/[0.05] space-y-2.5">
          <Link href="/" className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white transition-all">
            <ArrowLeft size={14} /> العودة للمتجر
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-bold transition-all border border-red-500/20"
          >
            <LogOut size={14} /> تسجيل خروج آمن
          </button>
        </div>
      </aside>

      {/* ─── MOBILE HEADER & SIDEBAR NAVIGATION ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0b0b0b]/90 backdrop-blur-md border-b border-white/[0.06] px-6 flex items-center justify-between z-[99]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-lg flex items-center justify-center">
            <Crown className="text-[#C5A059]" size={16} />
          </div>
          <span className="text-xs font-black text-white tracking-wide">شامخ الأدمن</span>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[98]"
        />
      )}

      {/* Mobile Drawer Menu */}
      <aside className={`lg:hidden fixed top-16 right-0 bottom-0 w-[280px] bg-[#0b0b0b]/95 border-l border-white/[0.06] z-[98] flex flex-col transition-transform duration-300 ease-[0.16, 1, 0.3, 1] ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={idx}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#C5A059]' : 'text-gray-500'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Meta Card Mobile */}
        {adminUser && (
          <div className="m-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <p className="text-[9px] text-gray-500 font-bold uppercase">متصل الآن</p>
            <p className="text-xs font-bold text-white">{adminUser.name}</p>
            <p className="text-[9px] text-[#C5A059] font-mono">{adminUser.role}</p>
          </div>
        )}

        <div className="p-4 border-t border-white/[0.05] space-y-2.5">
          <Link href="/" className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white hover:bg-white/10 transition-all">
            <ArrowLeft size={14} /> العودة للمتجر
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 rounded-xl text-[10px] font-bold text-red-400 transition-all border border-red-500/20"
          >
            <LogOut size={14} /> خروج آمن
          </button>
        </div>
      </aside>

      {/* ─── MAIN DASHBOARD CONTENT AREA ─── */}
      <main className="flex-1 overflow-y-auto h-screen w-full lg:pt-0 pt-16 relative">
        {children}
      </main>

    </div>
  );
}
