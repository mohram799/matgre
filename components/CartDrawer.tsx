'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, removeItem, updateQuantity } = useCart();

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Prevent scrolling when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-screen w-full max-w-[480px] bg-[#FAFAFA] z-[101] shadow-2xl flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-200">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ShoppingBag className="text-[#C5A059]" /> سلتك الفاخرة
              </h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingBag size={64} className="mb-4 opacity-50" />
                  <p className="text-lg">سلتك فارغة، عالم الفخامة بانتظارك.</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div layout key={item.id} className="flex gap-6">
                    <div className="w-28 h-32 rounded-2xl overflow-hidden shadow-md shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <p className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">{item.category}</p>
                      <h3 className="font-bold text-lg leading-tight mb-2">{item.name}</h3>
                      <p className="font-medium text-gray-500 mb-4">{item.price.toLocaleString()} ر.س</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-full px-4 py-1.5">
                          <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-black transition-colors"><Minus size={14} /></button>
                          <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-black transition-colors"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">إزالة</button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {items.length > 0 && (
              <div className="p-8 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 font-medium text-lg">المجموع الفرعي</span>
                  <span className="text-3xl font-bold">{total.toLocaleString()} <span className="text-lg font-medium text-gray-400">ر.س</span></span>
                </div>
                <Link href="/checkout" onClick={onClose} className="w-full bg-[#1A1A1A] text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#C5A059] transition-colors shadow-xl">
                  إتمام الشراء (Checkout) <ArrowRight size={20} />
                </Link>
                <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-2">
                   الدفع آمن ومحمي وموثق <span className="text-[#C5A059] font-bold">LCOS</span>
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
