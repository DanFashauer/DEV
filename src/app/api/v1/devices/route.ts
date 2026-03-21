/**
 * Devices API v1
 * GET /api/v1/devices - List devices with pagination
 * 
 * Public API for third-party integration
 * Requires authentication (JWT or API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkApiKey } from '@/lib/utils/apiKeyAuth';
import { deviceRegistry } from '@/lib/deviceRegistry';

export const dynamic = 'force-dynamic';

/**
 * List devices with pagination
 */
export async function GET(request: NextRequest) {
  const authError = checkApiKey(request);
  if (authError) {
    return authError;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const enrolledFilter = searchParams.get('enrolled');

    console.log('[DevicesAPI] Getting devices, limit:', limit, 'offset:', offset, 'enrolledFilter:', enrolledFilter);
    
    // Get all devices
    const allDevices = await deviceRegistry.list();
    console.log('[DevicesAPI] Found devices:', allDevices.length);

    // Apply filters
    let filtered = allDevices;
    if (enrolledFilter !== null) {
      const enrolled = enrolledFilter === 'true';
      filtered = allDevices.filter(d => d.enrolled === enrolled);
      console.log('[DevicesAPI] After filtering enrolled=' + enrolled + ':', filtered.length);
    }

    // Apply pagination
    const total = filtered.length;
    const devices = filtered.slice(offset, offset + limit);
    console.log('[DevicesAPI] After pagination:', devices.length, 'total:', total);

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
    console.error('[DevicesAPI] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to list devices',
        code: 'LIST_DEVICES_ERROR',
        requestId: request.headers.get('x-request-id'),
        details: message,
      },
      { status: 500 }
    );
  }
}
