import { getPostureForHost } from '@/lib/integrations/telemetry/store';

export type PostureStatus = 'compliant' | 'non_compliant' | 'unknown';

export type FleetContext = {
  status: PostureStatus;
  enrolled: boolean;
  lastSeenAge?: number;
};

export type UEMContext = {
  complianceStatus: PostureStatus;
  enrolled: boolean;
};

type PosturePayload = {
  compliant?: boolean;
  lastCheckAt?: string;
  rawSignals?: Record<string, unknown>;
};

function toStatus(compliant?: boolean): PostureStatus {
  if (compliant === true) return 'compliant';
  if (compliant === false) return 'non_compliant';
  return 'unknown';
}

function toLastSeenAge(lastCheckAt?: string): number | undefined {
  if (!lastCheckAt) return undefined;
  const ts = Date.parse(lastCheckAt);
  if (!Number.isFinite(ts)) return undefined;
  return Math.max(0, Date.now() - ts);
}

async function readPosture(deviceKey?: string): Promise<PosturePayload | null> {
  if (!deviceKey) return null;
  const cached = await getPostureForHost(deviceKey);
  if (!cached?.data || cached.expiresAt <= Date.now()) {
    return null;
  }
  return cached.data as PosturePayload;
}

export async function getFleetContext(deviceKey?: string): Promise<FleetContext> {
  const posture = await readPosture(deviceKey);
  if (!posture) {
    return { status: 'unknown', enrolled: false };
  }

  return {
    status: toStatus(posture.compliant),
    enrolled: true,
    lastSeenAge: toLastSeenAge(posture.lastCheckAt),
  };
}

export async function getUEMContext(deviceKey?: string): Promise<UEMContext> {
  const posture = await readPosture(deviceKey);
  if (!posture) {
    return { complianceStatus: 'unknown', enrolled: false };
  }

  return {
    complianceStatus: toStatus(posture.compliant),
    enrolled: true,
  };
}
