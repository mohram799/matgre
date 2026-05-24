/**
 * SHAMIKH LUXURY OS — Zod Validation Schemas
 * Central repository for all API input validation schemas
 */

import { z } from 'zod';

// ─── Common Primitives ────────────────────────────────────────────────────────

export const phoneSchema = z
  .string()
  .min(10, 'رقم الهاتف يجب أن يكون على الأقل 10 أرقام')
  .max(15, 'رقم الهاتف يجب ألا يتجاوز 15 رقمًا');

export const passwordSchema = z
  .string()
  .min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
  .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم');

export const uuidSchema = z.string().uuid('معرّف غير صالح');

export const positiveIntSchema = z.number().int().positive();

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  phone: z.string().min(10, 'رقم الهاتف يجب أن يكون على الأقل 10 أرقام').max(15, 'رقم الهاتف يجب ألا يتجاوز 15 رقمًا'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين').max(100),
  phone: phoneSchema,
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmNewPassword'],
});

// ─── Product Schemas ──────────────────────────────────────────────────────────

export const productCreateSchema = z.object({
  title: z.string().min(3, 'اسم المنتج يجب أن يكون على الأقل 3 أحرف').max(255),
  title_ar: z.string().min(3).max(255).optional(),
  description: z.string().max(5000).optional(),
  description_ar: z.string().max(5000).optional(),
  price: z.number().positive('السعر يجب أن يكون أكبر من صفر'),
  compare_at_price: z.number().positive().optional(),
  cost_price: z.number().positive().optional(),
  category_id: z.string().max(100).optional(),
  sku: z.string().max(100).optional(),
  stock_quantity: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).min(1, 'يجب إضافة صورة واحدة على الأقل'),
  specs: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  weight_kg: z.number().positive().optional(),
  is_featured: z.boolean().default(false),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productSchema = z.object({
  title: z.string(),
  price: z.number(),
  images: z.array(z.string().url()),
  specs: z.record(z.string(), z.string()),
});

export const productFilterSchema = z.object({
  category: z.enum(['exclusive-perfumes', 'rare-jewelry', 'limited-edition']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'popular']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  featured: z.coerce.boolean().optional(),
});

// ─── Cart Schemas ─────────────────────────────────────────────────────────────

export const cartAddSchema = z.object({
  product_id: uuidSchema,
  quantity: z.number().int().min(1).max(99),
  variant_id: uuidSchema.optional(),
});

export const cartUpdateSchema = z.object({
  cart_item_id: uuidSchema,
  quantity: z.number().int().min(0).max(99), // 0 = remove
});

// ─── Order Schemas ────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(100).default('المملكة العربية السعودية'),
});

export const orderItemSchema = z.object({
  product_id: z.string().min(1),
  title: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().min(1),
  image: z.string().url().optional(),
});

export const orderCreateSchema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_phone: z.string().min(10).max(15),
  customer_email: z.string().email().optional().or(z.literal('')),
  shipping_address: addressSchema,
  items: z.array(orderItemSchema).min(1, 'يجب وجود منتج واحد على الأقل'),
  coupon_code: z.string().max(50).optional(),
  vip_tier: z.enum(['guest', 'bronze', 'silver', 'gold', 'diamond']).default('guest'),
  notes: z.string().max(500).optional(),
  stripe_payment_intent: z.string().optional(),
});

export const checkoutSchema = z.object({
  shipping_address: addressSchema,
  payment_method: z.enum(['stripe', 'cod', 'bank_transfer']),
  coupon_code: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

// ─── Review Schemas ───────────────────────────────────────────────────────────

export const reviewCreateSchema = z.object({
  product_id: uuidSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(10, 'التقييم يجب أن يكون على الأقل 10 أحرف').max(2000),
});

// ─── Coupon Schemas ───────────────────────────────────────────────────────────

export const couponValidateSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  cart_total: z.number().positive(),
});

export const couponCreateSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive(),
  min_order_value: z.number().min(0).default(0),
  max_uses: z.number().int().positive().optional(),
  expires_at: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
});

// ─── Dropshipping Schemas ─────────────────────────────────────────────────────

export const dropshippingImportSchema = z.object({
  url: z.string().url('الرابط غير صالح'),
  category: z.enum(['exclusive-perfumes', 'rare-jewelry', 'limited-edition']).optional(),
  markup_percentage: z.number().min(0).max(500).default(100),
});

export const supplierSyncSchema = z.object({
  product_id: uuidSchema,
  supplier_url: z.string().url(),
  sync_price: z.boolean().default(true),
  sync_inventory: z.boolean().default(true),
});

// ─── Admin / User Management Schemas ─────────────────────────────────────────

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'WAREHOUSE', 'USER']).optional(),
  is_active: z.boolean().optional(),
});

// ─── Pagination Schema ────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse and validate request body with a Zod schema.
 * Returns a NextResponse on validation failure — callers must do:
 *   const body = await validateBody(req, schema);
 *   if (body instanceof Response) return body;
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<T | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'جسم الطلب ليس JSON صالحاً' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return new Response(
      JSON.stringify({ error: 'بيانات غير صالحة', details }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return result.data;
}

/**
 * Parse and validate URL query params with a Zod schema.
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
): T {
  const raw: Record<string, string> = {};
  searchParams.forEach((v, k) => { raw[k] = v; });
  return schema.parse(raw);
}
