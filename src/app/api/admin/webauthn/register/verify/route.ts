// WebAuthn Registration Verify API
// Verify and save security key credential

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
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

    // Get user info from auth header
    const userId = request.headers.get('x-user-id') || 'admin-user';

    const result = await verifyRegistration(userId, challengeId, response);

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
