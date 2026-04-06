import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getDevicePosture } from '@/lib/integrations/uem/store';
import { UEMEnrollmentRequestSchema } from './schema';

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const rawBody = await request.json();
    const parsedBody = UEMEnrollmentRequestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Invalid enrollment payload',
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { deviceId, enrollmentStatus, observedAt, source, userId, metadata } = parsedBody.data;
    const posture = await getDevicePosture(deviceId);

    return NextResponse.json({
      success: true,
      enrollment: {
        deviceId,
        userId: userId ?? null,
        source: source ?? 'api',
        status: enrollmentStatus ?? posture?.enrollmentStatus ?? 'unknown',
        observedAt: observedAt ?? new Date().toISOString(),
        metadata: metadata ?? null,
      },
      posture,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
