/**
 * Security Events API for Admin Dashboard
 * 
 * Returns recent security events in C-suite friendly format
 * GET /api/admin/security-events
 * 
 * Query params:
 *   limit: number (default 10)
 *   type: filter by event type
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getSecurityEvents, getSecurityEventSummary, getSecurityEventTimeline, type SecurityEvent } from '@/lib/securityEvents';

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const type = searchParams.get('type') as SecurityEvent['type'] | null;

  let events = getSecurityEvents(100);
  
  if (type) {
    events = events.filter(e => e.type === type);
  }

  events = events.slice(0, limit);

  return NextResponse.json({
    events,
    timeline: getSecurityEventTimeline(),
    summary: getSecurityEventSummary(),
  });
}

export const dynamic = 'force-dynamic';
