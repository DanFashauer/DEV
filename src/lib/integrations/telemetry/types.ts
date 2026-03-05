// FleetDM Telemetry Types
// Integrates with FleetDM for osquery-style device telemetry and compliance signals

export interface FleetDMHost {
  id: number;
  uuid: string;
  hostname: string;
  platform: 'darwin' | 'linux' | 'windows' | 'chrome';
  os_version: string;
  os_build: string;
  uptime: number;
  memory: number;
  cpu_type: string;
  cpu_brand: string;
  hardware_model: string;
  serial_number: string;
  last_enrolled_at: string;
  seen_time: string;
  distributed_interval: number;
  config_tls_refresh: number;
  logger_tls_period: number;
  team_id: number | null;
  team_name: string | null;
}

export interface FleetDMPolicy {
  id: number;
  name: string;
  description: string;
  query: string;
  resolution: string;
  platform: 'darwin' | 'linux' | 'windows' | 'chrome' | null;
  team_id: number | null;
}

export interface FleetDMPolicyResult {
  host_id: number;
  policy_id: number;
  policy_name: string;
  policy_response: 'pass' | 'fail';
  policy_updated_at: string;
}

export interface FleetDMQueryResult {
  host_id: number;
  rows: Record<string, unknown>[];
  error: string | null;
}

export interface FleetDMPostureSignal {
  hostUuid: string;
  platform: string;
  compliant: boolean;
  lastCheckAt: string;
  policies: {
    id: number;
    name: string;
    response: 'pass' | 'fail';
    updatedAt: string;
  }[];
  rawSignals?: Record<string, unknown>;
}

export interface FleetDMConfig {
  enabled: boolean;
  baseUrl: string;
  apiToken: string;
  teamId?: number;
  syncIntervalMs: number;
}

export type TelemetryMode = 'off' | 'optional' | 'required';

export interface TelemetryConfig {
  mode: TelemetryMode;
  fleetdm?: FleetDMConfig;
}

export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  mode: 'off',
};
