'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, useTransform, useSpring } from 'framer-motion';

const HERO_TEXTS = [
  { ar: 'جوهر الفخامة', en: 'THE ESSENCE OF LUXURY' },
  { ar: 'فريد من نوعه', en: 'ONE OF A KIND' },
  { ar: 'يُصنع للخلود', en: 'CRAFTED FOR ETERNITY' },
];

export default function CinematicSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textIdx, setTextIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const totalFrames = 196;
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Framer scroll within pinned section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Spring-damped progress for smooth transforms
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  // Parallax transforms
  const headlineY = useTransform(progress, [0, 1], ['0%', '-30%']);
  const headlineOp = useTransform(progress, [0, 0.35, 0.65, 1], [1, 1, 0, 0]);
  const canvasScale = useTransform(progress, [0, 1], [1, 1.12]);
  const overlayOp = useTransform(progress, [0, 0.5, 1], [0.5, 0.6, 0.8]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(HERO_TEXTS.length - 1, Math.floor(v * HERO_TEXTS.length));
    setTextIdx(idx);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    const drawFrame = (index: number) => {
      const img = loadedImages[index];
      if (img && img.complete) {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        if (!imgWidth || !imgHeight) return;

        const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
        const x = (canvasWidth - imgWidth * scale) / 2;
        const y = (canvasHeight - imgHeight * scale) / 2;
        const w = imgWidth * scale;
        const h = imgHeight * scale;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, x, y, w, h);
      }
    };

    const handleImageLoad = () => {
      loadedCount++;
      setImagesLoaded(loadedCount);
      // Draw first frame as soon as it's ready
      if (loadedCount === 1) {
        drawFrame(0);
      }
    };

    // Preload images
    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      const frameNum = i.toString().padStart(5, '0');
      img.src = `/fem/frame_${frameNum}.webp`;
      img.onload = handleImageLoad;
      loadedImages.push(img);
    }
    imagesRef.current = loadedImages;

    // Listen to scroll progress changes and draw corresponding frame
    const unsubscribe = progress.on('change', (latestProgress) => {
      const frameIndex = Math.min(
        totalFrames - 1,
        Math.max(0, Math.floor(latestProgress * totalFrames))
      );
      requestAnimationFrame(() => drawFrame(frameIndex));
    });

    // Resize handler
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      
      // Re-draw current frame
      const currentFrame = Math.min(
        totalFrames - 1,
        Math.max(0, Math.floor(progress.get() * totalFrames))
      );
      drawFrame(currentFrame);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Trigger initial draw once images load
    const interval = setInterval(() => {
      const currentFrame = Math.min(
        totalFrames - 1,
        Math.max(0, Math.floor(progress.get() * totalFrames))
      );
      if (loadedImages[currentFrame] && loadedImages[currentFrame].complete) {
        drawFrame(currentFrame);
        clearInterval(interval);
      }
    }, 100);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(interval);
    };
  }, [mounted, progress]);

  return (
    <div ref={containerRef} className="relative h-[350vh] w-full bg-black">
      {/* ── STICKY FRAME ─────────────────────────────────────────── */}
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">

        {/* 2-D Canvas Image Sequence Background */}
        <motion.div
          style={{ scale: canvasScale }}
          className="absolute inset-0 w-full h-full origin-center"
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block bg-black" />
        </motion.div>

        {/* Dark vignette overlay */}
        <motion.div
          style={{ opacity: overlayOp }}
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 pointer-events-none z-10"
        />

        {/* ── HERO CONTENT ───────────────────────────────────────── */}
        <motion.div
          style={{ y: headlineY, opacity: headlineOp }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
        >
          {/* Brand mark */}
          <motion.div
            initial={{ opacity: 0, letterSpacing: '0.6em' }}
            animate={{ opacity: 1, letterSpacing: '0.35em' }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="text-[#C5A059] text-xs md:text-sm font-bold tracking-[0.35em] uppercase mb-8 md:mb-12"
          >
            ✦ &nbsp;شَامِخ SHAMIKH &nbsp;✦
          </motion.div>

          {/* Main headline — fades between texts on scroll */}
          <div className="relative overflow-hidden">
            <motion.h1
              key={textIdx}
              initial={{ y: 60, opacity: 0, filter: 'blur(12px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -60, opacity: 0, filter: 'blur(12px)' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-bold leading-[1.05] tracking-tight"
              style={{
                fontSize: 'clamp(2rem, 8vw, 8rem)',
                textShadow: '0 4px 40px rgba(197,160,89,0.25)',
              }}
            >
              {HERO_TEXTS[textIdx].ar}
            </motion.h1>
          </div>

          <motion.p
            key={`en-${textIdx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[#C5A059]/70 text-xs md:text-sm tracking-[0.4em] uppercase mt-6 md:mt-8"
          >
            {HERO_TEXTS[textIdx].en}
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }}
            className="absolute bottom-14 flex flex-col items-center gap-3"
          >
            <span className="text-white/50 text-[10px] tracking-[0.3em] uppercase">تمرير للاستكشاف</span>
            <div className="w-px h-12 bg-gradient-to-b from-[#C5A059] to-transparent" />
          </motion.div>
        </motion.div>

        {/* ── PROGRESS REEL (right edge) ──────────────────────────── */}
        <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3">
          {HERO_TEXTS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: i === textIdx ? 32 : 8,
                opacity: i === textIdx ? 1 : 0.3,
              }}
              transition={{ duration: 0.4 }}
              className="w-[2px] rounded-full bg-[#C5A059]"
            />
          ))}
        </div>

        {/* ── CORNER STATS (bottom-left) ──────────────────────────── */}
        <div className="absolute bottom-8 md:bottom-10 left-0 right-0 md:left-14 md:right-auto z-30 flex gap-6 md:gap-10 text-white/60 justify-center md:justify-start px-6 flex-wrap">
          {[
            { val: '+12K', label: 'عميل VIP' },
            { val: '15Y',  label: 'خبرة في الفخامة' },
            { val: '100%', label: 'مضمون الأصالة' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.15, duration: 0.8 }}
              className="flex flex-col"
            >
              <span className="text-[#C5A059] text-lg md:text-2xl font-bold">{stat.val}</span>
              <span className="text-[10px] md:text-xs tracking-wider uppercase mt-1">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
