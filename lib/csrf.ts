import crypto from 'crypto';
import { cookies } from 'next/headers';

const CSRF_COOKIE = 'shamikh_csrf';
const CSRF_HEADER = 'x-csrf-token';

/**
 * Generate a cryptographically secure random CSRF token
 */
export function generateCSRF(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify CSRF tokens with a timing-safe constant time comparison
 */
export function verifyCSRF(cookieToken: string, headerToken: string): boolean {
  if (!cookieToken || !headerToken) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    return false;
  }
}

/**
 * Next.js-specific helper to get or generate the token
 */
export function getCsrfToken(): string {
  const cookieStore = cookies();
  const existing = cookieStore.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  return generateCSRF();
}

/**
 * Build Set-Cookie header for CSRF
 */
export function buildCsrfCookieHeader(token: string, isProduction = process.env.NODE_ENV === 'production'): string {
  const parts = [
    `${CSRF_COOKIE}=${token}`,
    'Path=/',
    'SameSite=Strict',
    'HttpOnly=false', // Must be readable by client JS to set in headers
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

/**
 * Middleware/API route helper to enforce CSRF check
 */
export function enforceCsrf(request: Request): Response | null {
  // Bypass internal worker requests
  if (request.headers.get('x-api-key') === process.env.INTERNAL_API_KEY) {
    return null;
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const parsedCookies = parseCookies(cookieHeader);
  const cookieToken = parsedCookies[CSRF_COOKIE] ?? '';
  const headerToken = request.headers.get(CSRF_HEADER) ?? '';

  if (!verifyCSRF(cookieToken, headerToken)) {
    return new Response(
      JSON.stringify({ error: 'CSRF validation failed', code: 'CSRF_INVALID' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return null;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce((acc, pair) => {
    const [key, ...rest] = pair.split('=');
    if (key) acc[key.trim()] = rest.join('=').trim();
    return acc;
  }, {} as Record<string, string>);
}

export { CSRF_COOKIE, CSRF_HEADER };
