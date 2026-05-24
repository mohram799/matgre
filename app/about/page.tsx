'use client';

import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="bg-[#FAFAFA] text-[#1A1A1A] min-h-screen font-sans" dir="rtl">
      {/* Hero Section */}
      <div className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-white">
        <motion.div 
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=2000&q=80" 
            alt="Luxury Executive" 
            className="w-full h-full object-cover opacity-[0.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-transparent to-white/50" />
        </motion.div>

        <div className="relative z-10 text-center px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-3xl border border-white/80 p-10 md:p-16 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.03)]"
          >
            <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight text-[#1A1A1A]">
              شَامِخ
            </h1>
            <p className="text-lg md:text-2xl text-[#C5A059] font-bold tracking-[0.2em]">
              أكثر من مجرد متجر، نحن نصنع الإرث.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="py-24 px-6 md:px-20 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="md:w-1/2">
            <motion.h2 
              initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-[#1A1A1A]"
            >
              لم نُخلق لنرضي الجميع،<br />
              <span className="text-[#C5A059]">بل صُنعنا لنذهل النخبة.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-500 text-lg md:text-xl leading-relaxed mb-6"
            >
              تأسست "شامخ" برؤية واضحة: إحداث ثورة في مفهوم التجارة الفاخرة في الشرق الأوسط. نحن لا نبيع المنتجات، بل ننتقي القطع النادرة التي تحمل قصصاً وتاريخاً، من أعماق غابات إندونيسيا حيث العود المعتق، إلى أروقة سويسرا حيث الساعات التي تُجمع يدوياً.
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}
              className="text-gray-500 text-lg md:text-xl leading-relaxed"
            >
              تعتمد منصتنا على أرقى التقنيات لضمان تجربة مستخدم مبهجة، سلسة، ومريحة للعين. كل تفصيلة صُممت لتعكس رفاهيتك المطلقة.
            </motion.p>
          </div>
          <div className="md:w-1/2 relative w-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
              className="relative h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.07)]"
            >
              <img src="https://images.unsplash.com/photo-1618022325802-7e5e732d97a1?w=1000&q=80" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
