'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Phone, Lock, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { verifyAdminCredentials } from './actions';

export default function AdminLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const isAdmin = localStorage.getItem('shamikh_admin_session');
    if (isAdmin === 'true') {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        localStorage.setItem('shamikh_admin_session', 'true');
        localStorage.setItem('shamikh_admin_user', JSON.stringify({
          phone,
          name: result.user.name,
          role: result.user.role
        }));
        router.push('/admin');
      } else {
        setError(result.error || 'بيانات الاعتماد غير صالحة. يرجى التحقق من الرقم والكلمة السرية.');
        setIsLoading(false);
      }
    } catch {
      setError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col justify-center items-center relative overflow-hidden font-sans px-4" dir="rtl">
      
      {/* Cinematic Glowing Background */}
      <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-[#C5A059]/10 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#C5A059]/5 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Background Micro Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Luxury Logo */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-16 h-16 bg-gradient-to-br from-[#C5A059] to-[#8C6F35] rounded-full mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(197,160,89,0.3)] mb-4"
          >
            <ShieldCheck className="text-black" size={32} />
          </motion.div>
          
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans">
            شامخ <span className="text-[#C5A059] font-light">بوابة المدير</span>
          </h1>
          <p className="text-xs text-gray-500 tracking-widest uppercase">
            SHAMIKH LUXURY ADMIN ACCESS
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#121212]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Phone Number Field */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-right">رقم الهاتف الفاخر</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="010XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-12 pl-6 text-white placeholder-gray-700 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all text-sm font-sans"
                  disabled={isLoading}
                  required
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-right">كلمة المرور المشفرة</label>
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-12 pl-6 text-white placeholder-gray-700 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all text-sm font-sans"
                  disabled={isLoading}
                  required
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl flex items-center gap-2.5"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C5A059] hover:bg-[#b08d4b] text-black font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-700 disabled:text-gray-400 transform hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحقق من التشفير...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>تسجيل الدخول الآمن</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <a href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#C5A059] transition-colors text-xs font-bold uppercase tracking-wider">
            <ArrowLeft size={14} /> العودة للمتجر الرئيسي
          </a>
        </div>

      </motion.div>
    </div>
  );
}
