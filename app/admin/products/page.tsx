'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Plus, Search, Trash2, Edit3, X, Check,
  ChevronDown, BarChart2, RefreshCw, Star, Package, Globe,
  Loader2, AlertCircle
} from 'lucide-react';

const CATEGORIES = [
  { slug: 'exclusive-perfumes', label: 'عطور حصرية' },
  { slug: 'elite-watches',      label: 'ساعات النخبة' },
  { slug: 'rare-jewelry',       label: 'مجوهرات ونوادر' },
  { slug: 'limited-edition',    label: 'إصدار محدود' }
];

const emptyForm = {
  title: '',
  title_ar: '',
  slug: '',
  description: '',
  description_ar: '',
  category_id: 'exclusive-perfumes',
  image: '',
  price: '',
  compare_at_price: '',
  cost_price: '',
  stock_quantity: '',
  sku: '',
};

interface Product {
  id: string;
  title: string;
  title_ar?: string;
  slug: string;
  description?: string;
  description_ar?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  category_id?: string;
  stock_quantity: number;
  images?: string[];
  sku?: string;
  is_featured?: boolean;
  sales_count?: number;
  avg_rating?: number;
  is_dropshipped?: boolean;
  created_at: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<'supabase' | 'mock'>('mock');
  
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState('all');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products?limit=100', {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setDataMode(data.mode === 'supabase' ? 'supabase' : 'mock');
      } else {
        throw new Error('فشل تحميل المنتجات من الخادم');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
      setDataMode('mock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    const matchSearch = !search ||
      p.title.toLowerCase().includes(term) ||
      (p.title_ar && p.title_ar.toLowerCase().includes(term)) ||
      p.slug.toLowerCase().includes(term);
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    return matchSearch && matchCat;
  });

  const openNewForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setForm({
      title: product.title,
      title_ar: product.title_ar || '',
      slug: product.slug,
      description: product.description || '',
      description_ar: product.description_ar || '',
      category_id: product.category_id || 'exclusive-perfumes',
      image: product.images?.[0] || '',
      price: String(product.price),
      compare_at_price: String(product.compare_at_price || ''),
      cost_price: String(product.cost_price || ''),
      stock_quantity: String(product.stock_quantity || 0),
      sku: product.sku || '',
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title,
      title_ar: form.title_ar || undefined,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-'),
      description: form.description || undefined,
      description_ar: form.description_ar || undefined,
      category_id: form.category_id,
      images: [form.image || 'https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=800&q=80'],
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
      cost_price: form.cost_price ? Number(form.cost_price) : undefined,
      stock_quantity: Number(form.stock_quantity || 0),
      sku: form.sku || undefined,
    };

    try {
      const url = editingId ? `/api/products` : '/api/products';
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { id: editingId, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': JSON.stringify({ name: 'المشرف', role: 'SUPER_ADMIN' }),
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await loadProducts();
        setShowForm(false);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'فشل حفظ المنتج');
      }
    } catch {
      // Fallback optimistic update for mockup mode
      if (editingId) {
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...payload, id: editingId } as Product : p));
      } else {
        const newProduct: Product = {
          ...payload,
          id: `new-${Date.now()}`,
          created_at: new Date().toISOString(),
        } as Product;
        setProducts(prev => [newProduct, ...prev]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-user': JSON.stringify({ name: 'المشرف', role: 'SUPER_ADMIN' }),
        }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'فشل حذف المنتج');
      }
    } catch {
      setProducts(prev => prev.filter(p => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryLabel = (slug?: string) => {
    return CATEGORIES.find(c => c.slug === slug)?.label || slug || 'عطور حصرية';
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-gray-900 font-sans pt-12 pb-24 px-6 md:px-10" dir="rtl">

      {/* BG Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#C5A059]/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="max-w-[1400px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <ShoppingBag className="text-[#C5A059]" size={32} />
            إدارة <span className="text-[#C5A059] font-light">الكتالوج الفاخر</span>
          </h1>
          <p className="text-[10px] text-gray-500 mt-1 tracking-widest uppercase font-mono">
            SHAMIKH PRODUCT CATALOG CONTROL — {products.length} ITEMS
            <span className={`mr-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${dataMode === 'supabase' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {dataMode === 'supabase' ? '🟢 Supabase Live' : '🟡 Mock Mode'}
            </span>
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#b08d4b] text-white font-bold px-6 py-3 rounded-full text-xs transition-all shadow-sm"
        >
          <Plus size={16} /> إضافة منتج جديد
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المنتجات', value: products.length, icon: ShoppingBag, color: 'text-gray-700' },
            { label: 'منتجات دروبشيب', value: products.filter(p => p.is_dropshipped).length, icon: Globe, color: 'text-blue-500' },
            { label: 'متوسط السعر', value: `${Math.round(products.reduce((s, p) => s + p.price, 0) / (products.length || 1)).toLocaleString()} ر.س`, icon: BarChart2, color: 'text-green-600' },
            { label: 'الأعلى تقييماً', value: products.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))[0]?.title_ar || products[0]?.title || '—', icon: Star, color: 'text-yellow-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <stat.icon className={stat.color} size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate max-w-[150px]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="ابحث باسم المنتج أو الكود أو الرابط المختصر..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-gray-900 text-xs focus:outline-none focus:border-[#C5A059] transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border ${
                selectedCat === 'all' ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'bg-gray-50 text-gray-500 hover:bg-white border-gray-200'
              }`}
            >
              الكل
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCat(cat.slug)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border ${
                  selectedCat === cat.slug ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'bg-gray-50 text-gray-500 hover:bg-white border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-[#C5A059]" size={16} />
              كتالوج المنتجات المعروضة ({filtered.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 size={32} className="animate-spin mr-3" />
              <span className="text-sm">جاري تحميل كتالوج المعرض...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingBag className="mx-auto mb-4 opacity-30" size={48} />
              <p className="text-xs">لا توجد منتجات مطابقة لفلترة البحث.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 bg-gray-50/30">
                    <th className="pb-3 pt-4 px-6 font-bold text-[10px] uppercase">المنتج</th>
                    <th className="pb-3 pt-4 px-4 font-bold text-[10px] uppercase">القسم</th>
                    <th className="pb-3 pt-4 px-4 font-bold text-[10px] uppercase">السعر</th>
                    <th className="pb-3 pt-4 px-4 font-bold text-[10px] uppercase">المخزون</th>
                    <th className="pb-3 pt-4 px-4 font-bold text-[10px] uppercase">المبيعات</th>
                    <th className="pb-3 pt-4 px-4 font-bold text-[10px] uppercase">النوع</th>
                    <th className="pb-3 pt-4 px-6 font-bold text-[10px] uppercase">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: deletingId === product.id ? 0 : 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-white">
                            <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=200&q=80'} alt={product.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 line-clamp-1">{product.title_ar || product.title}</p>
                            <p className="text-[9px] text-gray-500 font-mono mt-0.5">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                          {getCategoryLabel(product.category_id)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-black text-gray-900">{product.price.toLocaleString()}</span>
                        <span className="text-gray-500 text-[9px] mr-1">ر.س</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-bold ${product.stock_quantity <= 5 ? 'text-red-500' : product.stock_quantity <= 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400 font-mono">{product.sales_count || 0}</td>
                      <td className="py-4 px-4">
                        {product.is_dropshipped ? (
                          <span className="bg-blue-50 text-blue-500 border border-blue-200 px-2 py-0.5 rounded-full text-[9px] font-bold">دروبشيب</span>
                        ) : (
                          <span className="bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-bold">متجر</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEditForm(product)}
                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-950 transition-all"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 flex items-center justify-center text-gray-500 hover:text-red-500 transition-all"
                          >
                            {deletingId === product.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? 'تعديل بيانات الكتالوج' : 'إدراج منتج جديد للكتالوج'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-950 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">اسم المنتج (English)</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Oud Perfume"
                      value={form.title}
                      required
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">اسم المنتج (عربي)</label>
                    <input
                      type="text"
                      placeholder="مثال: عطر العود الملكي"
                      value={form.title_ar}
                      onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Slug (رابط فريد)</label>
                    <input
                      type="text"
                      placeholder="e.g. royal-oud-perfume"
                      value={form.slug}
                      required
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">SKU (رمز المخزن)</label>
                    <input
                      type="text"
                      placeholder="e.g. SHM-OUD-01"
                      value={form.sku}
                      onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">رابط الصورة الرئيسية</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">القسم الفاخر</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                  >
                    {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">الوصف (English)</label>
                    <textarea
                      placeholder="Luxury English description..."
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">الوصف (عربي)</label>
                    <textarea
                      placeholder="الوصف الفاخر باللغة العربية..."
                      value={form.description_ar}
                      onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))}
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059] resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1">السعر (ر.س)</label>
                    <input
                      type="number"
                      required
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-2 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1">السعر القديم</label>
                    <input
                      type="number"
                      value={form.compare_at_price}
                      onChange={e => setForm(f => ({ ...f, compare_at_price: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-2 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1">سعر التكلفة</label>
                    <input
                      type="number"
                      value={form.cost_price}
                      onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-2 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1">المخزون</label>
                    <input
                      type="number"
                      value={form.stock_quantity}
                      onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-2 text-xs text-gray-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#C5A059] hover:bg-[#b08d4b] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التغييرات' : 'إدراج للمتجر'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
