// Device Identity Admin API
// GET /api/admin/devices/identity/:deviceId

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { 
  resolveDeviceIdentity, 
  getDeviceIdentityByDeviceId,
  listDeviceIdentities,
  deleteDeviceIdentity,
  DeviceIdentity 
} from '@/lib/identity/deviceIdentity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { deviceId } = await params;
    
    // List all identities if deviceId is 'all'
    if (deviceId === 'all') {
      const identities = await listDeviceIdentities();
      return NextResponse.json({
        identities,
        total: identities.length,
      });
    }
    
    // Get identity by deviceId
    const identity = await getDeviceIdentityByDeviceId(deviceId);
    
    if (!identity) {
      return NextResponse.json(
        { error: 'Device identity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(identity);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeviceIdentity] GET error:', message);
    return NextResponse.json(
      { error: 'Failed to get device identity', details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json() as Partial<{
      deviceId: string;
      serial: string;
      udid: string;
      managementId: string;
      fleetHostId: string;
      hostname: string;
      platform: string;
      osVersion: string;
      deviceModel: string;
      managementSource: DeviceIdentity['managementSource'];
    }>;
    
    if (!body.deviceId && !body.serial) {
      return NextResponse.json(
        { error: 'deviceId or serial is required' },
        { status: 400 }
      );
    }
    
    const identity = await resolveDeviceIdentity({
      deviceId: body.deviceId,
      serial: body.serial,
      udid: body.udid,
      managementId: body.managementId,
      fleetHostId: body.fleetHostId,
      hostname: body.hostname,
      platform: body.platform,
      osVersion: body.osVersion,
      deviceModel: body.deviceModel,
      managementSource: body.managementSource,
    });
    
    return NextResponse.json({
      success: true,
      identity,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeviceIdentity] POST error:', message);
    return NextResponse.json(
      { error: 'Failed to create device identity', details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { deviceId } = await params;
    
    // First get the identity to find the identityId
    const identity = await getDeviceIdentityByDeviceId(deviceId);
    
    if (!identity) {
      return NextResponse.json(
        { error: 'Device identity not found' },
        { status: 404 }
      );
    }
    
    const deleted = await deleteDeviceIdentity(identity.identityId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete device identity' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Device identity deleted',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeviceIdentity] DELETE error:', message);
    return NextResponse.json(
      { error: 'Failed to delete device identity', details: message },
      { status: 500 }
    );
  }
}
