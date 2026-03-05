// WebAuthn Authentication Verify API
// Verify step-up authentication and create session

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { verifyAuthentication, createStepUp } from '@/lib/auth/webauthn/server';
import { appendAuditRecord } from '@/lib/auditLedger';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    
    const { challengeId, response, ttlSeconds } = body;

    if (!challengeId || !response) {
      return NextResponse.json(
        { error: 'challengeId and response are required' },
        { status: 400 }
      );
    }

    // Get user info from auth header
    const userId = request.headers.get('x-user-id') || 'admin-user';

    const result = await verifyAuthentication(userId, challengeId, response);

    if (!result.success) {
      // Audit failure
      await appendAuditRecord(
        'security.webauthn.step_up.failure',
        { type: 'user', id: userId },
        { meta: { error: result.error } }
      );

      return NextResponse.json(
        { error: result.error, success: false },
        { status: 401 }
      );
    }

    // Create step-up session
    const stepUp = await createStepUp(
      userId,
      ttlSeconds as number || 300,
      'Admin portal step-up authentication'
    );

    return NextResponse.json({
      success: true,
      stepUpSession: {
        sessionId: stepUp.sessionId,
        expiresAt: stepUp.expiresAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
