/**
 * Health Check Endpoint
 * 
 * Provides a simple health check for test infrastructure and load balancers.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'signalgrid',
    timestamp: new Date().toISOString(),
  });
}
