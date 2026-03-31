import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/adminAuth';

type RequestIdentity = {
  userId: string;
  userEmail: string;
  displayName: string;
};

const DEV_WEBAUTHN_IDENTITY_ENABLED =
  process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_BYPASS === 'true';

function buildDevIdentity(): RequestIdentity {
  return {
    userId: 'dev-admin-user',
    userEmail: 'dev-admin@example.local',
    displayName: 'Dev Admin User',
  };
}

export function getWebAuthnRequestIdentity(request: NextRequest): {
  identity: RequestIdentity | null;
  errorResponse: NextResponse | null;
} {
  const userId = getUserIdFromRequest(request);

  if (userId) {
    return {
      identity: {
        userId,
        userEmail: request.headers.get('x-user-email') ?? `${userId}@local.invalid`,
        displayName: request.headers.get('x-user-name') ?? userId,
      },
      errorResponse: null,
    };
  }

  if (DEV_WEBAUTHN_IDENTITY_ENABLED) {
    return {
      identity: buildDevIdentity(),
      errorResponse: null,
    };
  }

  return {
    identity: null,
    errorResponse: NextResponse.json(
      {
        error:
          'Missing user identity for WebAuthn request. Provide x-user-id or x-admin-api-key, or enable development bypass explicitly.',
      },
      { status: 401 }
    ),
  };
}
