// WebAuthn Authentication Options API
// Generate authentication options for step-up auth

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getWebAuthnRequestIdentity } from '../../requestIdentity';
import { generateAuthenticationOptions } from '@/lib/auth/webauthn/server';
import { hasWebAuthnCredentials } from '@/lib/auth/webauthn/store';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { identity, errorResponse } = getWebAuthnRequestIdentity(request);
    if (!identity) {
      return errorResponse!;
    }

    // Get user's credentials first to check if they have any
    const hasCredentials = await hasWebAuthnCredentials(identity.userId);

    if (!hasCredentials) {
      return NextResponse.json(
        { error: 'No security keys registered. Please register a security key first.' },
        { status: 400 }
      );
    }

    const options = await generateAuthenticationOptions(identity.userId);

    return NextResponse.json({ options });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
