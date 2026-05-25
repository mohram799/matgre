'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Phone, User, Mail, Eye, EyeOff, ShieldCheck, ChevronLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  { code: '+966', flag: '🇸🇦', name: 'السعودية',     abbr: 'SA' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات',     abbr: 'AE' },
  { code: '+974', flag: '🇶🇦', name: 'قطر',           abbr: 'QA' },
  { code: '+973', flag: '🇧🇭', name: 'البحرين',       abbr: 'BH' },
  { code: '+968', flag: '🇴🇲', name: 'عُمان',          abbr: 'OM' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت',        abbr: 'KW' },
  { code: '+962', flag: '🇯🇴', name: 'الأردن',        abbr: 'JO' },
  { code: '+961', flag: '🇱🇧', name: 'لبنان',         abbr: 'LB' },
  { code: '+20',  flag: '🇪🇬', name: 'مصر',           abbr: 'EG' },
  { code: '+212', flag: '🇲🇦', name: 'المغرب',        abbr: 'MA' },
  { code: '+216', flag: '🇹🇳', name: 'تونس',          abbr: 'TN' },
  { code: '+213', flag: '🇩🇿', name: 'الجزائر',       abbr: 'DZ' },
  { code: '+218', flag: '🇱🇾', name: 'ليبيا',         abbr: 'LY' },
  { code: '+249', flag: '🇸🇩', name: 'السودان',       abbr: 'SD' },
  { code: '+963', flag: '🇸🇾', name: 'سوريا',         abbr: 'SY' },
  { code: '+964', flag: '🇮🇶', name: 'العراق',        abbr: 'IQ' },
  { code: '+967', flag: '🇾🇪', name: 'اليمن',         abbr: 'YE' },
  { code: '+90',  flag: '🇹🇷', name: 'تركيا',         abbr: 'TR' },
  { code: '+44',  flag: '🇬🇧', name: 'بريطانيا',      abbr: 'GB' },
  { code: '+33',  flag: '🇫🇷', name: 'فرنسا',         abbr: 'FR' },
  { code: '+49',  flag: '🇩🇪', name: 'ألمانيا',       abbr: 'DE' },
  { code: '+1',   flag: '🇺🇸', name: 'أمريكا',        abbr: 'US' },
  { code: '+86',  flag: '🇨🇳', name: 'الصين',         abbr: 'CN' },
  { code: '+81',  flag: '🇯🇵', name: 'اليابان',       abbr: 'JP' },
  { code: '+91',  flag: '🇮🇳', name: 'الهند',         abbr: 'IN' },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordColor, setPasswordColor] = useState('');

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    if (!passwordValue) {
      setPasswordStrength('');
      setPasswordColor('');
      return;
    }
    if (passwordValue.length < 6) {
      setPasswordStrength('بسيط جداً');
      setPasswordColor('bg-red-400');
    } else if (passwordValue.length < 10) {
      setPasswordStrength('متوسط الأمان');
      setPasswordColor('bg-[#C5A059]');
    } else {
      setPasswordStrength('حصانة عالية جداً (VIP)');
      setPasswordColor('bg-green-500');
    }
  }, [passwordValue]);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.trim().replace(/^0+/, '');
    const fullPhone = `${selectedCountry.code}${cleanPhone}`;

    try {
      if (!isLogin) {
        // Register flow
        if (passwordValue !== confirmPassword) {
          setErrorMsg('الرموز السرية المدخلة غير متطابقة');
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/auth/customer-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: fullPhone,
            name: `${firstName} ${lastName}`.trim(),
            email: email.trim() || null,
            password: passwordValue,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'فشل تفعيل العضوية');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('shamikh_customer_session', JSON.stringify(data.user));
        // Clear local custom orders cache so it re-syncs cleanly
        localStorage.removeItem('shamikh_orders');
        setSuccessMsg(data.message);
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      } else {
        // Login flow
        const res = await fetch('/api/auth/customer-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: fullPhone,
            password: passwordValue,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'فشل تسجيل الدخول');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('shamikh_customer_session', JSON.stringify(data.user));
        // Clear local custom orders cache so it re-syncs cleanly
        localStorage.removeItem('shamikh_orders');
        setSuccessMsg(data.message);
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMsg('حدث خطأ في الاتصال بالخادم السحابي للمنصة');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] bg-gradient-to-b from-[#FAF6F0] via-white to-[#FAF6F0] flex items-center justify-center font-sans p-4 md:p-8 relative overflow-hidden" dir="rtl">
      
      {/* Scoped CSS to override WebKit browser autofill colors to match our luxury inputs */}
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #1A1A1A !important;
          border-color: #C5A059 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* ─── LUXURIOUS LIGHT AMBIENT BACKGROUND ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.12, 1], rotate: [0, 20, 0], x: [0, 20, 0], y: [0, -20, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[5%] w-[55vw] h-[55vw] bg-[#C5A059]/5 rounded-full blur-[140px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.08, 1], rotate: [0, -20, 0], x: [0, -15, 0], y: [0, 15, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -left-[5%] w-[45vw] h-[45vw] bg-[#C5A059]/4 rounded-full blur-[120px]"
        />
      </div>

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
        
        {/* ─── BACK TO SHOP BUTTON ─── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full flex justify-start mb-6"
        >
          <Link href="/" className="group flex items-center gap-2.5 text-gray-500 hover:text-[#C5A059] transition-all duration-300 bg-white/70 hover:bg-white px-5 py-2.5 rounded-full border border-gray-200/40 shadow-[0_10px_25px_rgba(26,26,26,0.015)] backdrop-blur-md">
            <span className="text-xs font-bold tracking-wider font-arabic">العودة للتسوق</span>
            <motion.span 
              className="flex items-center justify-center w-5 h-5 bg-gray-100/60 text-gray-500 group-hover:bg-[#C5A059]/10 group-hover:text-[#C5A059] rounded-full group-hover:translate-x-[-3px] transition-all duration-300"
            >
              <ArrowRight size={12} className="rotate-180" />
            </motion.span>
          </Link>
        </motion.div>

        {/* ─── LUXURIOUS GLASSMORPHIC CARD ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-white/70 backdrop-blur-xl border border-white/60 p-8 md:p-12 rounded-[2.5rem] shadow-[0_50px_100px_rgba(26,26,26,0.04),0_10px_30px_rgba(197,160,89,0.02)] relative"
        >
          {/* Top Brand Glow line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#C5A059]/80 to-transparent" />
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A] mb-1 font-arabic flex items-center justify-center gap-2">
              <span className="text-[#C5A059] font-light text-2xl">✦</span>
              شَامِخ
              <span className="text-[#C5A059] font-light text-2xl">✦</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-sans font-bold mb-2">
              SHAMIKH LUXURY
            </p>
            <p className="text-gray-500 font-medium text-xs font-arabic">
              بوابتك الخاصة لعالم النخبة والمقتنيات النادرة
            </p>
          </div>

          {/* ─── TABS SELECTOR (Toggle between Login/Register) ─── */}
          <div className="flex bg-[#FAF7F2] p-1 rounded-2xl mb-8 relative z-0 border border-gray-200/40">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setShowPassword(false); setShowConfirmPassword(false); }}
              className={`flex-1 py-3 text-xs font-bold font-arabic rounded-xl transition-all duration-300 relative z-10 ${isLogin ? 'text-[#1A1A1A]' : 'text-gray-400 hover:text-gray-500'}`}
            >
              تسجيل الدخول
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setShowPassword(false); setShowConfirmPassword(false); }}
              className={`flex-1 py-3 text-xs font-bold font-arabic rounded-xl transition-all duration-300 relative z-10 ${!isLogin ? 'text-[#1A1A1A]' : 'text-gray-400 hover:text-gray-500'}`}
            >
              عضوية جديدة
            </button>
            
            {/* Animated active slide background pill */}
            <motion.div 
              layout
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-200/10 z-0"
              initial={false}
              animate={{ right: isLogin ? '4px' : 'calc(50% + 0px)' }}
            />
          </div>

          {/* ─── FORM CONTENT ─── */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50/80 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-xs font-bold text-center mb-4 font-arabic"
              >
                ⚠️ {errorMsg}
              </motion.div>
            )}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50/80 border border-green-200 text-green-600 px-5 py-3 rounded-2xl text-xs font-bold text-center mb-4 font-arabic animate-pulse"
              >
                👑 {successMsg}
              </motion.div>
            )}
            <motion.form 
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
              onSubmit={handleAuth}
            >
              {/* Row: First and Last Name (Only for Registration) */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 px-1 font-arabic">الاسم الأول</label>
                    <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-4 focus-within:ring-[#C5A059]/10 focus-within:bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.015)] transition-all duration-300">
                      <User className="absolute right-4 text-[#C5A059]/80 group-focus-within:text-[#C5A059] transition-colors" size={16} />
                      <input 
                        type="text" 
                        placeholder="مثال: محمد" 
                        autoComplete="given-name"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full bg-transparent py-4 pr-11 pl-4 text-[#1A1A1A] text-sm font-arabic focus:outline-none transition-all placeholder:text-gray-300" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 px-1 font-arabic">الاسم الأخير</label>
                    <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-4 focus-within:ring-[#C5A059]/10 focus-within:bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.015)] transition-all duration-300">
                      <User className="absolute right-4 text-[#C5A059]/80 group-focus-within:text-[#C5A059] transition-colors" size={16} />
                      <input 
                        type="text" 
                        placeholder="مثال: السالم" 
                        autoComplete="family-name"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full bg-transparent py-4 pr-11 pl-4 text-[#1A1A1A] text-sm font-arabic focus:outline-none transition-all placeholder:text-gray-300" 
                        required 
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Phone Input: Interactive country code selector + number input */}
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 px-1 font-arabic">رقم الهاتف <span className="text-[#C5A059]">*</span></label>
                <div className="relative group flex items-stretch w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-4 focus-within:ring-[#C5A059]/10 focus-within:bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.015)] transition-all duration-300" dir="ltr">
                  
                  {/* Country Code Dropdown Trigger */}
                  <div className="relative" ref={countryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCountryDropdownOpen(v => !v)}
                      className="h-full border-r border-gray-200/60 px-3 flex items-center gap-1.5 text-gray-700 font-bold text-xs select-none font-sans bg-gray-50/20 hover:bg-gray-100/40 transition-colors min-w-[80px] shrink-0"
                    >
                      <span className="text-base leading-none">{selectedCountry.flag}</span>
                      <span className="font-sans text-gray-600 text-[11px] font-semibold">{selectedCountry.code}</span>
                      <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${countryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown List */}
                    <AnimatePresence>
                      {countryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute top-full left-0 mt-2 w-52 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-[200] overflow-hidden"
                          dir="rtl"
                        >
                          {/* Scrollable list */}
                          <div className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
                            {COUNTRIES.map((country) => (
                              <button
                                key={country.abbr}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setCountryDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors hover:bg-[#C5A059]/8 ${
                                  selectedCountry.abbr === country.abbr
                                    ? 'bg-[#C5A059]/10 text-[#C5A059]'
                                    : 'text-gray-700'
                                }`}
                              >
                                <span className="text-lg shrink-0">{country.flag}</span>
                                <span className="flex-1 text-xs font-bold font-arabic truncate">{country.name}</span>
                                <span className="text-[10px] font-sans font-bold text-gray-400 shrink-0">{country.code}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Right Input Area */}
                  <div className="relative flex-1" dir="rtl">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C5A059]/80 group-focus-within:text-[#C5A059] transition-colors" size={16} />
                    <input 
                      type="tel" 
                      placeholder="5X XXX XXXX" 
                      autoComplete="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-transparent py-4 pr-11 pl-4 text-[#1A1A1A] text-sm font-sans focus:outline-none transition-all placeholder:text-gray-300" 
                      required 
                    />
                  </div>

                </div>
              </div>

              {/* Email (Optional, Registration Only) */}
              {!isLogin && (
                <div className="flex flex-col">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 px-1 font-arabic">البريد الإلكتروني <span className="text-gray-300 font-normal">(اختياري)</span></label>
                  <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-4 focus-within:ring-[#C5A059]/10 focus-within:bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.015)] transition-all duration-300">
                    <Mail className="absolute right-4 text-[#C5A059]/80 group-focus-within:text-[#C5A059] transition-colors" size={16} />
                    <input 
                      type="email" 
                      placeholder="vip@example.com" 
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-transparent py-4 pr-11 pl-4 text-[#1A1A1A] text-sm font-sans focus:outline-none transition-all placeholder:text-gray-300" 
                    />
                  </div>
                </div>
              )}

              {/* Secret Code (Password) */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <label className="text-xs font-semibold text-gray-400 font-arabic">الرمز السري</label>
                  {isLogin && (
                    <a href="#" className="text-xs font-bold text-[#C5A059] hover:text-[#1A1A1A] transition-colors font-arabic">
                      نسيت الرمز؟
                    </a>
                  )}
                </div>
                <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-4 focus-within:ring-[#C5A059]/10 focus-within:bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.015)] transition-all duration-300">
                  <Lock className="absolute right-4 text-[#C5A059]/80 group-focus-within:text-[#C5A059] transition-colors" size={16} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="w-full bg-transparent py-4 pr-11 pl-12 text-[#1A1A1A] text-sm font-sans focus:outline-none transition-all placeholder:text-gray-300 font-mono tracking-[0.2em]" 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 text-gray-400 hover:text-[#1A1A1A] transition-colors z-10"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator (Visual Luxury feature) */}
                {!isLogin && passwordValue && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 px-1 flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-gray-400 font-arabic">أمان الرمز السري:</span>
                      <span className="text-[#C5A059] font-arabic">{passwordStrength}</span>
                    </div>
                    <div className="w-full h-[2px] bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${passwordColor}`} 
                        initial={{ width: "0%" }}
                        animate={{ width: passwordValue.length < 6 ? "33%" : passwordValue.length < 10 ? "66%" : "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password (Registration Only) */}
              {!isLogin && (
                <div className="flex flex-col">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 px-1 font-arabic">تأكيد الرمز السري</label>
                  <div className="relative group flex items-center w-full rounded-2xl border border-gray-200/80 bg-white/50 focus-within:border-[#C5A059] focus-within:ring-4 focus-within:ring-[#C5A059]/10 focus-within:bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.015)] transition-all duration-300">
                    <Lock className="absolute right-4 text-[#C5A059]/80 group-focus-within:text-[#C5A059] transition-colors" size={16} />
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full bg-transparent py-4 pr-11 pl-12 text-[#1A1A1A] text-sm font-sans focus:outline-none transition-all placeholder:text-gray-300 font-mono tracking-[0.2em]" 
                      required 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-4 text-gray-400 hover:text-[#1A1A1A] transition-colors z-10"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Secure Protocol Badge */}
              <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-gray-400 select-none bg-[#FAF7F2]/40 py-2 rounded-xl border border-gray-200/10">
                <ShieldCheck size={14} className="text-[#C5A059]" />
                <span className="font-arabic font-medium">اتصال محمي ومشفر بالكامل ببروتوكول Zero-Trust</span>
              </div>

              {/* ─── ACTION SUBMIT BUTTON ─── */}
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold font-arabic text-sm hover:bg-[#C5A059] hover:shadow-[0_15px_30px_rgba(197,160,89,0.15)] transition-all duration-300 flex items-center justify-center gap-2 mt-4 shadow-[0_10px_25px_rgba(26,26,26,0.15)]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري التوثيق الأمني المعزز...
                  </span>
                ) : (
                  <>
                    <span>{isLogin ? 'دخول آمن للملف' : 'تفعيل العضوية وتأمينها'}</span>
                    <ChevronLeft size={16} className="translate-y-[0.5px] rotate-180" />
                  </>
                )}
              </motion.button>

            </motion.form>
          </AnimatePresence>

        </motion.div>
      </div>
    </div>
  );
}
