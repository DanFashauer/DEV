// ============================================================================
// Policy Context - Normalized event/context for policy evaluation
// ============================================================================

/**
 * Normalized event type
 */
export type PolicyEventType = 
  | 'session.start'
  | 'session.end'
  | 'session.extended'
  | 'badge.enroll'
  | 'badge.delete'
  | 'auth.success'
  | 'auth.failure'
  | 'auth.lockout'
  | 'device.enrolled'
  | 'device.unenrolled'
  | 'location.observed'
  | 'location.violation'
  | 'webhook.received'
  | 'policy.triggered';

/**
 * Normalized device context
 */
export interface PolicyDeviceContext {
  deviceId: string;
  platform?: string;
  ip?: string;
  mac?: string;
  hostname?: string;
  manufacturer?: string;
  model?: string;
  osVersion?: string;
  tags?: string[];
  enrollmentStatus?: 'enrolled' | 'unenrolled' | 'unknown';
  complianceStatus?: 'compliant' | 'non_compliant' | 'unknown';
}

/**
 * Normalized user context
 */
export interface PolicyUserContext {
  userId: string;
  email?: string;
  name?: string;
  department?: string;
  roles?: string[];
  badges?: string[];
  managerId?: string;
}

/**
 * Normalized session context
 */
export interface PolicySessionContext {
  sessionId: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  appBundleId?: string;
  appName?: string;
  ttl?: number;
  status?: 'active' | 'ended' | 'expired' | 'terminated';
}

/**
 * Normalized location context
 */
export interface PolicyLocationContext {
  zone?: string;
  building?: string;
  floor?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  accuracy?: number;
  timestamp?: string;
  mode?: 'presence' | 'coarse' | 'precise';
}

/**
 * Normalized badge context
 */
export interface PolicyBadgeContext {
  badgeUid: string;
  badgeType?: 'nfc' | 'ble' | 'physical';
  enrolled?: boolean;
  lastSeen?: string;
}

/**
 * Event context
 */
export interface PolicyEventContext {
  type: PolicyEventType;
  timestamp?: string;
  requestId?: string;
}

/**
 * Full policy context - combines all context types
 */
export interface PolicyContext {
  event?: PolicyEventContext;
  device?: PolicyDeviceContext;
  user?: PolicyUserContext;
  session?: PolicySessionContext;
  location?: PolicyLocationContext;
  badge?: PolicyBadgeContext;
  metadata?: Record<string, unknown>;
  caseId?: string;
}

/**
 * Context builder - helper to create policy context from various sources
 */
export class PolicyContextBuilder {
  private context: PolicyContext;

  constructor() {
    this.context = {
      event: {
        type: 'session.start',
        timestamp: new Date().toISOString(),
      },
    };
  }

  setEvent(type: PolicyEventType, requestId?: string): this {
    this.context.event = {
      type,
      timestamp: new Date().toISOString(),
      requestId,
    };
    return this;
  }

  setDevice(device: PolicyDeviceContext): this {
    this.context.device = device;
    return this;
  }

  setUser(user: PolicyUserContext): this {
    this.context.user = user;
    return this;
  }

  setSession(session: PolicySessionContext): this {
    this.context.session = session;
    return this;
  }

  setLocation(location: PolicyLocationContext): this {
    this.context.location = location;
    return this;
  }

  setBadge(badge: PolicyBadgeContext): this {
    this.context.badge = badge;
    return this;
  }

  setCaseId(caseId: string): this {
    this.context.caseId = caseId;
    return this;
  }

  setMetadata(key: string, value: unknown): this {
    if (!this.context.metadata) {
      this.context.metadata = {};
    }
    this.context.metadata[key] = value;
    return this;
  }

  build(): PolicyContext {
    return this.context;
  }
}

// ============================================================================
// Context extraction utilities
// ============================================================================

/**
 * Extract policy context from session start event
 */
export function extractContextFromSessionStart(params: {
  sessionId: string;
  deviceId: string;
  userId: string;
  badgeUid: string;
  appBundleId?: string;
  appName?: string;
  ttl: number;
  caseId?: string;
  requestId?: string;
}): PolicyContext {
  return {
    event: {
      type: 'session.start',
      timestamp: new Date().toISOString(),
      requestId: params.requestId,
    },
    device: {
      deviceId: params.deviceId,
      enrollmentStatus: 'enrolled',
      complianceStatus: 'compliant',
    },
    user: {
      userId: params.userId,
    },
    session: {
      sessionId: params.sessionId,
      startedAt: new Date().toISOString(),
      appBundleId: params.appBundleId,
      appName: params.appName,
      ttl: params.ttl,
      status: 'active',
    },
    badge: {
      badgeUid: params.badgeUid,
      badgeType: 'nfc',
      enrolled: true,
      lastSeen: new Date().toISOString(),
    },
    caseId: params.caseId || `case-${params.sessionId}`,
  };
}

/**
 * Extract policy context from auth failure event
 */
export function extractContextFromAuthFailure(params: {
  deviceId: string;
  userId?: string;
  badgeUid?: string;
  reason: string;
  caseId?: string;
  requestId?: string;
}): PolicyContext {
  const context: PolicyContext = {
    event: {
      type: 'auth.failure',
      timestamp: new Date().toISOString(),
      requestId: params.requestId,
    },
    device: {
      deviceId: params.deviceId,
    },
    caseId: params.caseId || `case-auth-${Date.now()}`,
    metadata: {
      failureReason: params.reason,
    },
  };

  if (params.userId) {
    context.user = { userId: params.userId };
  }

  if (params.badgeUid) {
    context.badge = { badgeUid: params.badgeUid, enrolled: false };
  }

  return context;
}

/**
 * Extract policy context from location violation event
 */
export function extractContextFromLocationViolation(params: {
  deviceId: string;
  userId?: string;
  zone: string;
  building?: string;
  allowedZones?: string[];
  caseId?: string;
  requestId?: string;
}): PolicyContext {
  const context: PolicyContext = {
    event: {
      type: 'location.violation',
      timestamp: new Date().toISOString(),
      requestId: params.requestId,
    },
    device: {
      deviceId: params.deviceId,
    },
    location: {
      zone: params.zone,
      building: params.building,
      timestamp: new Date().toISOString(),
      mode: 'presence',
    },
    caseId: params.caseId || `case-loc-${Date.now()}`,
    metadata: {
      allowedZones: params.allowedZones || [],
    },
  };

  if (params.userId) {
    context.user = { userId: params.userId };
  }

  return context;
}
