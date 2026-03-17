/**
 * Event Timeline API
 * 
 * GET /api/events/{correlationId}
 * Returns ordered timeline of events for a specific session/case
 * 
 * Query params:
 *   correlationId: string (optional - returns all recent timeline if not provided)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getSecurityEvents } from '@/lib/securityEvents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ correlationId?: string }> }
) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  const { correlationId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Get all events
  const allEvents = getSecurityEvents(100);

  // Build timeline - ordered sequence of events
  const timeline = allEvents
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((event, index) => ({
      order: index + 1,
      time: new Date(event.timestamp).toISOString(),
      timeFormatted: new Date(event.timestamp).toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      event: formatEventName(event),
      details: {
        type: event.type,
        actor: event.actor,
        device: event.device,
        decision: event.decision,
        reason: event.reason,
        actions: event.actionsTriggered,
        riskScore: event.riskScore,
        policy: event.policy,
      },
    }));

  return NextResponse.json({
    correlationId,
    totalEvents: timeline.length,
    timeline,
  });
}

function formatEventName(event: any): string {
  const type = event.type;
  
  switch (type) {
    case 'session_denied':
      return 'SESSION_DENIED';
    case 'session_allowed':
      return 'SESSION_ALLOWED';
    case 'quarantine':
      return 'NAC_QUARANTINE_TRIGGERED';
    case 'siem_alert':
      return 'SIEM_ALERT_CREATED';
    case 'itsm_ticket':
      return 'ITSM_INCIDENT_CREATED';
    default:
      return type.toUpperCase().replace('_', ' ');
  }
}

export const dynamic = 'force-dynamic';
