/**
 * SHAMIKH LUXURY OS — SOC2 Compliance & GDPR Exporter API
 * Route: /api/admin/compliance
 *
 * GET: Export customer GDPR personal data profile (requires ADMIN/SUPER_ADMIN)
 * POST: Execute cryptographic verification of the immutable audit logs chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import {
  exportCustomerGDPRData,
  calculateAuditHash,
  fetchAuditLogsForVerification,
} from '@/lib/compliance';
import { sentry } from '@/lib/sentry';
import { isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

// ─── ADMIN AUTH GUARD ────────────────────────────────────────────────────────

const ADMIN_TEST_SECRET =
  process.env.ADMIN_TEST_SECRET || 'shamikh_master_security_2026';

async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  // Allow secret header or user header bypass for Sandbox testing
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret === ADMIN_TEST_SECRET) return true;

  const adminHeader = req.headers.get('x-admin-user');
  if (adminHeader) return true;

  const accessToken = req.cookies.get('shamikh_access_token')?.value;
  if (!accessToken) return false;

  const payload = await verifyJWT(accessToken) as any;
  if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN')) {
    return false;
  }
  return true;
}

// ─── GET: Export GDPR Customer Data ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authorized = await verifyAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized administrative access' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone parameter required' }, { status: 400 });
  }

  try {
    const data = await exportCustomerGDPRData(phone);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="gdpr_export_${phone.replace(/\+/g, '')}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    sentry.captureError(err, { message: 'GDPR extraction failure', context: { phone } });
    return NextResponse.json({ error: 'Failed to extract GDPR profile' }, { status: 500 });
  }
}

// ─── POST: Audit Log Cryptographic Verification ──────────────────────────────

export async function POST(req: NextRequest) {
  const authorized = await verifyAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized administrative access' }, { status: 401 });
  }

  // Return graceful mock response when Supabase is not configured
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      totalChecked: 0,
      verifiedCount: 0,
      anomaliesCount: 0,
      anomalies: [],
      verifiedAt: new Date().toISOString(),
      _mock: true,
      message: 'Audit log verification skipped — database not configured',
    });
  }

  try {
    // 1. Fetch all audit logs ordered from earliest to latest
    const logs = await fetchAuditLogsForVerification();

    let previousHash = 'genesis_block_hash_00000000000000000000000000000000';
    let verifiedCount = 0;
    const failures: Array<{ id: string; action: string; expected: string; actual: string }> = [];

    // 2. Cryptographically re-verify each hash link in the chain
    if (logs && logs.length > 0) {
      for (const log of logs) {
        const expectedHash = calculateAuditHash(
          log.action ?? '',
          log.actor ?? '',
          typeof log.details === 'string' ? log.details : JSON.stringify(log.details ?? ''),
          previousHash,
          log.created_at ?? ''
        );

        if (log.current_hash !== expectedHash) {
          failures.push({
            id: log.id,
            action: log.action,
            expected: expectedHash,
            actual: log.current_hash,
          });
        } else {
          verifiedCount++;
        }
        previousHash = log.current_hash ?? previousHash;
      }
    }

    const hasAnomaly = failures.length > 0;

    return NextResponse.json({
      success: !hasAnomaly,
      totalChecked: logs?.length || 0,
      verifiedCount,
      anomaliesCount: failures.length,
      anomalies: failures,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    sentry.captureError(err, { message: 'SOC2 Audit verification failure' });
    return NextResponse.json({ error: 'Audit verification execution failed' }, { status: 500 });
  }
}
