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

export async function getFleetContext(_deviceSerial?: string): Promise<FleetContext> {
  return { status: 'unknown', enrolled: false };
}

export async function getUEMContext(_deviceSerial?: string): Promise<UEMContext> {
  return { complianceStatus: 'unknown', enrolled: false };
}
