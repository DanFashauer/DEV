// WebAuthn Registration Verify API
// Verify and save security key credential

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getWebAuthnRequestIdentity } from '../../requestIdentity';
import { verifyRegistration } from '@/lib/auth/webauthn/server';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    
    const { challengeId, response } = body;

    if (!challengeId || !response) {
      return NextResponse.json(
        { error: 'challengeId and response are required' },
        { status: 400 }
      );
    }

    const { identity, errorResponse } = getWebAuthnRequestIdentity(request);
    if (!identity) {
      return errorResponse!;
    }

    const result = await verifyRegistration(identity.userId, challengeId, response);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      credentialId: result.credentialId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
