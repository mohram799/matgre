/**
 * SHAMIKH LUXURY OS — Enterprise Self-Diagnostics & Health API
 * Route: GET /api/health/diagnostics
 *
 * Runs active diagnostic probes across all critical components:
 *   1. Database connectivity & latency (Supabase PostgreSQL)
 *   2. Cache latency & connectivity (Redis client)
 *   3. Circuit Breaker registry status check
 *   4. System memory allocations & execution environment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redisCache } from '@/lib/redis-cache';
import { circuitRegistry } from '@/lib/circuit-breaker';

export const runtime = 'nodejs';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  
  // 1. Diagnose Database Latency
  let dbStatus = 'disconnected';
  let dbLatencyMs = -1;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const dbStart = Date.now();
      // Execute simple low-overhead metadata read
      const { data, error } = await supabase.from('products').select('id').limit(1);
      if (!error) {
        dbStatus = 'healthy';
        dbLatencyMs = Date.now() - dbStart;
      } else {
        dbStatus = `degraded (${error.message})`;
      }
    } catch (e: any) {
      dbStatus = `error: ${e.message}`;
    }
  }

  // 2. Diagnose Redis Cache Latency
  let redisStatus = 'disconnected';
  let redisLatencyMs = -1;
  const isRedisConnected = (redisCache as any).isConnected;
  const redisClient = (redisCache as any).client;
  
  if (isRedisConnected && redisClient) {
    try {
      const redisStart = Date.now();
      await redisClient.ping();
      redisStatus = 'healthy';
      redisLatencyMs = Date.now() - redisStart;
    } catch (e: any) {
      redisStatus = `error: ${e.message}`;
    }
  } else {
    redisStatus = 'mock_mode (in-process fallback active)';
  }

  // 3. Diagnose Circuit Breakers Registry
  const circuitStatuses = circuitRegistry.getAllStatus();

  // 4. Memory Usage Probe
  const memoryUsage = process.memoryUsage();

  const durationMs = Date.now() - start;
  const systemHealthy = dbStatus === 'healthy' && (redisStatus === 'healthy' || redisStatus.includes('mock_mode'));

  return NextResponse.json({
    status: systemHealthy ? 'healthy' : 'degraded',
    overallDurationMs: durationMs,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    diagnostics: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      cache: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
      },
      circuitBreakers: circuitStatuses,
      system: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        }
      }
    }
  }, {
    status: systemHealthy ? 200 : 500,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Diagnostics-Execution-Time': `${durationMs}ms`,
    }
  });
}
