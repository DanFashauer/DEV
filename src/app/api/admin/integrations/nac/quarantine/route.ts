// NAC Quarantine Action API Route
// POST /api/admin/integrations/nac/quarantine
// Apply or clear quarantine on a network endpoint

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { applyQuarantine, clearQuarantine, lookupEndpoint } from '@/lib/integrations/nac/store';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json() as {
      action: 'quarantine' | 'unquarantine' | 'lookup';
      deviceId: string;
      macAddress?: string;
      reason?: string;
      vlan?: string;
      networkProfile?: string;
    };

    const { action, deviceId, macAddress, reason, vlan, networkProfile } = body;

    if (!deviceId && !macAddress) {
      return NextResponse.json(
        { error: 'deviceId or macAddress is required' },
        { status: 400 }
      );
    }

    const identifier = deviceId ?? macAddress ?? '';

    switch (action) {
      case 'lookup': {
        const endpoint = await lookupEndpoint(identifier, (macAddress ? 'mac' : 'serial') as 'mac' | 'serial');
        return NextResponse.json({
          success: true,
          endpoint,
        });
      }

      case 'quarantine': {
        const result = await applyQuarantine(identifier, reason ?? undefined, {
          vlan,
          networkProfile,
          correlationId: `nac-${Date.now()}`,
        });
        return NextResponse.json(result);
      }

      case 'unquarantine': {
        const result = await clearQuarantine(identifier, reason ?? undefined);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: quarantine, unquarantine, or lookup' },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
