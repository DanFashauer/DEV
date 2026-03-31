import { NextResponse } from 'next/server';
import { evaluateDecisionFlow } from '@/lib/decision/engine';
import { REQUIRED_DECISION_FIELDS, type DecisionRequest, type RequiredDecisionField } from '@/lib/decision/types';

export const runtime = 'nodejs';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateDecisionRequest(payload: unknown): { valid: boolean; missingFields: RequiredDecisionField[] } {
  if (!isObject(payload)) {
    return { valid: false, missingFields: [...REQUIRED_DECISION_FIELDS] };
  }

  const hasTopLevel = Boolean(payload.user && payload.device && payload.session && payload.context && payload.action && payload.app);
  if (!hasTopLevel) {
    return { valid: false, missingFields: [...REQUIRED_DECISION_FIELDS] };
  }

  const user = payload.user as Record<string, unknown>;
  const device = payload.device as Record<string, unknown>;
  const session = payload.session as Record<string, unknown>;
  const app = payload.app as Record<string, unknown>;
  const action = payload.action as Record<string, unknown>;
  const missingFields: RequiredDecisionField[] = [];

  if (!isNonEmptyString(user.id)) missingFields.push('user.id');
  if (!isNonEmptyString(device.id)) missingFields.push('device.id');
  if (!isNonEmptyString(session.id)) missingFields.push('session.id');
  if (!isNonEmptyString(app.id)) missingFields.push('app.id');
  if (!isNonEmptyString(action.type)) missingFields.push('action.type');

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;

    const validation = validateDecisionRequest(payload);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields. Required: ${REQUIRED_DECISION_FIELDS.join(', ')}`,
          missingFields: validation.missingFields,
        },
        { status: 400 }
      );
    }

    const decision = await evaluateDecisionFlow(payload as DecisionRequest);

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
