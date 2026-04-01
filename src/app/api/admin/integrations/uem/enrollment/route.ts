// ============================================================================
// UEM Open Enrollment Webhook
// Accepts enrollment/compliance callbacks from ANY UEM
// Normalizes into DeviceRegistry metadata
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth } from '@/lib/adminAuth';
import { deviceRegistry } from '@/lib/deviceRegistry';

// ============================================================================
// Types
// ============================================================================

/**
 * Normalized device enrollment data from any UEM
 */
const UEMEnrollmentSchema = z.object({
  // Device identification
  deviceId: z.string(), // UEM-specific device ID
  serialNumber: z.string().optional(),
  udid: z.string().optional(), // iOS unique device identifier
  macAddress: z.string().optional(),
  imei: z.string().optional(),
  
  // Device info
  platform: z.enum(['ios', 'ipados', 'macos', 'android', 'windows', 'linux', 'chrome']),
  osVersion: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  hostname: z.string().optional(),
  
  // User info
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
  department: z.string().optional(),
  
  // Enrollment status
  enrollmentStatus: z.enum(['enrolled', 'unenrolled', 'pending', 'revoked']),
  enrollmentDate: z.string().datetime().optional(),
  
  // Compliance status
  complianceStatus: z.enum(['compliant', 'non_compliant', 'unknown', 'not_assessed']).optional(),
  complianceCheckDate: z.string().datetime().optional(),
  complianceDetails: z.record(z.unknown()).optional(),
  
  // MDM-specific data (preserved for reference)
  mdmProvider: z.string(), // e.g., 'intune', 'jamf', 'workspace-one'
  rawPayload: z.record(z.unknown()).optional(),
  
  // Timestamp
  eventTimestamp: z.string().datetime(),
});

type UEMEnrollment = z.infer<typeof UEMEnrollmentSchema>;

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
        (d.metadata as Record<string, any>)?.mdmProvider === mdmProvider
      );
    }
    
    if (complianceStatus) {
      filtered = filtered.filter(d => 
        (d.metadata as Record<string, any>)?.complianceStatus === complianceStatus
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
          mdmProvider: (d.metadata as Record<string, any>)?.mdmProvider,
          enrollmentStatus: (d.metadata as Record<string, any>)?.enrollmentStatus,
          complianceStatus: (d.metadata as Record<string, any>)?.complianceStatus,
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
