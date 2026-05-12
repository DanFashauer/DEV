export type DemoOutcome = 'ACCESS_GRANTED' | 'DEVICE_NON_COMPLIANT' | 'DEVICE_POSTURE_UNKNOWN';

export type DemoScenarioId = 'compliant' | 'non-compliant' | 'unknown';

export type DemoSignalState = 'good' | 'warn' | 'bad' | 'unknown';

export type DemoTimelineStatus = 'complete' | 'blocked' | 'review';

export type DemoRiskLevel = 'low' | 'high' | 'unknown';

export type DemoSignal = {
  label: string;
  value: string;
  state: DemoSignalState;
};

export type DemoTimelineItem = {
  step: string;
  detail: string;
  status: DemoTimelineStatus;
};

export type DemoAuditEvent = {
  eventId: string;
  actor: string;
  device: string;
  policy: string;
  decision: DemoOutcome;
  reason: string;
  remediation: string;
};

export type DemoScenario = {
  id: DemoScenarioId;
  label: string;
  cardTitle: string;
  headline: string;
  summary: string;
  outcome: DemoOutcome;
  outcomeTone: string;
  operatorMessage: string;
  simulatedHttpStatus: 200 | 403;
  riskScore: number;
  riskLevel: DemoRiskLevel;
  signals: DemoSignal[];
  timeline: DemoTimelineItem[];
  audit: DemoAuditEvent;
};

export type DemoSessionShape = {
  sessionId: string;
  expiresAt: string;
  nextAction: 'LAUNCH_APP';
  bundleId: string;
};

export type DemoAction = {
  type: string;
  params: Record<string, string | number | boolean>;
  simulated: true;
};

export type DemoSessionResult = {
  success: boolean;
  decision: 'ACCESS_GRANTED' | 'ACCESS_DENIED';
  session?: DemoSessionShape;
  actions: DemoAction[];
  riskScore: number;
  riskLevel: DemoRiskLevel;
  error?: string;
  code?: Exclude<DemoOutcome, 'ACCESS_GRANTED'>;
  demo: {
    simulated: true;
    demoMode: true;
    scenarioId: DemoScenarioId;
    outcome: DemoOutcome;
    simulatedHttpStatus: 200 | 403;
    safe: {
      deterministicDataOnly: true;
      webhooksCalled: false;
      productionDataMutated: false;
      secretsExposed: false;
    };
    operatorMessage: string;
    signals: DemoSignal[];
    timeline: DemoTimelineItem[];
    audit: DemoAuditEvent;
  };
};

export const demoScenarios: DemoScenario[] = [
  {
    id: 'compliant',
    label: 'Compliant',
    cardTitle: 'Compliant device',
    headline: 'Compliant device clears runtime access',
    summary: 'A nurse badges into a shared medication station. Identity, posture, and location signals agree.',
    outcome: 'ACCESS_GRANTED',
    outcomeTone: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100',
    operatorMessage: 'Allow the session and continue monitoring runtime risk.',
    simulatedHttpStatus: 200,
    riskScore: 12,
    riskLevel: 'low',
    signals: [
      { label: 'Badge identity', value: 'RN-2042 / MFA fresh', state: 'good' },
      { label: 'Device posture', value: 'Encrypted, patched, MDM healthy', state: 'good' },
      { label: 'Location', value: 'Nurse station A / expected subnet', state: 'good' },
      { label: 'Session risk', value: 'Low anomaly score', state: 'good' },
    ],
    timeline: [
      {
        step: 'Badge event received',
        detail: 'SignalGrid receives deterministic demo badge UID SG-DEMO-RN-2042.',
        status: 'complete',
      },
      {
        step: 'Posture evaluated',
        detail: 'Demo device reports current patch level, encryption, and MDM check-in.',
        status: 'complete',
      },
      {
        step: 'Policy resolved',
        detail: 'Shared clinical workstation policy allows low-risk compliant devices.',
        status: 'complete',
      },
      {
        step: 'Decision returned',
        detail: 'ACCESS_GRANTED is returned with an audit-ready event preview.',
        status: 'complete',
      },
    ],
    audit: {
      eventId: 'audit-demo-001',
      actor: 'rn-2042@example.health',
      device: 'ipad-medcart-17',
      policy: 'clinical-shared-device-runtime',
      decision: 'ACCESS_GRANTED',
      reason: 'identity_verified_posture_compliant_location_expected',
      remediation: 'none_required',
    },
  },
  {
    id: 'non-compliant',
    label: 'Non-compliant',
    cardTitle: 'Non-compliant device',
    headline: 'Non-compliant device is blocked before access',
    summary: 'A warehouse operator scans into a handheld that has drifted out of required posture.',
    outcome: 'DEVICE_NON_COMPLIANT',
    outcomeTone: 'border-rose-400/50 bg-rose-400/10 text-rose-100',
    operatorMessage: 'Deny access, explain the failed signal, and route the device to remediation.',
    simulatedHttpStatus: 403,
    riskScore: 86,
    riskLevel: 'high',
    signals: [
      { label: 'Badge identity', value: 'OPS-1188 / badge valid', state: 'good' },
      { label: 'Device posture', value: 'OS patch overdue by 21 days', state: 'bad' },
      { label: 'Location', value: 'Dock 4 / expected subnet', state: 'good' },
      { label: 'Session risk', value: 'Policy threshold exceeded', state: 'bad' },
    ],
    timeline: [
      {
        step: 'Badge event received',
        detail: 'SignalGrid pairs operator identity to scanner SG-HANDHELD-44.',
        status: 'complete',
      },
      {
        step: 'Posture evaluated',
        detail: 'Patch age violates the pilot policy posture requirement.',
        status: 'blocked',
      },
      {
        step: 'Remediation selected',
        detail: 'Demo flow shows a remediation instruction preview only; no external system is called.',
        status: 'review',
      },
      {
        step: 'Decision returned',
        detail: 'DEVICE_NON_COMPLIANT is returned without mutating production state.',
        status: 'blocked',
      },
    ],
    audit: {
      eventId: 'audit-demo-002',
      actor: 'ops-1188@example.logistics',
      device: 'scanner-dock4-44',
      policy: 'warehouse-shared-device-runtime',
      decision: 'DEVICE_NON_COMPLIANT',
      reason: 'device_patch_level_below_policy',
      remediation: 'show_update_instructions_and_open_it_queue_preview',
    },
  },
  {
    id: 'unknown',
    label: 'Unknown posture',
    cardTitle: 'Unknown posture',
    headline: 'Unknown posture fails closed with clear context',
    summary: 'A retail associate signs into a kiosk whose telemetry has not checked in recently enough to trust.',
    outcome: 'DEVICE_POSTURE_UNKNOWN',
    outcomeTone: 'border-amber-400/50 bg-amber-400/10 text-amber-100',
    operatorMessage: 'Hold access until posture can be refreshed or a supervisor approves an exception.',
    simulatedHttpStatus: 403,
    riskScore: 64,
    riskLevel: 'unknown',
    signals: [
      { label: 'Badge identity', value: 'STORE-307 / badge valid', state: 'good' },
      { label: 'Device posture', value: 'Last telemetry 9 hours ago', state: 'unknown' },
      { label: 'Location', value: 'Front kiosk / expected subnet', state: 'good' },
      { label: 'Session risk', value: 'Incomplete evidence', state: 'warn' },
    ],
    timeline: [
      {
        step: 'Badge event received',
        detail: 'SignalGrid receives associate badge event for kiosk SG-KIOSK-03.',
        status: 'complete',
      },
      {
        step: 'Posture requested',
        detail: 'The deterministic demo posture source returns stale telemetry.',
        status: 'review',
      },
      {
        step: 'Policy resolved',
        detail: 'Policy requires fresh device posture before shared-device access.',
        status: 'review',
      },
      {
        step: 'Decision returned',
        detail: 'DEVICE_POSTURE_UNKNOWN is returned with the missing evidence called out.',
        status: 'blocked',
      },
    ],
    audit: {
      eventId: 'audit-demo-003',
      actor: 'store-307@example.retail',
      device: 'front-kiosk-03',
      policy: 'retail-kiosk-runtime',
      decision: 'DEVICE_POSTURE_UNKNOWN',
      reason: 'posture_signal_stale_or_unavailable',
      remediation: 'refresh_telemetry_or_request_supervisor_review',
    },
  },
];

export function getDemoScenario(scenarioId: string): DemoScenario | undefined {
  return demoScenarios.find((scenario) => scenario.id === scenarioId);
}

function buildActions(scenario: DemoScenario): DemoAction[] {
  if (scenario.outcome === 'ACCESS_GRANTED') {
    return [
      { type: 'launch_app', params: { appBundleId: 'com.example.enterpriseapp' }, simulated: true },
      { type: 'set_session_ttl', params: { seconds: 900 }, simulated: true },
    ];
  }

  if (scenario.outcome === 'DEVICE_NON_COMPLIANT') {
    return [
      { type: 'show_remediation', params: { reason: scenario.audit.reason }, simulated: true },
      { type: 'open_it_queue_preview', params: { priority: 'high' }, simulated: true },
    ];
  }

  return [{ type: 'refresh_posture_required', params: { maxTelemetryAgeMinutes: 15 }, simulated: true }];
}

export function createDemoSessionResult(scenario: DemoScenario): DemoSessionResult {
  const session: DemoSessionShape = {
    sessionId: `demo-session-${scenario.id}`,
    expiresAt: '2026-01-01T00:15:00.000Z',
    nextAction: 'LAUNCH_APP',
    bundleId: 'com.example.enterpriseapp',
  };
  const granted = scenario.outcome === 'ACCESS_GRANTED';
  const deniedCode: Exclude<DemoOutcome, 'ACCESS_GRANTED'> | undefined =
    scenario.outcome === 'ACCESS_GRANTED' ? undefined : scenario.outcome;

  return {
    success: granted,
    decision: granted ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
    ...(granted ? { session } : {}),
    ...(deniedCode
      ? {
          error: deniedCode === 'DEVICE_NON_COMPLIANT' ? 'Device non-compliant' : 'Device posture unknown',
          code: deniedCode,
        }
      : {}),
    actions: buildActions(scenario),
    riskScore: scenario.riskScore,
    riskLevel: scenario.riskLevel,
    demo: {
      simulated: true,
      demoMode: true,
      scenarioId: scenario.id,
      outcome: scenario.outcome,
      simulatedHttpStatus: scenario.simulatedHttpStatus,
      safe: {
        deterministicDataOnly: true,
        webhooksCalled: false,
        productionDataMutated: false,
        secretsExposed: false,
      },
      operatorMessage: scenario.operatorMessage,
      signals: scenario.signals,
      timeline: scenario.timeline,
      audit: scenario.audit,
    },
  };
}
