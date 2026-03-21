/**
 * Devices API v1
 * GET /api/v1/devices - List devices with pagination
 * 
 * Public API for third-party integration
 * Requires authentication (JWT or API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { deviceRegistry } from '@/lib/deviceRegistry';

export const dynamic = 'force-dynamic';

/**
 * List devices with pagination
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const enrolledFilter = searchParams.get('enrolled');

    // Get all devices
    const allDevices = await deviceRegistry.list();

    // Apply filters
    let filtered = allDevices;
    if (enrolledFilter !== null) {
      const enrolled = enrolledFilter === 'true';
      filtered = allDevices.filter(d => d.enrolled === enrolled);
    }

    // Apply pagination
    const total = filtered.length;
    const devices = filtered.slice(offset, offset + limit);

    return NextResponse.json(
      {
        devices,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DevicesAPI] Error:', message);
    
    return NextResponse.json(
      {
        error: 'Failed to list devices',
        code: 'LIST_DEVICES_ERROR',
        requestId: request.headers.get('x-request-id'),
      },
      { status: 500 }
    );
  }
}
