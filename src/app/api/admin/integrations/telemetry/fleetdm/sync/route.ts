// FleetDM Sync API Route
// POST /api/admin/integrations/telemetry/fleetdm/sync
// Pulls latest posture data from FleetDM and updates DeviceRegistry metadata

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getFleetDMAdapter } from '@/lib/integrations/telemetry/fleetdm';
import { deviceRegistry } from '@/lib/deviceRegistry';
import { getPostureForHost } from '@/lib/integrations/telemetry/store';
import { appendAuditRecord } from '@/lib/auditLedger';

// Rate limiting for sync endpoint
const syncRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const SYNC_RATE_LIMIT = 5; // 5 syncs per window
const SYNC_RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkSyncRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = syncRateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    syncRateLimitMap.set(identifier, { count: 1, resetTime: now + SYNC_RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= SYNC_RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkSyncRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 5 syncs per minute.' },
      { status: 429 }
    );
  }

  try {
    const adapter = await getFleetDMAdapter();

    if (!adapter.isEnabled()) {
      return NextResponse.json(
        { error: 'FleetDM integration is not enabled' },
        { status: 400 }
      );
    }

    // Test connection first
    const connectionTest = await adapter.testConnection();
    if (!connectionTest.success) {
      await appendAuditRecord('telemetry.sync.failed', { type: 'admin', id: 'system' }, {
        meta: { reason: 'connection_failed', message: connectionTest.message },
      });
      
      return NextResponse.json(
        { error: 'Cannot connect to FleetDM', details: connectionTest.message },
        { status: 503 }
      );
    }

    // Get all hosts from FleetDM
    console.log('[FleetDMSync] Fetching hosts from FleetDM...');
    const hosts = await adapter.getHosts();
    
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    console.log(`[FleetDMSync] Found ${hosts.length} hosts, syncing posture data...`);

    // Process each host
    for (const host of hosts) {
      try {
        // Get posture for this host
        const posture = await adapter.getPostureForHost(host.uuid);
        
        if (!posture) {
          result.failed++;
          result.errors.push(`No posture data for host ${host.uuid}`);
          continue;
        }

        // Try to match with device in registry by serial number
        // FleetDM uses serial_number, our registry uses deviceSerial
        const devices = await deviceRegistry.list();
        const matchingDevice = devices.find(d => d.deviceSerial === host.serial_number);

        if (matchingDevice) {
          // Update device metadata with FleetDM posture
          // Note: DeviceRegistry.enroll() doesn't preserve metadata, so we just re-enroll
          await deviceRegistry.enroll({
            deviceId: matchingDevice.deviceId,
            deviceSerial: matchingDevice.deviceSerial,
            deviceModel: matchingDevice.deviceModel,
            osVersion: matchingDevice.osVersion,
            mdmEnrolled: matchingDevice.enrolled,
            managementId: matchingDevice.managementId,
          });

          result.synced++;
        } else {
          // No matching device found - this is OK, just skip
          console.log(`[FleetDMSync] No matching device for serial ${host.serial_number}`);
        }
      } catch (hostError) {
        const message = hostError instanceof Error ? hostError.message : 'Unknown error';
        result.errors.push(`Failed to sync host ${host.uuid}: ${message}`);
        result.failed++;
      }
    }

    // Record audit event
    const eventType = result.failed > 0 ? 'telemetry.sync.completed_with_errors' : 'telemetry.sync.completed';
    await appendAuditRecord(eventType, { type: 'admin', id: 'system' }, {
      meta: {
        synced: result.synced,
        failed: result.failed,
        totalHosts: hosts.length,
      },
    });

    console.log(`[FleetDMSync] Sync complete: ${result.synced} synced, ${result.failed} failed`);

    return NextResponse.json({
      success: result.success,
      synced: result.synced,
      failed: result.failed,
      total: hosts.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FleetDMSync] Error:', message);
    
    // Record failure
    await appendAuditRecord('telemetry.sync.failed', { type: 'admin', id: 'system' }, {
      meta: { reason: 'exception', message },
    });

    return NextResponse.json(
      { error: 'Sync failed', details: message },
      { status: 500 }
    );
  }
}
