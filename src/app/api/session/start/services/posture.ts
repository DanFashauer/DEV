import { getFleetDMAdapter } from '@/lib/integrations/telemetry/fleetdm';
import { getPostureForHost } from '@/lib/integrations/telemetry/store';
import { getDevicePosture } from '@/lib/integrations/uem/store';

type StoredFleetPosture = {
  platform: string;
  compliant: boolean;
  lastCheckAt: string;
  policies: { id: number; name: string; response: string }[];
  rawSignals?: Record<string, unknown>;
};

function mapStoredFleetPosture(posture: StoredFleetPosture): Record<string, unknown> {
  return {
    enrolled: true,
    status: posture.compliant ? 'compliant' : 'non_compliant',
    lastSeenAge: Date.now() - new Date(posture.lastCheckAt).getTime(),
    osVersion: (posture.rawSignals?.os_version as string) || 'unknown',
    platform: posture.platform,
    policies: posture.policies,
    labels: [],
  };
}

/**
 * Build UEM context for policy evaluation
 * Fetches device posture from configured UEM (Intune, Jamf, Workspace ONE)
 */
export async function getUEMContext(deviceId: string): Promise<Record<string, unknown>> {
  try {
    const posture = await getDevicePosture(deviceId);

    if (!posture) {
      return { enrolled: false };
    }

    return {
      enrolled: posture.enrollmentStatus === 'enrolled',
      complianceStatus: posture.complianceStatus,
      platform: posture.platform,
      osVersion: posture.osVersion,
      managementId: posture.managementId,
      attest: posture.attest,
      signals: posture.signals,
    };
  } catch (error) {
    console.error('[SessionStart] Failed to get UEM context:', error);
    return { enrolled: false };
  }
}

/**
 * Fetches cached FleetDM posture data if available
 * Also checks posture store directly by deviceSerial or deviceId for demo/testing
 */
export async function getFleetContext(deviceSerial: string, deviceId?: string): Promise<Record<string, unknown>> {
  try {
    // First, check posture store directly by deviceSerial (for demo/testing)
    const directPosture = await getPostureForHost(deviceSerial);
    if (directPosture) {
      return mapStoredFleetPosture(directPosture.data as StoredFleetPosture);
    }

    // Also check by deviceId (for demo/testing where deviceId is used as host identifier)
    if (deviceId) {
      const postureById = await getPostureForHost(deviceId);
      if (postureById) {
        return mapStoredFleetPosture(postureById.data as StoredFleetPosture);
      }
    }

    // Fall back to FleetDM adapter
    const adapter = await getFleetDMAdapter();

    if (!adapter.isEnabled()) {
      return { enrolled: false };
    }

    // Get all hosts and find matching by serial
    const hosts = await adapter.getHosts();
    const host = hosts.find((h) => h.serial_number === deviceSerial);

    if (!host) {
      return { enrolled: false };
    }

    // Get cached posture
    const cached = await getPostureForHost(host.uuid);

    if (!cached) {
      return {
        enrolled: true,
        status: 'unknown',
        lastSeenAge: Date.now() - new Date(host.seen_time).getTime(),
        osVersion: host.os_version,
      };
    }

    const posture = cached.data as StoredFleetPosture;

    return {
      enrolled: true,
      status: posture.compliant ? 'compliant' : 'non_compliant',
      lastSeenAge: Date.now() - new Date(host.seen_time).getTime(),
      osVersion: posture.rawSignals?.os_version || host.os_version,
      platform: posture.platform,
      policies: posture.policies,
      labels: [], // Would need additional API call
    };
  } catch (error) {
    console.error('[SessionStart] Failed to get fleet context:', error);
    return { enrolled: false };
  }
}
