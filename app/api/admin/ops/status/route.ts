import { NextRequest, NextResponse } from 'next/server';
import { circuitRegistry } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';

// Eagerly import service registry to ensure all breakers are bootstrapped
import '@/lib/service-registry';

/**
 * GET /api/admin/ops/status
 * Returns a real-time snapshot of the operational health of all external services
 * and internal subsystems. Used by the observability dashboard.
 *
 * Security: Requires x-admin-secret header or service-role auth.
 */
export async function GET(req: NextRequest) {
  const traceId = req.headers.get('x-trace-id') ?? `trace-${Date.now()}`;

  // Auth guard
  const adminSecret = req.headers.get('x-admin-secret');
  const expectedSecret = process.env.ADMIN_SECRET_KEY;
  if (expectedSecret && adminSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const circuitStatus = circuitRegistry.getAllStatus();

  // Classify circuit states into an overall severity level
  const openCircuits = Object.entries(circuitStatus).filter(([, s]) => s === 'OPEN');
  const halfOpenCircuits = Object.entries(circuitStatus).filter(([, s]) => s === 'HALF_OPEN');

  let overallHealth: 'healthy' | 'degraded' | 'critical';
  if (openCircuits.length === 0 && halfOpenCircuits.length === 0) {
    overallHealth = 'healthy';
  } else if (openCircuits.length >= 2) {
    overallHealth = 'critical';
  } else {
    overallHealth = 'degraded';
  }

  // Runtime environment probes
  const envChecks = {
    supabase:    !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripe:      !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')),
    openai:      !!(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')),
    redis:       !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL),
    resend:      !!(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder')),
    meilisearch: !!(process.env.MEILISEARCH_HOST),
    sentry:      !!(process.env.NEXT_PUBLIC_SENTRY_DSN),
  };

  const configuredCount  = Object.values(envChecks).filter(Boolean).length;
  const totalServices    = Object.keys(envChecks).length;

  logger.info('[OPS] Status snapshot requested', { traceId, overallHealth, openCircuits: openCircuits.length });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overallHealth,
    circuitBreakers: {
      all:      circuitStatus,
      open:     openCircuits.map(([name]) => name),
      halfOpen: halfOpenCircuits.map(([name]) => name),
    },
    environment: {
      checks:    envChecks,
      configured: configuredCount,
      total:     totalServices,
      readiness: `${configuredCount}/${totalServices}`,
    },
    platform: {
      runtime:   'vercel-edge',
      region:    process.env.VERCEL_REGION ?? 'local',
      nodeEnv:   process.env.NODE_ENV,
      version:   process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
    },
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache',
      'X-Trace-Id': traceId,
    },
  });
}
