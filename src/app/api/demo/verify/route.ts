import { NextRequest, NextResponse } from 'next/server';
import { getSecurityEvents } from '@/lib/securityEvents';
import {
  createDemoSessionResult,
  demoScenarios,
  type DemoScenario,
  type DemoScenarioId,
} from '@/lib/demo/scenarios';

export const dynamic = 'force-dynamic';

type ScenarioSelector = DemoScenarioId | 'all';

type ScenarioCheck = {
  name: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
};

function passFail(checks: ScenarioCheck[]) {
  return checks.every((check) => check.passed) ? 'PASS' : 'FAIL';
}

function expectedDecisionFor(scenario: DemoScenario) {
  return scenario.outcome === 'ACCESS_GRANTED' ? 'ACCESS_GRANTED' : 'ACCESS_DENIED';
}

function verifyScenario(scenario: DemoScenario) {
  const result = createDemoSessionResult(scenario);
  const checks: ScenarioCheck[] = [
    {
      name: 'expected_outcome',
      expected: scenario.outcome,
      actual: result.demo.outcome,
      passed: result.demo.outcome === scenario.outcome,
    },
    {
      name: 'expected_decision',
      expected: expectedDecisionFor(scenario),
      actual: result.decision,
      passed: result.decision === expectedDecisionFor(scenario),
    },
    {
      name: 'expected_simulated_http_status',
      expected: scenario.simulatedHttpStatus,
      actual: result.demo.simulatedHttpStatus,
      passed: result.demo.simulatedHttpStatus === scenario.simulatedHttpStatus,
    },
    {
      name: 'deterministic_demo_data_only',
      expected: true,
      actual: result.demo.safe.deterministicDataOnly,
      passed: result.demo.safe.deterministicDataOnly === true,
    },
    {
      name: 'no_webhook_calls',
      expected: false,
      actual: result.demo.safe.webhooksCalled,
      passed: result.demo.safe.webhooksCalled === false,
    },
    {
      name: 'no_production_mutation',
      expected: false,
      actual: result.demo.safe.productionDataMutated,
      passed: result.demo.safe.productionDataMutated === false,
    },
    {
      name: 'no_secret_exposure',
      expected: false,
      actual: result.demo.safe.secretsExposed,
      passed: result.demo.safe.secretsExposed === false,
    },
  ];

  return {
    scenario: scenario.id,
    status: passFail(checks),
    expected: {
      outcome: scenario.outcome,
      decision: expectedDecisionFor(scenario),
      simulatedHttpStatus: scenario.simulatedHttpStatus,
    },
    actual: {
      outcome: result.demo.outcome,
      decision: result.decision,
      simulatedHttpStatus: result.demo.simulatedHttpStatus,
      success: result.success,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
    },
    checks,
    demo: {
      simulated: result.demo.simulated,
      demoMode: result.demo.demoMode,
      safe: result.demo.safe,
      operatorMessage: result.demo.operatorMessage,
    },
  };
}

function legacyTimelineVerification() {
  const events = getSecurityEvents(50);
  const demoMode = process.env.DEMO_MODE === 'true';

  const sessionDenied = events.find((event) => event.type === 'session_denied');
  const sessionAllowed = events.find((event) => event.type === 'session_allowed');
  const latestDecision = sessionDenied || sessionAllowed;

  const hasBadgeScan = events.some((event) => event.type === 'session_denied' || event.type === 'session_allowed');
  const hasQuarantine = events.some((event) => event.type === 'quarantine');
  const hasSiem = events.some((event) => event.type === 'siem_alert');
  const hasItsm = events.some((event) => event.type === 'itsm_ticket');

  const timelineComplete = hasBadgeScan && hasQuarantine && hasSiem && hasItsm;
  const status = sessionDenied && timelineComplete ? 'PASS' : 'FAIL';

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
    lastEvent: latestDecision
      ? {
          id: latestDecision.id,
          type: latestDecision.type,
          decision: latestDecision.decision,
          timestamp: latestDecision.timestamp,
        }
      : null,
    eventCounts: {
      total: events.length,
      denied: events.filter((event) => event.decision === 'DENY').length,
      allowed: events.filter((event) => event.decision === 'ALLOW').length,
      quarantined: events.filter((event) => event.type === 'quarantine').length,
      siemAlerts: events.filter((event) => event.type === 'siem_alert').length,
      itsmTickets: events.filter((event) => event.type === 'itsm_ticket').length,
    },
  });
}

function isScenarioSelector(value: string): value is ScenarioSelector {
  return value === 'all' || demoScenarios.some((scenario) => scenario.id === value);
}

export async function GET(request: NextRequest) {
  const selector = new URL(request.url).searchParams.get('scenario');

  if (!selector) {
    return legacyTimelineVerification();
  }

  if (!isScenarioSelector(selector)) {
    return NextResponse.json(
      {
        status: 'FAIL',
        code: 'INVALID_DEMO_SCENARIO',
        error: 'Invalid demo verification scenario',
        validScenarios: [...demoScenarios.map((scenario) => scenario.id), 'all'],
        demo: {
          simulated: true,
          safe: {
            deterministicDataOnly: true,
            webhooksCalled: false,
            productionDataMutated: false,
            secretsExposed: false,
          },
        },
      },
      { status: 400 },
    );
  }

  const selectedScenarios = selector === 'all'
    ? demoScenarios
    : demoScenarios.filter((scenario) => scenario.id === selector);

  const results = selectedScenarios.map(verifyScenario);
  const failed = results.filter((result) => result.status !== 'PASS');
  const status = failed.length === 0 ? 'PASS' : 'FAIL';

  return NextResponse.json({
    status,
    scenario: selector,
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    results,
    demo: {
      simulated: true,
      safe: {
        deterministicDataOnly: true,
        webhooksCalled: false,
        productionDataMutated: false,
        secretsExposed: false,
      },
    },
  });
}
