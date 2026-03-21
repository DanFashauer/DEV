/**
 * Health Check API
 * GET /api/v1/health
 * 
 * Public endpoint for monitoring service availability
 * No authentication required
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30',
        'Content-Type': 'application/json',
      },
    }
  );
}
