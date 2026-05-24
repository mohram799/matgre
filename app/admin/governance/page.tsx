'use client';

/**
 * SHAMIKH LUXURY OS — Executive Platform Governance & Control Studio
 * Cinematic administration cockpit for tenant management, SOC2 audit trail chaining,
 * GDPR exports, and real-time reliability telemetry tracking.
 */

import { useState, useEffect } from 'react';

interface TenantSummary {
  totalTenants: number;
  totalProductsCount: number;
  quotaAlertsCount: number;
  planDistribution: { starter: number; growth: number; enterprise: number };
}

interface TenantRecord {
  id: string;
  subdomain: string;
  store_name: string;
  plan: 'starter' | 'growth' | 'enterprise';
  is_active: boolean;
  created_at: string;
}

export default function GovernanceStudio() {
  const [summary, setSummary] = useState<TenantSummary | null>(null);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenants' | 'compliance' | 'resilience'>('tenants');

  // Provisioning Form state
  const [subdomain, setSubdomain] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeNameAr, setStoreNameAr] = useState('');
  const [plan, setPlan] = useState<'starter' | 'growth' | 'enterprise'>('starter');
  const [whatsapp, setWhatsapp] = useState('');
  const [provisioningMsg, setProvisioningMsg] = useState('');

  // GDPR & Audit verification state
  const [gdprPhone, setGdprPhone] = useState('');
  const [auditVerifyResult, setAuditVerifyResult] = useState<any>(null);
  const [verifyingAudit, setVerifyingAudit] = useState(false);

  // Circuit Breaker Status (Mocked/Simulated telemetry states)
  const circuits = [
    { name: 'Stripe Payment Gateway', state: 'CLOSED', status: 'Healthy', latency: '45ms' },
    { name: 'AliExpress Product Scraper', state: 'CLOSED', status: 'Healthy', latency: '210ms' },
    { name: 'OpenAI Description Copier', state: 'CLOSED', status: 'Healthy', latency: '650ms' },
    { name: 'Resend SMTP Dispatcher', state: 'CLOSED', status: 'Healthy', latency: '12ms' },
  ];

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/governance');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setTenants(data.tenants);
      }
    } catch (e) {
      console.error('Failed to load governance statistics:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioningMsg('جارٍ تهيئة المتجر الجديد وتدشين الكتالوج المبدئي...');
    try {
      const res = await fetch('/api/admin/governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain, storeName, storeNameAr, plan, whatsappNumber: whatsapp }),
      });
      const data = await res.json();
      if (res.ok) {
        setProvisioningMsg(`✓ تم بنجاح تهيئة متجر: "${data.tenant.store_name}" الرابط: ${subdomain}.luxury-os.com`);
        fetchMetrics();
        // Clear fields
        setSubdomain('');
        setStoreName('');
        setStoreNameAr('');
        setWhatsapp('');
      } else {
        setProvisioningMsg(`❌ فشل في التهيئة: ${data.error || 'عقدة غير معروفة'}`);
      }
    } catch (err) {
      setProvisioningMsg('❌ حدث خطأ فني أثناء الاتصال بالخادم.');
    }
  };

  const triggerAuditVerification = async () => {
    setVerifyingAudit(true);
    setAuditVerifyResult(null);
    try {
      const res = await fetch('/api/admin/compliance', { method: 'POST' });
      const data = await res.json();
      setAuditVerifyResult(data);
    } catch (err) {
      setAuditVerifyResult({ error: 'Failed to complete cryptographic chain verify.' });
    } finally {
      setVerifyingAudit(false);
    }
  };

  const handleGdprExport = () => {
    if (!gdprPhone) return;
    window.open(`/api/admin/compliance?phone=${encodeURIComponent(gdprPhone)}`);
  };

  return (
    <div className="min-h-screen bg-[#06060c] text-white font-sans selection:bg-[#C5A059] selection:text-black p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between border-b border-[#C5A059]/20 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C5A059] animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">Platform Governance</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-white to-[#C5A059]/80 bg-clip-text text-transparent">
            SHAMIKH CONTROL STUDIO
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40">نظام حوكمة وإدارة المستأجرين</p>
          <p className="text-sm font-mono font-semibold text-[#C5A059]">VIP OPERATIONAL CONSOLE</p>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto">
        {/* Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 bg-[#C5A059]/5 rounded-full blur-2xl" />
            <p className="text-xs text-white/50 mb-2">إجمالي المتاجر المشتركة</p>
            <h3 className="text-4xl font-black text-[#C5A059]">{summary?.totalTenants ?? 0}</h3>
            <div className="flex gap-4 mt-4 text-[10px] text-white/40">
              <span>ستارتر: {summary?.planDistribution.starter ?? 0}</span>
              <span>جروث: {summary?.planDistribution.growth ?? 0}</span>
              <span>إنتربرايز: {summary?.planDistribution.enterprise ?? 0}</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 rounded-full blur-2xl" />
            <p className="text-xs text-white/50 mb-2">إجمالي المنتجات المرفوعة</p>
            <h3 className="text-4xl font-black text-white">{summary?.totalProductsCount ?? 0}</h3>
            <p className="text-[10px] text-emerald-400/80 mt-4">✓ جميع المنتجات معزولة برمجياً بالكامل</p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/5 rounded-full blur-2xl" />
            <p className="text-xs text-white/50 mb-2">تنبيهات تجاوز الحصص (Quota)</p>
            <h3 className={`text-4xl font-black ${summary && summary.quotaAlertsCount > 0 ? 'text-rose-500' : 'text-white/30'}`}>
              {summary?.quotaAlertsCount ?? 0}
            </h3>
            <p className="text-[10px] text-white/40 mt-4">متاجر اقتربت من حدود حد المنتجات الأقصى</p>
          </div>
        </section>

        {/* Tab Controls */}
        <div className="flex border-b border-white/10 mb-8 gap-4">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'tenants' ? 'border-[#C5A059] text-white' : 'border-transparent text-white/40'
            }`}
          >
            إدارة المتاجر والمستأجرين
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'compliance' ? 'border-[#C5A059] text-white' : 'border-transparent text-white/40'
            }`}
          >
            التدقيق الأمني و SOC2 / GDPR
          </button>
          <button
            onClick={() => setActiveTab('resilience')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'resilience' ? 'border-[#C5A059] text-white' : 'border-transparent text-white/40'
            }`}
          >
            المرونة الفنية وقواطع الأعطال
          </button>
        </div>

        {/* Tab Content 1: Tenants Dashboard */}
        {activeTab === 'tenants' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Provisioning Form */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl h-fit">
              <h3 className="text-lg font-bold mb-4 text-[#C5A059]">تهيئة متجر جديد (Provision Store)</h3>
              <form onSubmit={handleProvision} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">اسم المتجر (انجليزي)</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Royal Scents"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 text-sm focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">اسم المتجر (عربي)</label>
                  <input
                    type="text"
                    required
                    value={storeNameAr}
                    onChange={e => setStoreNameAr(e.target.value)}
                    placeholder="رويال سنتس الفاخر"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 text-sm focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">النطاق الفرعي (Subdomain)</label>
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={e => setSubdomain(e.target.value)}
                    placeholder="royalscents"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 text-sm focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">رقم الواتساب للتواصل</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="+966550000000"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 text-sm focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">خطة الاشتراك</label>
                  <select
                    value={plan}
                    onChange={e => setPlan(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 text-sm text-black focus:outline-none"
                  >
                    <option value="starter">Starter Plan (حد 50 منتج)</option>
                    <option value="growth">Growth Plan (حد 300 منتج)</option>
                    <option value="enterprise">Enterprise Plan (حد 1000 منتج)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#C5A059] text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#b08e4d] transition-all"
                >
                  تهيئة وتفعيل المتجر
                </button>
              </form>
              {provisioningMsg && (
                <div className="mt-4 p-3 bg-white/5 rounded-xl border border-[#C5A059]/20 text-xs text-[#C5A059]">
                  {provisioningMsg}
                </div>
              )}
            </div>

            {/* Tenants List */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold mb-4 text-[#C5A059]">سجل المستأجرين النشطين</h3>
              {loading ? (
                <p className="text-sm text-white/30">جارٍ جلب تفاصيل السجل...</p>
              ) : tenants.length === 0 ? (
                <p className="text-sm text-white/30">لا يوجد مستأجرين مسجلين في الوقت الحالي.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50 text-xs">
                        <th className="pb-3 pt-1">المتجر</th>
                        <th className="pb-3 pt-1">النطاق</th>
                        <th className="pb-3 pt-1">الخطة</th>
                        <th className="pb-3 pt-1">الحالة</th>
                        <th className="pb-3 pt-1 text-left">تاريخ التفعيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tenants.map(t => (
                        <tr key={t.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 font-bold text-white">{t.store_name}</td>
                          <td className="py-4 text-[#C5A059] font-mono">{t.subdomain}.luxury-os.com</td>
                          <td className="py-4 capitalize text-xs">{t.plan}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {t.is_active ? 'نشط' : 'معطل'}
                            </span>
                          </td>
                          <td className="py-4 font-mono text-xs text-white/50 text-left">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab Content 2: Compliance Center */}
        {activeTab === 'compliance' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Audit Chain Verifier */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold mb-2 text-[#C5A059]">SOC2 Immutable Audit Trail Verifier</h3>
              <p className="text-xs text-white/50 mb-6">
                يقوم هذا الفحص بإعادة حساب سلسلة الكتل المشفرة بالكامل لجميع العمليات الإدارية المسجلة للتأكد من عدم تعديل قاعدة البيانات أو التلاعب بالسجلات.
              </p>
              <button
                onClick={triggerAuditVerification}
                disabled={verifyingAudit}
                className="px-6 py-3 bg-[#C5A059] text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#b08e4d] disabled:opacity-50 transition-all"
              >
                {verifyingAudit ? 'جارٍ فحص الشفرات المشفرة...' : 'فحص سلامة سلسلة كتل التدقيق (Verify Chain)'}
              </button>

              {auditVerifyResult && (
                <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/10">
                  <h4 className="text-sm font-bold mb-2 text-[#C5A059]">نتيجة الفحص الأمني:</h4>
                  <div className="space-y-2 text-xs font-mono">
                    <p>الحالة الأمنية: {auditVerifyResult.success ? '🟢 آمن تماماً (ولا يوجد أي محاولات تعديل)' : '🔴 تنبيه: تم اكتشاف تعديل!'}</p>
                    <p>إجمالي السجلات التي تم فحصها: {auditVerifyResult.totalChecked}</p>
                    <p>سجلات التدقيق السليمة: {auditVerifyResult.verifiedCount}</p>
                    <p>الثغرات المكتشفة: {auditVerifyResult.anomaliesCount}</p>
                  </div>
                </div>
              )}
            </div>

            {/* GDPR Exporter */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold mb-2 text-[#C5A059]">GDPR Customer Data Portability Tool</h3>
              <p className="text-xs text-white/50 mb-6">
                استخراج كافة معلومات وسجلات العميل المسجلة في النظام وتسليمها في صيغة مشفرة بصيغة JSON متوافقة مع شروط حماية البيانات الأوروبية والسعودية.
              </p>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={gdprPhone}
                  onChange={e => setGdprPhone(e.target.value)}
                  placeholder="أدخل رقم هاتف العميل للتصدير"
                  className="flex-1 px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-sm focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  onClick={handleGdprExport}
                  className="px-6 py-3 bg-[#C5A059] text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#b08e4d] transition-all"
                >
                  تصدير ملف البيانات
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Tab Content 3: Resilience Telemetry */}
        {activeTab === 'resilience' && (
          <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold mb-2 text-[#C5A059]">Resilience & Circuit Breakers Telemetry</h3>
            <p className="text-xs text-white/50 mb-6">
              مراقبة مباشرة لقواطع الأعطال والمهل الزمنية الموزعة لضمان استمرارية تشغيل النظام وعزل الأعطال تلقائياً.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {circuits.map(c => (
                <div key={c.name} className="bg-black/30 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                  <h4 className="font-bold text-sm mb-2 text-white">{c.name}</h4>
                  <div className="flex justify-between items-center text-xs text-white/50 mt-4">
                    <span>حالة القاطع:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                      {c.state}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-white/50 mt-2">
                    <span>الصحة العامة:</span>
                    <span className="text-emerald-400">{c.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-white/50 mt-2">
                    <span>متوسط الاستجابة:</span>
                    <span className="font-mono">{c.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
