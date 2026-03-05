// WebAuthn Registration Options API
// Generate registration options for security key (YubiKey)

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { generateRegistrationOptions } from '@/lib/auth/webauthn/server';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    // Get user info from auth header (in production from JWT)
    const userId = request.headers.get('x-user-id') || 'admin-user';
    const userEmail = request.headers.get('x-user-email') || 'admin@example.com';
    const displayName = request.headers.get('x-user-name') || 'Admin User';

    const options = await generateRegistrationOptions(
      userId,
      userEmail,
      displayName
    );

    return NextResponse.json({ options });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
