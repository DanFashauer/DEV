/**
 * Location Report API v1
 * POST /api/v1/location/report
 * 
 * Report device location (GPS, WiFi, BLE, etc.)
 * Requires HMAC-SHA256 signature validation
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

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
 * Validate coordinate ranges
 */
function isValidCoordinate(lat: unknown, lon: unknown): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return false;
  }
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
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

    // Validate coordinates if present
    const lat = body.lat;
    const lon = body.lon;

    if ((lat !== undefined || lon !== undefined) && !isValidCoordinate(lat, lon)) {
      return NextResponse.json(
        {
          error: 'Invalid coordinates',
          code: 'INVALID_COORDINATES',
          details: 'latitude must be between -90 and 90, longitude must be between -180 and 180',
          requestId: request.headers.get('x-request-id'),
        },
        { status: 400 }
      );
    }

    // Store location (minimal implementation for v1)
    const locationId = `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json(
      {
        ok: true,
        locationId,
        timestamp: new Date().toISOString(),
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
    console.error('[LocationReportAPI] Error:', message);

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
        error: 'Failed to report location',
        code: 'LOCATION_REPORT_ERROR',
        requestId: request.headers.get('x-request-id'),
      },
      { status: 500 }
    );
  }
}
