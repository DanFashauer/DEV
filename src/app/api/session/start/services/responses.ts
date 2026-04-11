import { NextResponse } from 'next/server';

export function createDeniedDeviceResponse() {
  return NextResponse.json(
    { success: false, decision: 'ACCESS_DENIED', error: 'Device non-compliant', code: 'DEVICE_NON_COMPLIANT' },
    { status: 403 }
  );
}
