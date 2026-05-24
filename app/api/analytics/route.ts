/**
 * GET /api/analytics
 * Convenience alias → delegates to /api/analytics/dashboard
 * The test sandbox and admin panel call /api/analytics directly.
 */
import { NextRequest } from 'next/server';
import { GET as dashboardGET } from '@/app/api/analytics/dashboard/route';

export const GET = (req: NextRequest) => dashboardGET(req);
