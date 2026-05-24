import { NextRequest, NextResponse } from 'next/server';
import { getCsrfToken, buildCsrfCookieHeader } from '@/lib/csrf';

/**
 * GET /api/auth/csrf
 * Returns a CSRF token and sets it as an HttpOnly cookie
 */
export async function GET(req: NextRequest) {
  const token = getCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  response.headers.set('Set-Cookie', buildCsrfCookieHeader(token));
  
  // Set cache control to avoid caching the token
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  
  return response;
}
