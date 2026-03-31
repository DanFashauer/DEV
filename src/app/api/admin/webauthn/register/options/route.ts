// WebAuthn Registration Options API
// Generate registration options for security key (YubiKey)

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getWebAuthnRequestIdentity } from '../../requestIdentity';
import { generateRegistrationOptions } from '@/lib/auth/webauthn/server';

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

    const options = await generateRegistrationOptions(
      identity.userId,
      identity.userEmail,
      identity.displayName
    );

    return NextResponse.json({ options });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
