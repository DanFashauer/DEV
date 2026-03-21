/**
 * Session Start API v1
 * POST /api/v1/session/start
 * 
 * Start a new session with device badge event
 * Requires HMAC-SHA256 signature validation
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

const TIMESTAMP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const DEVICE_SECRET = process.env.DEVICE_WEBHOOK_SECRET || 'dev-secret';

/**
 * Verify HMAC signature
 */
function verifySignature(
  payload: Record<string, unknown>,
  signature: string,
  secret: string
): boolean {
  const message = JSON.stringify(payload);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Validate timestamp is within acceptable window
 */
function isTimestampValid(timestamp: string): boolean {
  const eventTime = new Date(timestamp).getTime();
  const now = Date.now();
  const diff = Math.abs(now - eventTime);
  return diff < TIMESTAMP_WINDOW_MS;
}

export async function POST(request: NextRequest) {
  try {
    // Get signature from headers
    const signature = request.headers.get('X-Signature');
    if (!signature) {
      return NextResponse.json(
        {
          error: 'Missing signature',
          code: 'MISSING_SIGNATURE',
          requestId: request.headers.get('x-request-id'),
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as Record<string, unknown>;

    // Validate signature
    try {
      if (!verifySignature(body, signature, DEVICE_SECRET)) {
        return NextResponse.json(
          {
            error: 'Invalid signature',
            code: 'INVALID_SIGNATURE',
            requestId: request.headers.get('x-request-id'),
          },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Signature verification failed',
          code: 'SIGNATURE_VERIFICATION_ERROR',
          requestId: request.headers.get('x-request-id'),
        },
        { status: 401 }
      );
    }

    // Validate timestamp
    const timestamp = body.timestamp as string;
    if (!timestamp || !isTimestampValid(timestamp)) {
      return NextResponse.json(
        {
          error: 'Request timestamp is invalid or outside acceptable window',
          code: 'INVALID_TIMESTAMP',
          requestId: request.headers.get('x-request-id'),
        },
        { status: 401 }
      );
    }

    // Create session (minimal implementation for v1)
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json(
      {
        sessionId,
        timestamp: new Date().toISOString(),
        nextAction: 'CONTINUE',
        expiresIn: 3600,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SessionStartAPI] Error:', message);

    if (message.includes('JSON')) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          requestId: request.headers.get('x-request-id'),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create session',
        code: 'SESSION_CREATE_ERROR',
        requestId: request.headers.get('x-request-id'),
      },
      { status: 500 }
    );
  }
}
