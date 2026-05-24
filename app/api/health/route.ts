import { NextRequest, NextResponse } from 'next/server';
import { validateEnvironment, featureFlags } from '@/lib/env';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/health
 * Enterprise system health check endpoint.
 * Used by load balancers, uptime monitors, and Kubernetes liveness probes.
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // ── 1. Environment Validation ──────────────────────────────────────────────
  const envResult = validateEnvironment();

  // ── 2. Database Connectivity ──────────────────────────────────────────────
  let dbStatus: 'ok' | 'degraded' | 'down' = 'down';
  let dbLatencyMs = 0;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const dbStart = Date.now();
      const res = await fetch(
        `${supabaseUrl}/rest/v1/products?select=id&limit=1&status=eq.active`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          signal: AbortSignal.timeout(5000), // 5s timeout
        }
      );
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = res.ok ? 'ok' : 'degraded';
    } catch {
      dbStatus = 'down';
    }
  } else {
    dbStatus = 'degraded'; // Configured in mock mode
  }

  // ── 3. External Service Checks ────────────────────────────────────────────
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const dropshippingConfigured = Boolean(process.env.ALIEXPRESS_API_KEY);

  // ── 4. Feature Flags Status ───────────────────────────────────────────────
  const flags = {
    stripe_payments: featureFlags.stripePayments(),
    email_notifications: featureFlags.emailNotifications(),
    fraud_detection: featureFlags.fraudDetection(),
    ai_recommendations: featureFlags.aiRecommendations(),
    dropshipping_sync: featureFlags.dropshippingSync(),
    multi_tenancy: featureFlags.multiTenancy(),
    maintenance_mode: featureFlags.maintenanceMode(),
  };

  // ── 5. Memory Usage ──────────────────────────────────────────────────────
  const memUsage = process.memoryUsage();
  const memMb = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    rss: Math.round(memUsage.rss / 1024 / 1024),
  };

  // ── 6. Determine Overall Status ───────────────────────────────────────────
  const overallStatus =
    dbStatus === 'down' || !envResult.isValid
      ? 'unhealthy'
      : dbStatus === 'degraded' || envResult.warnings.length > 0
        ? 'degraded'
        : 'healthy';

  const httpStatus =
    overallStatus === 'unhealthy' ? 503 :
    overallStatus === 'degraded'  ? 200 : 200;

  const responsePayload = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    uptime_seconds: Math.floor(process.uptime()),
    response_time_ms: Date.now() - startTime,

    checks: {
      database: {
        status: dbStatus,
        latency_ms: dbLatencyMs,
        provider: 'supabase',
        configured: isSupabaseConfigured(),
      },
      stripe: {
        status: stripeConfigured ? 'configured' : 'not_configured',
      },
      email: {
        status: emailConfigured ? 'configured' : 'not_configured',
      },
      dropshipping: {
        status: dropshippingConfigured ? 'configured' : 'not_configured',
      },
    },

    environment_health: {
      valid: envResult.isValid,
      missing_required: envResult.missing,
      missing_optional_count: envResult.warnings.length,
    },

    feature_flags: flags,

    memory: memMb,

    warnings: envResult.warnings.slice(0, 5), // Cap at 5 for brevity
  };

  return NextResponse.json(responsePayload, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache',
      'X-Health-Check': overallStatus,
    },
  });
}
