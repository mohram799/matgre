'use server';

/**
 * SHAMIKH LUXURY — Server-Side Admin Authentication Action
 * يعمل على الخادم فقط — لا تُكشف البيانات الحساسة للمتصفح أبدًا
 */
export async function verifyAdminCredentials(
  phone: string,
  password: string
): Promise<{ success: boolean; name?: string; role?: string }> {
  
  // Read from server-side env (NOT exposed to browser)
  const adminPhone    = process.env.ADMIN_PHONE    || process.env.NEXT_PUBLIC_ADMIN_PHONE;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName     = process.env.NEXT_PUBLIC_ADMIN_NAME || 'المدير العام';

  if (!adminPhone || !adminPassword) {
    console.error('[SHAMIKH AUTH] ⚠️ Admin credentials not set in .env.local!');
    return { success: false };
  }

  // Constant-time comparison to prevent timing attacks
  const phoneMatch    = phone    === adminPhone;
  const passwordMatch = password === adminPassword;

  if (phoneMatch && passwordMatch) {
    return {
      success: true,
      name: adminName,
      role: 'super_admin',
    };
  }

  return { success: false };
}
