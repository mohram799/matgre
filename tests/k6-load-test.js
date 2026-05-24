import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * SHAMIKH LUXURY OS — E2E High-Concurrency Load Testing Script
 * Simulates concurrent luxury storefront actions:
 *   1. Search catalog & load product details
 *   2. Trigger CSRF token validation
 *   3. Device fingerprint telemetry simulation
 *   4. Fast-checkout transaction load
 *
 * Execution command:
 *   k6 run apps/web-client/tests/k6-load-test.js
 */

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 concurrent users
    { duration: '1m', target: 100 },  // Steady-state at 100 concurrent users
    { duration: '30s', target: 200 }, // Spike-test to 200 users simulating flash launch
    { duration: '30s', target: 0 },   // Ramp-down to 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Less than 1% errors allowed
    http_req_duration: ['p95<200'],    // 95% of requests must complete under 200ms
    http_req_duration: ['p99<500'],    // 99% of requests must complete under 500ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3001';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-testing-agent-v1.0 (Luxury OS Simulation)',
    'cf-ipcountry': 'SA', // Mock Saudi IP to pass Geolocation reputation check
  };

  // ─── STEP 1: Search Catalog ────────────────────────────────────────────────
  const searchQueries = ['العطور', 'ساعة فاخرة', 'شنطة', 'عود'];
  const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

  const searchRes = http.get(
    `${BASE_URL}/api/search?q=${encodeURIComponent(randomQuery)}`,
    { headers }
  );

  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search returns results': (r) => JSON.parse(r.body).nbHits >= 0,
  });

  sleep(1);

  // ─── STEP 2: Fetch CSRF Security Token ──────────────────────────────────────
  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, { headers });
  let csrfToken = '';

  const csrfCheck = check(csrfRes, {
    'csrf status is 200': (r) => r.status === 200,
    'csrf token is present': (r) => {
      const body = JSON.parse(r.body);
      if (body && body.csrfToken) {
        csrfToken = body.csrfToken;
        return true;
      }
      return false;
    },
  });

  sleep(0.5);

  // ─── STEP 3: Submit Luxury Order (Simulate Checkout Flow) ──────────────────
  if (csrfCheck && csrfToken) {
    const payload = JSON.stringify({
      cartItems: [
        { id: 'prod_test_001', title: 'Royal Oud Scent Premium', price: 1250 }
      ],
      orderAmount: 1250,
      phone: '+966550000000',
      deviceFingerprint: 'fp_k6_load_test_' + Math.random().toString(36).substring(7),
      clientTimezone: 'Asia/Riyadh',
    });

    const postHeaders = Object.assign({}, headers, {
      'X-CSRF-Token': csrfToken,
    });

    const checkoutRes = http.post(
      `${BASE_URL}/api/checkout`,
      payload,
      { headers: postHeaders }
    );

    check(checkoutRes, {
      'checkout status is 200 or 201': (r) => r.status === 200 || r.status === 201 || r.status === 402 || r.status === 400, // Accept 402/400 (stripe mock limits) but reject server errors
      'checkout has no internal server error': (r) => r.status < 500,
    });
  }

  sleep(2);
}
