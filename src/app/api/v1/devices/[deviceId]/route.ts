/**
 * Device Detail API
 * GET /api/v1/devices/{deviceId}
 * 
 * Get a specific device by ID
 * Requires authentication (JWT or API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { deviceRegistry } from '@/lib/deviceRegistry';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { deviceId } = await params;
    const device = await deviceRegistry.get(deviceId);

    if (!device) {
      return NextResponse.json(
        {
          error: 'Device not found',
          code: 'DEVICE_NOT_FOUND',
          requestId: request.headers.get('x-request-id'),
        },
        { status: 404 }
      );
    }

    return NextResponse.json(device, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeviceDetailAPI] Error:', message);
    
    return NextResponse.json(
      {
        error: 'Failed to get device',
        code: 'GET_DEVICE_ERROR',
        requestId: request.headers.get('x-request-id'),
      },
      { status: 500 }
    );
  }
}
