'use client';
  import { ReactLenis } from '@studio-freight/react-lenis';
  import { motion } from 'framer-motion';

  export default function SmoothLayout({ children }: { children: React.ReactNode }) {
    return (
      <ReactLenis root options={{ lerp: 0.05, duration: 1.5, smoothWheel: true }}>
        <nav className="fixed w-full z-50 px-12 py-8 flex justify-between items-center mix-blend-difference text-white pointer-events-none">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }} className="text-2xl font-serif tracking-widest pointer-events-auto">
            ÉCLAT
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.7 }} className="flex gap-12 text-xs font-sans tracking-[0.2em] uppercase pointer-events-auto">
            <a href="#" className="hover:text-gold transition-colors">Collections</a>
            <a href="#" className="hover:text-gold transition-colors">Maison</a>
            <a href="#" className="hover:text-gold transition-colors">Cart (0)</a>
          </motion.div>
        </nav>
        {children}
      </ReactLenis>
    );
  }