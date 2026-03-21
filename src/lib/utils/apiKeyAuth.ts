/**
 * Simple API Key authentication for v1 public endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Check API key from X-API-Key header
 * Returns error response if missing or invalid, null if authorized
 */
export function checkApiKey(request: NextRequest): NextResponse<{ error: string; code: string; requestId: string | null }> | null {
  const apiKey = request.headers.get('X-API-Key');
  const envApiKey = process.env.ADMIN_API_KEY || (process.env.NODE_ENV !== 'production' ? 'dev-admin-key-12345' : '');

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Missing API key',
        code: 'MISSING_API_KEY',
        requestId: request.headers.get('x-request-id'),
      },
      { status: 401 }
    );
  }

  if (!envApiKey) {
    return NextResponse.json(
      {
        error: 'API key not configured',
        code: 'API_KEY_NOT_CONFIGURED',
        requestId: request.headers.get('x-request-id'),
      },
      { status: 500 }
    );
  }

  if (apiKey !== envApiKey) {
    return NextResponse.json(
      {
        error: 'Invalid API key',
        code: 'INVALID_API_KEY',
        requestId: request.headers.get('x-request-id'),
      },
      { status: 401 }
    );
  }

  // Authorized
  return null;
}
