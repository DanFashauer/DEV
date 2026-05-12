import { NextResponse } from 'next/server';
import { createDemoSessionResult, demoScenarios, getDemoScenario } from '@/lib/demo/scenarios';

export const dynamic = 'force-dynamic';

type DemoSessionStartBody = {
  scenarioId?: unknown;
};

function isObject(value: unknown): value is DemoSessionStartBody {
  return typeof value === 'object' && value !== null;
}

export async function GET() {
  return NextResponse.json({
    demo: {
      simulated: true,
      demoMode: true,
      safe: {
        deterministicDataOnly: true,
        webhooksCalled: false,
        productionDataMutated: false,
        secretsExposed: false,
      },
    },
    scenarios: demoScenarios.map((scenario) => ({
      id: scenario.id,
      label: scenario.label,
      cardTitle: scenario.cardTitle,
      outcome: scenario.outcome,
      summary: scenario.summary,
      simulatedHttpStatus: scenario.simulatedHttpStatus,
    })),
  });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const scenarioId = isObject(body) && typeof body.scenarioId === 'string' ? body.scenarioId : '';
  const scenario = getDemoScenario(scenarioId);

  if (!scenario) {
    return NextResponse.json(
      {
        success: false,
        decision: 'ACCESS_DENIED',
        error: 'Invalid demo scenario',
        code: 'INVALID_DEMO_SCENARIO',
        message: 'Choose one of the deterministic demo scenarios before starting a demo session.',
        demo: {
          simulated: true,
          demoMode: true,
          safe: {
            deterministicDataOnly: true,
            webhooksCalled: false,
            productionDataMutated: false,
            secretsExposed: false,
          },
        },
        validScenarioIds: demoScenarios.map((item) => item.id),
      },
      { status: 400 },
    );
  }

  return NextResponse.json(createDemoSessionResult(scenario));
}
