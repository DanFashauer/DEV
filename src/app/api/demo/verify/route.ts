/**
 * Demo Verify API
 * 
 * GET /api/demo/verify
 * 
 * Returns demo health status for automation/confidence check.
 * Used before demo to verify system is ready.
 * 
 * Response:
 * {
 *   "status": "PASS" | "FAIL",
 *   "decision": "DENY" | "ALLOW",
 *   "actions": ["quarantine", "siem", "itsm"],
 *   "timelineComplete": true | false,
 *   "demoMode": true | false,
 *   "message": string
 * }
 */

import { NextResponse } from 'next/server';
import { getSecurityEvents } from '@/lib/securityEvents';

export const dynamic = 'force-dynamic';

export async function GET() {
  const events = getSecurityEvents(50);
  const demoMode = process.env.DEMO_MODE === 'true';
  
  // Find most recent session denied event
  const sessionDenied = events.find(e => e.type === 'session_denied');
  const sessionAllowed = events.find(e => e.type === 'session_allowed');
  
  const latestDecision = sessionDenied || sessionAllowed;
  
  // Check timeline completeness
  const hasBadgeScan = events.some(e => e.type === 'session_denied' || e.type === 'session_allowed');
  const hasQuarantine = events.some(e => e.type === 'quarantine');
  const hasSiem = events.some(e => e.type === 'siem_alert');
  const hasItsm = events.some(e => e.type === 'itsm_ticket');
  
  const timelineComplete = hasBadgeScan && hasQuarantine && hasSiem && hasItsm;
  
  // Determine status
  const status = (sessionDenied && timelineComplete) ? 'PASS' : 'FAIL';
  
  // Build actions array
  const actions: string[] = [];
  if (hasQuarantine) actions.push('quarantine');
  if (hasSiem) actions.push('siem');
  if (hasItsm) actions.push('itsm');
  
  return NextResponse.json({
    status,
    decision: latestDecision?.decision || 'UNKNOWN',
    actions,
    timelineComplete,
    demoMode,
    message: status === 'PASS' 
      ? 'Demo scenario verified successfully' 
      : 'No complete demo scenario found. Run bun run demo:exec first.',
    lastEvent: latestDecision ? {
      id: latestDecision.id,
      type: latestDecision.type,
      decision: latestDecision.decision,
      timestamp: latestDecision.timestamp,
    } : null,
    eventCounts: {
      total: events.length,
      denied: events.filter(e => e.decision === 'DENY').length,
      allowed: events.filter(e => e.decision === 'ALLOW').length,
      quarantined: events.filter(e => e.type === 'quarantine').length,
      siemAlerts: events.filter(e => e.type === 'siem_alert').length,
      itsmTickets: events.filter(e => e.type === 'itsm_ticket').length,
    },
  });
}
