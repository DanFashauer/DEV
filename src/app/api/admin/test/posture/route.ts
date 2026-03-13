/**
 * Test Posture Admin API Route
 * 
 * POST /api/admin/test/posture
 * Sets posture data for a device directly (for testing/demo purposes)
 * 
 * Body: {
 *   deviceId: string,
 *   compliant: boolean,
 *   violations?: string[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { setPostureForHost } from '@/lib/integrations/telemetry/store';

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const { deviceId, compliant, violations } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }

    const postureData = {
      platform: 'darwin',
      compliant: compliant ?? false,
      lastCheckAt: new Date().toISOString(),
      policies: violations?.map((v: string) => ({
        id: Math.floor(Math.random() * 1000),
        name: v,
        response: compliant ? 'pass' : 'fail',
        updatedAt: new Date().toISOString(),
      })) ?? [],
      rawSignals: {
        jailbroken: !compliant,
        os_version: '17.2',
        serial_number: deviceId,
      },
    };

    await setPostureForHost(deviceId, postureData);

    return NextResponse.json({
      success: true,
      deviceId,
      compliant,
      violations,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
