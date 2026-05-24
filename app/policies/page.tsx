import Link from 'next/link';

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans pt-40 pb-20 px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-16 border-r-4 border-[#C5A059] pr-6">السياسات والشروط</h1>
        
        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-bold mb-6 text-[#C5A059]">1. سياسة الاسترجاع والاستبدال (VIP)</h2>
            <p className="text-gray-600 leading-loose text-lg">
              نظراً لطبيعة المنتجات الفاخرة والنادرة التي نقدمها في "شامخ"، فإن سياسة الاسترجاع تخضع لمعايير صارمة لضمان أصالة وجودة القطع لعملائنا. 
              يُسمح بالاسترجاع خلال 3 أيام فقط من تاريخ الاستلام، بشرط أن يكون المنتج في تغليفه الأصلي المغلق بختم الشمع، مع إرفاق جميع شهادات الأصالة. 
              لا نقبل استرجاع العطور إذا تم فتحها لأسباب صحية.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-[#C5A059]">2. التوصيل المصفح والمروحيات</h2>
            <p className="text-gray-600 leading-loose text-lg">
              بالنسبة للمقتنيات التي تتجاوز قيمتها 100,000 ريال، نقدم خدمة "التوصيل المصفح" مجاناً لضمان وصول القطعة بأمان تام عبر حراس أمنيين.
              للعملاء الـ VIP في الرياض وجدة ودبي، تتوفر خدمة التوصيل المباشر في غضون ساعتين.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-[#C5A059]">3. الخصوصية والسرية التامة (Zero Trust)</h2>
            <p className="text-gray-600 leading-loose text-lg">
              جميع مشترياتك ومعلوماتك محمية بأنظمة التشفير العسكرية. نحن نعتمد سياسة (Zero Trust) لضمان أن بيانات بطاقاتك وسجل مشترياتك الفاخرة لا يتم تخزينها أبداً على خوادم عامة. 
              هويتك كأحد عملاء النخبة تظل سراً محفوظاً.
            </p>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-gray-200">
          <Link href="/" className="text-[#C5A059] font-bold hover:text-black transition-colors">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
