/**
 * Security Events Store
 * 
 * In-memory store for security events displayed in admin dashboard
 * Used for C-suite friendly demo output
 */

export interface SecurityEvent {
  id: string;
  type: 'session_denied' | 'session_allowed' | 'quarantine' | 'siem_alert' | 'itsm_ticket';
  timestamp: string;
  actor: {
    type: string;
    id: string;
    name?: string;
  };
  device?: {
    id: string;
    complianceStatus: string;
  };
  decision: 'DENY' | 'ALLOW';
  reason?: string;
  actionsTriggered: string[];
  riskScore?: number;
  policy?: string;
}

// In-memory store for demo security events
const securityEvents: SecurityEvent[] = [];

export function addSecurityEvent(event: Omit<SecurityEvent, 'id'>) {
  const id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  securityEvents.unshift({ ...event, id });
  
  // Keep only last 100 events
  if (securityEvents.length > 100) {
    securityEvents.length = 100;
  }
  
  console.log('[SecurityEvent] Recorded:', event.type, event.decision, event.reason);
}

export function getSecurityEvents(limit: number = 50, offset: number = 0) {
  const total = securityEvents.length;
  const events = securityEvents.slice(offset, offset + limit);
  const hasMore = offset + limit < total;
  
  return {
    events,
    total,
    hasMore,
    offset,
    limit,
  };
}

export function getSecurityEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
  return securityEvents.filter(e => e.type === type);
}

export function getSecurityEventSummary() {
  return {
    totalEvents: securityEvents.length,
    denied: securityEvents.filter(e => e.decision === 'DENY').length,
    allowed: securityEvents.filter(e => e.decision === 'ALLOW').length,
    quarantined: securityEvents.filter(e => e.type === 'quarantine').length,
    siemAlerts: securityEvents.filter(e => e.type === 'siem_alert').length,
    itsmTickets: securityEvents.filter(e => e.type === 'itsm_ticket').length,
  };
}

export function getSecurityEventTimeline() {
  return securityEvents.reduce((acc, event) => {
    const minute = new Date(event.timestamp).toISOString().slice(0, 16);
    if (!acc[minute]) {
      acc[minute] = [];
    }
    acc[minute].push(event);
    return acc;
  }, {} as Record<string, SecurityEvent[]>);
}

export function clearSecurityEvents() {
  securityEvents.length = 0;
}
