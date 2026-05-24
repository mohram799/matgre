'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Prevent scrolling when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleTrendingClick = (term: string) => {
    setQuery(term);
    router.push(`/products?search=${encodeURIComponent(term)}`);
    onClose();
  };

  const topSearches = ['دهن عود', 'رولكس دايتونا', 'طقم ألماس', 'حقيبة هيرميس'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(24px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[110] bg-white/90 flex flex-col items-center justify-center p-8"
          dir="rtl"
        >
          <button 
            onClick={onClose}
            className="absolute top-10 right-10 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-4xl">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative"
            >
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" size={32} />
              <form onSubmit={handleSearchSubmit}>
                <input 
                  type="text"
                  placeholder="ابحث عن المقتنيات النادرة..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-gray-300 text-5xl md:text-7xl font-light text-[#1A1A1A] py-6 pr-20 focus:outline-none focus:border-[#C5A059] transition-colors placeholder:text-gray-300"
                  autoFocus
                />
              </form>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-16 flex flex-col md:flex-row gap-12"
            >
              <div className="flex-1">
                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6">الأكثر بحثاً (Trending)</h3>
                <div className="flex flex-wrap gap-4">
                  {topSearches.map((term, idx) => (
                    <button key={idx} onClick={() => handleTrendingClick(term)} className="px-6 py-3 rounded-full bg-gray-100 text-gray-600 font-medium hover:bg-[#C5A059] hover:text-white transition-colors flex items-center gap-2">
                      <ArrowUpRight size={16} /> {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
