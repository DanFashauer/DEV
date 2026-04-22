import { addIntegrationLog } from '@/lib/integrationLogs';
import { createIdentityRef, resolveDeviceIdentity } from '@/lib/identity/deviceIdentity';
import { addSecurityEvent } from '@/lib/securityEvents';
import { calculateRiskScore, createRiskContext } from '@/lib/risk/score';

type SessionStartEvent = {
  timestamp: string;
  badge: { badgeId: string };
  device?: {
    deviceId?: string;
    deviceSerial?: string;
    deviceModel?: string;
    osVersion?: string;
  };
  context?: { locationId?: string };
};

type BadgeMapping = {
  department?: string;
  userId: string;
  userName?: string;
};

function resolveIdentityInput(event: SessionStartEvent, deviceId: string) {
  return {
    deviceId: event.device?.deviceId || deviceId,
    serial: event.device?.deviceSerial,
    platform: event.device?.deviceModel ? 'darwin' : undefined,
    osVersion: event.device?.osVersion,
    deviceModel: event.device?.deviceModel,
    managementSource: 'badge_event' as const,
  };
}

export async function buildDeniedPolicyInput(params: {
  event: SessionStartEvent;
  deviceId: string;
  badgeMapping: BadgeMapping;
  uemContext: Record<string, unknown>;
  fleetContext: Record<string, unknown>;
  isFleetCompliant: boolean;
  isDeviceCompliant: boolean;
}) {
  const { event, deviceId, badgeMapping, uemContext, fleetContext, isFleetCompliant, isDeviceCompliant } = params;

  const deviceIdentity = await resolveDeviceIdentity(resolveIdentityInput(event, deviceId));

  const riskScore = calculateRiskScore({
    deviceIdentity,
    isManaged: !!deviceIdentity.managementId,
    correlationScore: deviceIdentity?.correlationScore,
    postureStatus: isFleetCompliant ? 'compliant' : 'non_compliant',
    postureLastCheckAge: typeof fleetContext.lastSeenAge === 'number' ? fleetContext.lastSeenAge : undefined,
    locationZone: event.context?.locationId,
    eventTimestamp: event.timestamp,
  });

  return {
    riskScore,
    policyContext: {
      device: {
        role: 'kiosk',
        deviceId,
        complianceStatus: isDeviceCompliant ? 'compliant' : 'non_compliant',
        ...uemContext,
      },
      user: { role: badgeMapping.department || 'user', userId: badgeMapping.userId, name: badgeMapping.userName },
      location: { zone: event.context?.locationId || 'unknown' },
      session: { id: 'pending', startedAt: new Date().toISOString() },
      fleet: fleetContext,
      uem: uemContext,
      ...createRiskContext(riskScore),
      event: { type: 'session.start', timestamp: event.timestamp },
    },
  };
}

export async function buildGrantedPolicyInput(params: {
  event: SessionStartEvent;
  deviceId: string;
  badgeMapping: BadgeMapping;
  uemContext: Record<string, unknown>;
  fleetContext: Record<string, unknown>;
  sessionId: string;
  sessionCreatedAt: string;
}) {
  const { event, deviceId, badgeMapping, uemContext, fleetContext, sessionId, sessionCreatedAt } = params;

  const deviceIdentity = await resolveDeviceIdentity(resolveIdentityInput(event, deviceId));

  const riskScore = calculateRiskScore({
    deviceIdentity,
    isManaged: !!deviceIdentity.managementId,
    correlationScore: deviceIdentity?.correlationScore,
    postureStatus:
      fleetContext.status === 'compliant'
        ? 'compliant'
        : fleetContext.status === 'non_compliant'
          ? 'non_compliant'
          : 'unknown',
    postureLastCheckAge: typeof fleetContext.lastSeenAge === 'number' ? fleetContext.lastSeenAge : undefined,
    locationZone: event.context?.locationId,
    eventTimestamp: event.timestamp,
  });

  const identityRef = createIdentityRef(deviceIdentity);

  return {
    deviceIdentity,
    riskScore,
    policyContext: {
      device: { role: 'kiosk', deviceId, ...uemContext },
      user: { role: badgeMapping.department || 'user', userId: badgeMapping.userId, name: badgeMapping.userName },
      location: { zone: event.context?.locationId || 'unknown' },
      session: { id: sessionId, startedAt: sessionCreatedAt },
      fleet: fleetContext,
      uem: uemContext,
      ...createRiskContext(riskScore),
      _identityRef: identityRef,
    },
  };
}

export function recordDeniedPolicySideEffects(params: {
  policyActions: Array<{ type: string; policyName?: string }>;
  deviceId: string;
  userId: string;
  badgeId: string;
  userName?: string;
  riskScore: number;
}) {
  const { policyActions, deviceId, userId, badgeId, userName, riskScore } = params;

  const actionsToRecord = policyActions.length
    ? policyActions
    : [
        { type: 'quarantine_device', policyName: 'default.non_compliant' },
        { type: 'emit_siem_event', policyName: 'default.non_compliant' },
        { type: 'send_itsm_ticket', policyName: 'default.non_compliant' },
      ];

  addSecurityEvent({
    type: 'session_denied',
    timestamp: new Date().toISOString(),
    actor: { type: 'badge', id: badgeId, name: userName },
    device: { id: deviceId, complianceStatus: 'non_compliant' },
    decision: 'DENY',
    reason: 'DEVICE_NON_COMPLIANT',
    actionsTriggered: actionsToRecord.map((a) => a.type),
    riskScore,
    policy: policyActions[0]?.policyName,
  });

  for (const action of actionsToRecord) {
    // Log integration payloads for demo visibility
    if (action.type === 'quarantine_device') {
      addIntegrationLog('nac', {
        command: 'quarantine',
        deviceId,
        reason: 'Device non-compliant',
        policy: action.policyName,
        timestamp: new Date().toISOString(),
      });
    } else if (action.type === 'emit_siem_event') {
      addIntegrationLog('siem', {
        eventType: 'signalgrid.access.denied',
        deviceId,
        userId,
        riskScore,
        policy: action.policyName,
        timestamp: new Date().toISOString(),
      });
    } else if (action.type === 'send_itsm_ticket') {
      addIntegrationLog('itsm', {
        shortDescription: 'Non-compliant device access denied',
        urgency: 'high',
        category: 'Security',
        deviceId,
        userId,
        policy: action.policyName,
        timestamp: new Date().toISOString(),
      });
    }

    if (action.type === 'quarantine_device') {
      addSecurityEvent({
        type: 'quarantine',
        timestamp: new Date().toISOString(),
        actor: { type: 'system', id: 'policy-engine' },
        device: { id: deviceId, complianceStatus: 'non_compliant' },
        decision: 'DENY',
        reason: 'Device quarantined due to compliance failure',
        actionsTriggered: [],
        policy: action.policyName,
      });
    } else if (action.type === 'emit_siem_event') {
      addSecurityEvent({
        type: 'siem_alert',
        timestamp: new Date().toISOString(),
        actor: { type: 'system', id: 'policy-engine' },
        device: { id: deviceId, complianceStatus: 'non_compliant' },
        decision: 'DENY',
        reason: 'SIEM alert sent',
        actionsTriggered: [],
        policy: action.policyName,
      });
    } else if (action.type === 'send_itsm_ticket') {
      addSecurityEvent({
        type: 'itsm_ticket',
        timestamp: new Date().toISOString(),
        actor: { type: 'system', id: 'policy-engine' },
        device: { id: deviceId, complianceStatus: 'non_compliant' },
        decision: 'DENY',
        reason: 'ITSM incident created',
        actionsTriggered: [],
        policy: action.policyName,
      });
    }
  }
}
