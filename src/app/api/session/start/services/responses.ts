import { NextResponse } from 'next/server';

export function createDeniedDeviceResponse(params: {
  isFleetCompliant: boolean;
  isUEMCompliant: boolean;
  fleetContext: Record<string, unknown>;
  uemContext: Record<string, unknown>;
  policyActions: Array<{ type: string; params?: Record<string, unknown> }>;
}) {
  const { isFleetCompliant, isUEMCompliant, fleetContext, uemContext, policyActions } = params;

  return NextResponse.json(
    {
      // C-suite decision receipt
      decision: 'ACCESS_DENIED',
      reason: isFleetCompliant ? 'UEM compliance check failed' : 'FleetDM compliance check failed (jailbroken)',
      actions: policyActions.map((a) => ({ type: a.type, params: a.params })),
      devicePosture: {
        fleetCompliant: isFleetCompliant,
        uemCompliant: isUEMCompliant,
        fleetDetails: fleetContext,
        uemDetails: uemContext,
      },

      // Legacy/compatibility fields
      success: false,
      error: 'Device compliance check failed',
      code: 'DEVICE_NON_COMPLIANT',
      hint: 'Device must be compliant before accessing shared resources',
      complianceStatus: {
        fleetCompliant: isFleetCompliant,
        uemCompliant: isUEMCompliant,
        fleetDetails: fleetContext,
        uemDetails: uemContext,
      },
      policyActions: policyActions.length > 0 ? policyActions : undefined,
    },
    { status: 403 }
  );
}
