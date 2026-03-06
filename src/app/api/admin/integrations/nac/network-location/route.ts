// ============================================================================
// NAC Network Location Webhook
// Receives RADIUS accounting / DHCP lease data from NAC systems
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { handleNetworkLocationIngest, RADIUSAccountingSchema, DHCPLeaseSchema } from '@/lib/location/radius-dhcp';
import { z } from 'zod';

// ============================================================================
// POST Handler - Receive network location data
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get('type');
    
    const body = await request.json();
    
    if (!sourceType || !['radius', 'dhcp'].includes(sourceType)) {
      return NextResponse.json(
        { error: 'Missing or invalid type parameter. Use ?type=radius or ?type=dhcp' },
        { status: 400 }
      );
    }
    
    // Add received timestamp
    const data = {
      ...body,
      receivedAt: new Date().toISOString(),
    };
    
    const result = await handleNetworkLocationIngest(data, sourceType as 'radius' | 'dhcp');
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      location: result.location ? {
        deviceId: result.location.deviceId,
        mode: result.location.mode,
        zoneId: result.location.zoneId,
        buildingId: result.location.buildingId,
        floorId: result.location.floorId,
        source: result.location.source,
        observedAt: result.location.observedAt,
      } : null,
    });
  } catch (error) {
    console.error('Network location ingest error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
