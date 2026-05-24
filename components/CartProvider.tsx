'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Search, User } from 'lucide-react';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type CartItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (v: boolean) => void;
}

export const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Default to true
  const { scrollY } = useScroll();
  const pathname = usePathname();

  useEffect(() => {
    // If not on homepage, navbar is always visible
    if (pathname !== '/') {
      setIsVisible(true);
    } else {
      setIsVisible(false); // Let scroll event handle it on home
    }
  }, [pathname]);

  const addItem = (newItem: CartItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === newItem.id);
      if (exists) {
        return prev.map(i => i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeItem = (id: string | number) => setItems(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setItems([]);
  
  const updateQuantity = (id: string | number, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (typeof window !== 'undefined') {
      if (pathname === '/') {
        const threshold = window.innerHeight * 2.5;
        setIsVisible(latest > threshold);
      } else {
        setIsVisible(true);
      }
    }
  });

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const hideNavbar = pathname.startsWith('/admin') || pathname.startsWith('/test');

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, isCartOpen, setIsCartOpen }}>
      {!hideNavbar && (
        <AnimatePresence>
          {isVisible && (
            <motion.nav 
              initial={{ y: -100, opacity: 0, x: '-50%' }}
              animate={{ y: 0, opacity: 1, x: '-50%' }}
              exit={{ y: -100, opacity: 0, x: '-50%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="fixed top-8 left-1/2 z-[100] w-[90%] max-w-5xl rounded-full bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_30px_60px_rgba(0,0,0,0.12)] px-8 py-4 flex justify-between items-center mix-blend-luminosity hover:mix-blend-normal hover:bg-white/60 transition-all duration-500"
              dir="rtl"
            >
              <div className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
                <Link href="/">شَامِخ <span className="text-[#C5A059] font-light text-xl">SHAMIKH</span></Link>
              </div>

              <div className="hidden md:flex gap-8 text-sm font-bold text-gray-700">
                <Link href="/products" className="hover:text-[#C5A059] transition-colors duration-300">التشكيلة الكاملة</Link>
                <Link href="/about" className="hover:text-[#C5A059] transition-colors duration-300">قصة العلامة</Link>
                <Link href="/products" className="hover:text-[#C5A059] transition-colors duration-300">ساعات ومجوهرات</Link>
              </div>

              <div className="flex gap-4 items-center">
                <button onClick={() => setIsSearchOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 transition-colors">
                  <Search size={20} />
                </button>
                <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 transition-colors">
                  <User size={20} />
                </Link>
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="text-sm font-bold bg-[#1A1A1A] text-white px-8 py-3 rounded-full hover:bg-[#C5A059] shadow-xl hover:shadow-[#C5A059]/30 transition-all duration-300 transform hover:scale-105"
                >
                  سلتك ({cartItemsCount})
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      )}

      {children}
      
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </CartContext.Provider>
  );
}
