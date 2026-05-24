'use client';

export type ProductSpecs = {
  [key: string]: string | number | boolean;
};

export interface Product {
  id: string | number;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number;
  costPrice?: number;
  description: string;
  category: string;
  img: string;
  images: string[];
  sales: number;
  rating: number;
  reviews: number;
  date: string;
  stock: number;
  isImported?: boolean;
  supplierUrl?: string;
  supplierName?: string;
  specs?: ProductSpecs;
}

export interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'FAILED' | string;
  shippingAddress: {
    fullName: string;
    phone: string;
    country: string;
    city: string;
    addressLine: string;
  };
  isDropship?: boolean;
  supplierName?: string;
  supplierOrderId?: string;
  trackingNumber?: string;
}

export interface SupplierSettings {
  aliexpressConnected: boolean;
  aliexpressKey: string;
  tagerConnected: boolean;
  tagerKey: string;
  marginMultiplier: number;
  luxuryPremiumFee: number;
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'oud-syoufi',
    name: 'دهن عود سيوفي معتق',
    slug: 'oud-syoufi',
    price: 2500,
    description: 'تحفة عطرية لا تتكرر. تم استخلاصه من غابات أندونيسيا المعزولة، وتم تعتيقه تحت الأرض لمدة 15 عاماً ليمنحك رائحة لا تُنسى وثباتاً يدوم طويلاً.',
    category: 'عطور حصرية',
    img: 'https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=600&q=70',
    images: [
      'https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=1200&q=100',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=90',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=90'
    ],
    sales: 1240,
    rating: 4.9,
    reviews: 342,
    date: '2026-05-10',
    stock: 3
  },
  {
    id: 'omega-classic',
    name: 'ساعة أوميغا كلاسيك',
    slug: 'omega-classic',
    price: 34000,
    description: 'ساعة سويسرية فاخرة بهيكل مرصع بالذهب الأبيض عيار 18 قيراط وحزام جلدي تمساح فاخر. مجهزة بحركة كرونومتر أوتوماتيكية معتمدة لمقاومة الجاذبية.',
    category: 'ساعات النخبة',
    img: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=70',
    images: [
      'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=100'
    ],
    sales: 50,
    rating: 5.0,
    reviews: 12,
    date: '2026-04-20',
    stock: 5
  },
  {
    id: 'hermes-bag',
    name: 'شنطة هيرميس الأصلية',
    slug: 'hermes-bag',
    price: 85000,
    description: 'شنطة هيرميس بيركين النادرة، مصنوعة يدوياً بالكامل من جلد التمساح النيلي النادر، ومزينة بقفل وإبزيم من الذهب الخالص عيار 18 قيراط.',
    category: 'مجوهرات ونوادر',
    img: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=70',
    images: [
      'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=1200&q=100'
    ],
    sales: 15,
    rating: 4.8,
    reviews: 5,
    date: '2026-01-05',
    stock: 1
  },
  {
    id: 'victoria-diamond',
    name: 'طقم ألماس فيكتوري',
    slug: 'victoria-diamond',
    price: 120000,
    description: 'طقم ملكي مذهل يشتمل على قلادة وأقراط وخاتم، مرصع بقطع ألماس فيكتورية نادرة عالية النقاء تزن إجمالياً 12.5 قيراط مثبتة على البلاتين الأصيل.',
    category: 'مجوهرات ونوادر',
    img: 'https://images.unsplash.com/photo-1599643478514-4a4e09d52f78?w=600&q=70',
    images: [
      'https://images.unsplash.com/photo-1599643478514-4a4e09d52f78?w=1200&q=100'
    ],
    sales: 3,
    rating: 5.0,
    reviews: 1,
    date: '2026-05-01',
    stock: 2
  },
  {
    id: 'oud-blue',
    name: 'عطر العود الأزرق',
    slug: 'oud-blue',
    price: 1200,
    description: 'عطر العود الأزرق النادر بتركيز زيت عطري نقي 100٪. يتميز بنفحات ساحرة من الهيل الهندي والزعفران الإيراني الفاخر مغلفة بعبق خشب الصندل المعتق.',
    category: 'عطور حصرية',
    img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=70',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=100'
    ],
    sales: 3450,
    rating: 4.7,
    reviews: 890,
    date: '2025-11-20',
    stock: 20
  },
  {
    id: 'montblanc-pen',
    name: 'قلم مونت بلانك',
    slug: 'montblanc-pen',
    price: 4500,
    description: 'إصدار محدود من قلم مونت بلانك الفاخر، برأس مطلي بالذهب ومزين بنقوش مجهرية كلاسيكية مع شهادة حصرية للأصالة وضمان مدى الحياة.',
    category: 'هدايا كبار الشخصيات',
    img: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600&q=70',
    images: [
      'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=1200&q=100'
    ],
    sales: 800,
    rating: 4.9,
    reviews: 120,
    date: '2026-03-15',
    stock: 12
  },
  {
    id: 'gold-bracelet',
    name: 'إسوارة ذهب عيار 21',
    slug: 'gold-bracelet',
    price: 8500,
    oldPrice: 10000,
    description: 'إسوارة ذهب عيار 21 صُنعت يدوياً بأيادي أمهر صاغة المذهب الملكي بالرياض، تبرز لمعانها النقي وتضفي لمسة فخامة تناسب الحفلات الحصرية.',
    category: 'إصدار محدود',
    img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=70',
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=100'
    ],
    sales: 124,
    rating: 4.8,
    reviews: 33,
    date: '2026-02-18',
    stock: 10
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ORD-9921',
    date: '2026-05-21',
    items: [
      {
        id: 'oud-syoufi',
        name: 'دهن عود سيوفي معتق',
        price: 2500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=600&q=70',
        category: 'عطور حصرية'
      }
    ],
    totalAmount: 2500,
    status: 'قيد التغليف اليدوي',
    shippingAddress: {
      fullName: 'محمد آل سعود',
      phone: '+966 50 123 4567',
      country: 'المملكة العربية السعودية',
      city: 'الرياض',
      addressLine: 'طريق الملك فهد، حي النخيل، برج شامي رقم 4'
    }
  },
  {
    id: 'ORD-8810',
    date: '2026-04-10',
    items: [
      {
        id: 'omega-classic',
        name: 'ساعة أوميغا كلاسيك',
        price: 34000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=70',
        category: 'ساعات النخبة'
      }
    ],
    totalAmount: 34000,
    status: 'تم التوصيل بأمان',
    shippingAddress: {
      fullName: 'محمد آل سعود',
      phone: '+966 50 123 4567',
      country: 'المملكة العربية السعودية',
      city: 'الرياض',
      addressLine: 'طريق الملك فهد، حي النخيل، برج شامي رقم 4'
    }
  }
];

const DEFAULT_SETTINGS: SupplierSettings = {
  aliexpressConnected: true,
  aliexpressKey: 'ae_live_882910394857_key',
  tagerConnected: true,
  tagerKey: 'tg_sec_sa_99882200_key',
  marginMultiplier: 2.2,
  luxuryPremiumFee: 450
};

// Local storage keys
const KEY_PRODUCTS = 'shamikh_custom_products';
const KEY_ORDERS = 'shamikh_orders';
const KEY_SETTINGS = 'shamikh_supplier_settings';

export const ProductDb = {
  // ─── SUPABASE INTEGRATION CLIENT ───
  getSupabaseCredentials() {
    if (typeof window === 'undefined') return null;
    const mode = localStorage.getItem('shamikh_database_mode');
    const url = localStorage.getItem('shamikh_supabase_url');
    const key = localStorage.getItem('shamikh_supabase_key');
    if (mode === 'supabase' && url && key) {
      return { url, key };
    }
    return null;
  },

  async querySupabase<T>(table: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: any, queryParams: string = ''): Promise<T[] | T | null> {
    const creds = this.getSupabaseCredentials();
    if (!creds) return null;
    try {
      const url = `${creds.url}/rest/v1/${table}${queryParams}`;
      const headers: Record<string, string> = {
        'apikey': creds.key,
        'Authorization': `Bearer ${creds.key}`,
        'Content-Type': 'application/json',
      };
      
      if (method !== 'GET') {
        headers['Prefer'] = 'return=representation';
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`Supabase query error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (e) {
      console.error('Supabase DB connection failed, using local fallback:', e);
      return null;
    }
  },

  // ─── PRODUCTS ───
  getProducts(): Product[] {
    if (typeof window === 'undefined') return DEFAULT_PRODUCTS;
    try {
      const stored = localStorage.getItem(KEY_PRODUCTS);
      const custom: Product[] = stored ? JSON.parse(stored) : [];
      
      // Async Sync in background if Supabase is connected
      this.syncProductsFromSupabase();

      return [...DEFAULT_PRODUCTS, ...custom];
    } catch (e) {
      console.error(e);
      return DEFAULT_PRODUCTS;
    }
  },

  async syncProductsFromSupabase() {
    if (typeof window === 'undefined') return;
    const creds = this.getSupabaseCredentials();
    if (!creds) return;

    try {
      const supabaseProds = await this.querySupabase<any>('products', 'GET');
      if (Array.isArray(supabaseProds)) {
        // Map Supabase products back to Product interface
        const mapped: Product[] = supabaseProds.map(p => ({
          id: p.id,
          name: p.title,
          slug: p.slug,
          price: parseFloat(p.price),
          description: p.description || '',
          category: p.category_name || 'إصدار محدود',
          img: Array.isArray(p.images) && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=70',
          images: Array.isArray(p.images) ? p.images : [],
          sales: p.sales || 15,
          rating: parseFloat(p.rating || '4.8'),
          reviews: p.reviews || 5,
          date: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          stock: p.stock || 10,
          isImported: p.is_dropshipped || false,
          supplierUrl: p.supplier_url,
          supplierName: p.supplier_name
        }));

        localStorage.setItem(KEY_PRODUCTS, JSON.stringify(mapped));
        // Dispatch event so active UIs know to reload without refresh
        window.dispatchEvent(new CustomEvent('shamikh_products_updated'));
      }
    } catch (e) {
      console.error('Error syncing products with Supabase:', e);
    }
  },

  getProductBySlugOrId(idOrSlug: string | number): Product | undefined {
    const all = this.getProducts();
    const strId = String(idOrSlug);
    return all.find(p => String(p.id) === strId || p.slug === strId);
  },

  importProduct(newProd: Omit<Product, 'id' | 'sales' | 'rating' | 'reviews' | 'date'>) {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(KEY_PRODUCTS);
      const custom: Product[] = stored ? JSON.parse(stored) : [];
      
      const product: Product = {
        ...newProd,
        id: `ds-${Date.now()}`,
        sales: Math.floor(Math.random() * 150) + 5,
        rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
        reviews: Math.floor(Math.random() * 40) + 1,
        date: new Date().toISOString().split('T')[0]
      };
      
      custom.push(product);
      localStorage.setItem(KEY_PRODUCTS, JSON.stringify(custom));

      // Push to Supabase if connected
      const creds = this.getSupabaseCredentials();
      if (creds) {
        this.querySupabase('products', 'POST', {
          title: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          cost_price: product.costPrice || 0,
          stock: product.stock,
          is_dropshipped: true,
          supplier_name: product.supplierName,
          supplier_url: product.supplierUrl,
          images: product.images
        });
      }

      return product;
    } catch (e) {
      console.error(e);
    }
  },

  // ─── ORDERS ───
  getOrders(): Order[] {
    if (typeof window === 'undefined') return DEFAULT_ORDERS;
    try {
      const stored = localStorage.getItem(KEY_ORDERS);
      const custom: Order[] = stored ? JSON.parse(stored) : [];
      
      // Async sync from Supabase
      this.syncOrdersFromSupabase();

      return [...custom, ...DEFAULT_ORDERS];
    } catch (e) {
      console.error(e);
      return DEFAULT_ORDERS;
    }
  },

  async syncOrdersFromSupabase() {
    if (typeof window === 'undefined') return;
    const creds = this.getSupabaseCredentials();
    if (!creds) return;

    try {
      const supabaseOrders = await this.querySupabase<any>('orders', 'GET');
      if (Array.isArray(supabaseOrders)) {
        const mapped: Order[] = supabaseOrders.map(o => ({
          id: o.id.substring(0, 8).toUpperCase(), // Keep short clean ID for visual style
          date: o.created_at ? o.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          items: Array.isArray(o.items) ? o.items : [
            {
              id: 'oud-syoufi',
              name: 'دهن عود سيوفي معتق',
              price: parseFloat(o.total_amount),
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1615397323114-17726cb1a826?w=600&q=70',
              category: 'عطور حصرية'
            }
          ],
          totalAmount: parseFloat(o.total_amount),
          status: o.status || 'قيد التغليف اليدوي',
          shippingAddress: {
            fullName: o.customer_name,
            phone: o.customer_phone,
            country: o.country || 'المملكة العربية السعودية',
            city: o.city || 'الرياض',
            addressLine: o.shipping_address
          },
          isDropship: o.is_dropship_order || false,
          supplierName: o.supplier_name,
          supplierOrderId: o.supplier_order_id,
          trackingNumber: o.tracking_number
        }));

        localStorage.setItem(KEY_ORDERS, JSON.stringify(mapped));
        window.dispatchEvent(new CustomEvent('shamikh_orders_updated'));
      }
    } catch (e) {
      console.error('Error syncing orders with Supabase:', e);
    }
  },

  addOrder(items: OrderItem[], totalAmount: number) {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(KEY_ORDERS);
      const custom: Order[] = stored ? JSON.parse(stored) : [];
      
      const hasDropship = items.some(item => {
        const fullP = this.getProductBySlugOrId(item.id);
        return fullP?.isImported;
      });
      
      const mainDropshipItem = items.find(item => {
        const fullP = this.getProductBySlugOrId(item.id);
        return fullP?.isImported;
      });

      const fullProduct = mainDropshipItem ? this.getProductBySlugOrId(mainDropshipItem.id) : null;
      
      const newOrder: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        items,
        totalAmount,
        status: hasDropship ? 'بانتظار تلبية المورد' : 'قيد التغليف اليدوي',
        shippingAddress: {
          fullName: 'محمد آل سعود',
          phone: '+966 50 123 4567',
          country: 'المملكة العربية السعودية',
          city: 'الرياض',
          addressLine: 'طريق الملك فهد، حي النخيل، برج شامي رقم 4'
        },
        isDropship: hasDropship,
        supplierName: fullProduct?.supplierName || undefined
      };
      
      custom.unshift(newOrder);
      localStorage.setItem(KEY_ORDERS, JSON.stringify(custom));

      // Push order to Supabase if connected
      const creds = this.getSupabaseCredentials();
      if (creds) {
        this.querySupabase('orders', 'POST', {
          customer_name: newOrder.shippingAddress.fullName,
          customer_phone: newOrder.shippingAddress.phone,
          shipping_address: newOrder.shippingAddress.addressLine,
          city: newOrder.shippingAddress.city,
          country: newOrder.shippingAddress.country,
          total_amount: newOrder.totalAmount,
          status: newOrder.status,
          is_dropship_order: newOrder.isDropship,
          supplier_name: newOrder.supplierName,
          items: newOrder.items
        });
      }

      return newOrder;
    } catch (e) {
      console.error(e);
    }
  },

  updateOrderFulfillment(id: string, trackingNumber: string, status: string, supplierOrderId?: string) {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(KEY_ORDERS);
      if (!stored) return;
      const custom: Order[] = JSON.parse(stored);
      
      const updated = custom.map(order => {
        if (order.id === id) {
          const finalOrder = {
            ...order,
            status,
            trackingNumber,
            supplierOrderId: supplierOrderId || `AE-${Math.floor(100000 + Math.random() * 900000)}`
          };

          // Async update in Supabase
          const creds = this.getSupabaseCredentials();
          if (creds) {
            // Find order by total amount or fallback fields, since short ID doesn't match primary key UUID
            this.querySupabase('orders', 'PATCH', {
              status,
              tracking_number: trackingNumber,
              supplier_order_id: finalOrder.supplierOrderId
            }, `?customer_phone=eq.${encodeURIComponent(order.shippingAddress.phone)}&total_amount=eq.${order.totalAmount}`);
          }

          return finalOrder;
        }
        return order;
      });
      
      localStorage.setItem(KEY_ORDERS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  },

  // ─── SUPPLIER SETTINGS ───
  getSupplierSettings(): SupplierSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(KEY_SETTINGS);
      if (!stored) {
        localStorage.setItem(KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
      return DEFAULT_SETTINGS;
    }
  },

  updateSupplierSettings(settings: Partial<SupplierSettings>) {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getSupplierSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(KEY_SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error(e);
    }
  }
};

