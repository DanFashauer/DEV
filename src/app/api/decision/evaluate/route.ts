import { NextResponse } from 'next/server';
import { evaluateDecisionFlow } from '@/lib/decision/engine';
import type { DecisionRequest } from '@/lib/decision/types';

export const runtime = 'nodejs';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasRequiredInputs(payload: unknown): payload is DecisionRequest {
  if (!isObject(payload)) {
    return false;
  }

  const hasTopLevel = Boolean(payload.user && payload.device && payload.session && payload.context && payload.action && payload.app);
  if (!hasTopLevel) {
    return false;
  }

  const user = payload.user as Record<string, unknown>;
  const device = payload.device as Record<string, unknown>;
  const session = payload.session as Record<string, unknown>;
  const app = payload.app as Record<string, unknown>;
  const action = payload.action as Record<string, unknown>;

  return Boolean(user.id && device.id && session.id && app.id && action.type);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;

    if (!hasRequiredInputs(payload)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields. Required: user.id, device.id, session.id, app.id, action.type (and top-level user/device/session/app/context/action)',
        },
        { status: 400 }
      );
    }

    const decision = await evaluateDecisionFlow(payload);

    return NextResponse.json({
      success: true,
      ...decision,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request payload',
        details: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 400 }
    );
  }
}
