import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, signJWT } from './lib/auth';
import { getSecureHeaders } from './lib/advanced-security';

// Paths that require administrative session protection
const PROTECTED_PREFIX = '/admin';
const BYPASS_PATHS = ['/admin/login', '/admin/login/actions'];

// Safely stringify JSON to an ASCII-only string by escaping non-ASCII characters
function safeJsonStringify(obj: any): string {
  const str = JSON.stringify(obj);
  return str.replace(/[\u007f-\uffff]/g, (c) => {
    return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
  });
}


// API paths that also require admin JWT (middleware will inject x-admin-user)
const ADMIN_API_PREFIXES = [
  '/api/admin',
  '/api/users',
  '/api/analytics',
  '/api/audit',
];

function isAdminApiPath(pathname: string): boolean {
  return ADMIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Generate trace ID at edge for global correlation
  const traceId = crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-trace-id', traceId);

  // 1. Subdomain Store Routing (SaaS Multi-Tenancy Router)
  const isApiOrAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon');

  if (!isApiOrAsset) {
    let tenantSubdomain = '';
    const mainDomain = 'luxury-os.com';

    if (hostname.endsWith(mainDomain)) {
      const parts = hostname.replace(`.${mainDomain}`, '').split('.');
      if (parts.length > 0 && parts[0] !== 'www' && parts[0] !== hostname) {
        tenantSubdomain = parts[0];
      }
    } else if (
      hostname !== 'localhost:3000' &&
      hostname !== 'localhost:3001' &&
      hostname !== '127.0.0.1:3000' &&
      hostname !== '127.0.0.1:3001'
    ) {
      // Custom external domain mapping
      tenantSubdomain = hostname;
    }

    if (tenantSubdomain) {
      // Rewrite the URL path internally to tenant-isolated dynamic route folders
      url.pathname = `/_tenants/${tenantSubdomain}${pathname}`;

      const response = NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });

      // Inject secure headers
      const secureHeaders = getSecureHeaders();
      Object.entries(secureHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      response.headers.set('X-Trace-Id', traceId);
      return response;
    }
  }

  // 2. Admin Security Verification & Session Rotation (page routes)
  const isProtectedPath =
    pathname.startsWith(PROTECTED_PREFIX) && !BYPASS_PATHS.includes(pathname);

  if (isProtectedPath) {
    const accessToken = req.cookies.get('shamikh_access_token')?.value;
    const refreshToken = req.cookies.get('shamikh_refresh_token')?.value;

    let payload = accessToken ? await verifyJWT(accessToken) : null;

    // Token Rotation
    if (!payload && refreshToken) {
      const refreshPayload = await verifyJWT(refreshToken);
      if (refreshPayload) {
        const newAccessToken = await signJWT(
          {
            phone: refreshPayload.phone,
            name: refreshPayload.name,
            role: refreshPayload.role,
          },
          '15m'
        );

        // ✅ Set x-admin-user on REQUEST headers so route handlers can read it
        requestHeaders.set(
          'x-admin-user',
          safeJsonStringify({
            phone: refreshPayload.phone,
            name: refreshPayload.name,
            role: refreshPayload.role,
          })
        );

        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        response.cookies.set('shamikh_access_token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60,
          path: '/',
        });

        const secureHeaders = getSecureHeaders();
        Object.entries(secureHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        response.headers.set('X-Trace-Id', traceId);

        return response;
      }
    }

    if (!payload) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('shamikh_access_token');
      response.headers.set('X-Trace-Id', traceId);
      return response;
    }

    // ✅ Set x-admin-user on REQUEST headers (not response headers)
    // so Next.js route handlers can read it via req.headers.get('x-admin-user')
    requestHeaders.set('x-admin-user', safeJsonStringify(payload));

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const secureHeaders = getSecureHeaders();
    Object.entries(secureHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Trace-Id', traceId);

    return response;
  }

  // 3. Admin API routes — inject x-admin-user from JWT cookie if present
  //    This allows API routes to trust the middleware-set header without
  //    needing to verify the JWT themselves.
  if (isAdminApiPath(pathname)) {
    const accessToken = req.cookies.get('shamikh_access_token')?.value;
    const refreshToken = req.cookies.get('shamikh_refresh_token')?.value;

    let payload = accessToken ? await verifyJWT(accessToken) : null;

    if (!payload && refreshToken) {
      const refreshPayload = await verifyJWT(refreshToken);
      if (refreshPayload) {
        payload = refreshPayload;
      }
    }

    if (payload) {
      // ✅ Inject admin identity into the request so API route handlers see it
      requestHeaders.set('x-admin-user', safeJsonStringify(payload));
    }
    // No redirect for API routes — individual handlers will return 401 if needed
  }

  // 4. Storefront Secure Headers Injection
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const secureHeaders = getSecureHeaders();
  Object.entries(secureHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set('X-Trace-Id', traceId);

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/((?:api|products|checkout|auth).*)'],
};
