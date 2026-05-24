/**
 * SHAMIKH LUXURY OS — Shared Admin Authorization Utility
 *
 * Checks admin auth via (in priority order):
 *  1. x-admin-user header  — injected by middleware after JWT verification
 *  2. x-admin-secret header — for test/API clients (matches env var)
 *  3. shamikh_access_token cookie — direct JWT verification fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './auth';

// Secret shared with test clients; override via env var in production
const ADMIN_TEST_SECRET =
  process.env.ADMIN_TEST_SECRET || 'shamikh_master_security_2026';

export interface AdminPayload {
  phone?: string;
  name?: string;
  role?: string;
}

/**
 * Returns AdminPayload if the request carries valid admin credentials,
 * or null if not authorized.
 */
export async function getAdminPayload(
  req: NextRequest
): Promise<AdminPayload | null> {
  // 1. x-admin-user header (set by middleware on request headers)
  const adminUserHeader = req.headers.get('x-admin-user');
  if (adminUserHeader) {
    try {
      const parsed = JSON.parse(adminUserHeader) as AdminPayload;
      if (parsed && (parsed.role || parsed.phone)) return parsed;
    } catch {
      // malformed header — fall through
    }
  }

  // 2. x-admin-secret header (used by the test sandbox)
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret && adminSecret === ADMIN_TEST_SECRET) {
    return { name: 'Test Admin', role: 'SUPER_ADMIN' };
  }

  // 3. Direct JWT cookie verification (fallback)
  const token = req.cookies.get('shamikh_access_token')?.value;
  if (token) {
    try {
      const payload = await verifyJWT(token);
      if (payload) return payload as AdminPayload;
    } catch {
      // invalid token — fall through
    }
  }

  return null;
}

/**
 * Returns a NextResponse 401 if not authorized, or null if the request is
 * a valid admin request. Use like:
 *
 *   const deny = await requireAdmin(req);
 *   if (deny) return deny;
 */
export async function requireAdmin(
  req: NextRequest
): Promise<NextResponse | null> {
  const payload = await getAdminPayload(req);
  if (!payload) {
    return NextResponse.json(
      { error: 'غير مصرح — يجب تسجيل الدخول كمدير' },
      { status: 401 }
    );
  }
  return null;
}
