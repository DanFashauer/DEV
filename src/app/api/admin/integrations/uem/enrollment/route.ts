// ============================================================================
// UEM Open Enrollment Webhook
// Accepts enrollment/compliance callbacks from ANY UEM
// Normalizes into DeviceRegistry metadata
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth } from '@/lib/adminAuth';
import { deviceRegistry } from '@/lib/deviceRegistry';
import { UEMEnrollmentSchema } from './schema';

// ============================================================================
// POST Handler - Receive enrollment webhook
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    const body = await request.json();
    
    // Validate incoming data
    const enrollment = UEMEnrollmentSchema.parse(body);
    
    // Enroll the device
    await deviceRegistry.enroll({
      deviceId: enrollment.deviceId,
      deviceSerial: enrollment.serialNumber || '',
      deviceModel: enrollment.model || enrollment.platform,
      osVersion: enrollment.osVersion || '',
      mdmEnrolled: enrollment.enrollmentStatus === 'enrolled',
    });
    
    return NextResponse.json({
      success: true,
      message: 'Device enrolled successfully',
      deviceId: enrollment.deviceId,
    });
  } catch (error) {
    console.error('UEM enrollment webhook error:', error);
    
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

// ============================================================================
// GET Handler - List enrolled devices from UEM webhooks
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const mdmProvider = searchParams.get('mdmProvider');
    const complianceStatus = searchParams.get('complianceStatus');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Get all devices and filter
    const devices = await deviceRegistry.list();
    
    let filtered = devices;
    
    if (mdmProvider) {
      filtered = filtered.filter(d => 
        (d.metadata as Record<string, unknown>)?.mdmProvider === mdmProvider
      );
    }
    
    if (complianceStatus) {
      filtered = filtered.filter(d => 
        (d.metadata as Record<string, unknown>)?.complianceStatus === complianceStatus
      );
    }
    
    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);
    
    return NextResponse.json({
      devices: paginated.map(d => ({
        deviceId: d.deviceId,
        osVersion: d.osVersion,
        enrolled: d.enrolled,
        enrolledAt: d.enrolledAt,
        metadata: {
          mdmProvider: (d.metadata as Record<string, unknown>)?.mdmProvider,
          enrollmentStatus: (d.metadata as Record<string, unknown>)?.enrollmentStatus,
          complianceStatus: (d.metadata as Record<string, unknown>)?.complianceStatus,
          serialNumber: d.deviceSerial,
        },
      })),
      total: filtered.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('UEM enrollment list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
