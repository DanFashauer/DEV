/**
 * Events API v1
 * GET /api/v1/events - List security events with pagination
 * 
 * Public API for third-party integration
 * Requires authentication (JWT or API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkApiKey } from '@/lib/utils/apiKeyAuth';
import { getSecurityEvents } from '@/lib/securityEvents';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = checkApiKey(request);
  if (authError) {
    return authError;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const type = searchParams.get('type');

    // Get all events (we'll paginate after filtering)
    const allEvents = getSecurityEvents(1000, 0).events;

    // Apply type filter if provided
    let filteredEvents = allEvents;
    if (type) {
      filteredEvents = allEvents.filter(e => e.type === type);
    }

    // Apply pagination to filtered events
    const total = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return NextResponse.json(
      {
        events: paginatedEvents.map(event => ({
          id: event.id,
          type: event.type,
          timestamp: event.timestamp,
          actor: event.actor,
          device: event.device,
          decision: event.decision,
          reason: event.reason,
          riskScore: event.riskScore,
          policy: event.policy,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=10',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EventsAPI] Error:', message);
    
    return NextResponse.json(
      {
        error: 'Failed to list events',
        code: 'LIST_EVENTS_ERROR',
        requestId: request.headers.get('x-request-id'),
      },
      { status: 500 }
    );
  }
}
