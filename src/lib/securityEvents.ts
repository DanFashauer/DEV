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
const securityEvents: SecurityEvent[] = [
  {
    id: 'evt-test-001',
    type: 'session_allowed',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    actor: { type: 'user', id: 'user-001', name: 'John Doe' },
    device: { id: 'test-device-001', complianceStatus: 'compliant' },
    decision: 'ALLOW',
    reason: 'Valid badge scan',
    actionsTriggered: ['log_access'],
    riskScore: 10,
    policy: 'standard_access',
  },
  {
    id: 'evt-test-002',
    type: 'session_denied',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    actor: { type: 'user', id: 'user-002', name: 'Jane Smith' },
    device: { id: 'test-device-002', complianceStatus: 'non-compliant' },
    decision: 'DENY',
    reason: 'Device not enrolled',
    actionsTriggered: ['alert_security', 'block_access'],
    riskScore: 85,
    policy: 'strict_enrollment',
  },
  {
    id: 'evt-test-003',
    type: 'quarantine',
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    actor: { type: 'system', id: 'system-001' },
    device: { id: 'test-device-003', complianceStatus: 'quarantined' },
    decision: 'DENY',
    reason: 'Jailbroken device detected',
    actionsTriggered: ['quarantine_device', 'notify_admin'],
    riskScore: 95,
    policy: 'device_integrity',
  },
  {
    id: 'evt-test-004',
    type: 'session_allowed',
    timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    actor: { type: 'user', id: 'user-003', name: 'Bob Johnson' },
    device: { id: 'test-device-001', complianceStatus: 'compliant' },
    decision: 'ALLOW',
    reason: 'Valid badge scan',
    actionsTriggered: ['log_access'],
    riskScore: 5,
    policy: 'standard_access',
  },
];

console.log(`[SecurityEvents] Initialized with ${securityEvents.length} test events`);
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
