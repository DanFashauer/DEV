/**
 * BadgeEvent v1 frozen schema types
 * 
 * Schema Version: 1.0
 * Status: FROZEN - Do not modify field names or types
 * 
 * This schema defines the event structure for badge scan events
 * sent from iOS kiosk app to the backend.
 */

export interface BadgeData {
  readonly badgeId: string;
  readonly employeeId?: string;
  readonly cardSerialNumber?: string;
}

export interface ReaderData {
  readonly readerId: string;
  readonly readerType: 'ble' | 'usb' | 'nfc';
  readonly readerName?: string;
}

export interface DeviceData {
  readonly deviceId: string;
  readonly deviceSerial: string;
  readonly deviceModel: string;
  readonly osVersion: string;
}

export interface MDMData {
  readonly enrolled: boolean;
  readonly managementId?: string;
  readonly personaAttributes?: Record<string, string>;
}

export interface EventContext {
  readonly locationId?: string;
  readonly locationName?: string;
  readonly applicationId?: string;
}

/**
 * BadgeEvent v1 - frozen schema
 * Used for badge scan authentication events
 */
export interface BadgeEvent {
  readonly schemaVersion: '1.0';
  readonly eventType: 'badge.scan';
  readonly eventId: string;        // UUIDv4
  readonly timestamp: string;       // ISO-8601
  readonly badge: BadgeData;
  readonly reader: ReaderData;
  readonly device: DeviceData;
  readonly mdm: MDMData;
  readonly context?: EventContext;
}

/**
 * Backend response types
 */
export interface BackendPersona {
  readonly roleId: string;
  readonly roleName: string;
  readonly permissions: string[];
  readonly workspaceConfig: {
    readonly layout: string;
    readonly visibleModules: string[];
    readonly theme: {
      readonly primaryColor: string;
      readonly accentColor: string;
    };
  };
  readonly appLaunchConfig: {
    readonly apps: Array<{
      readonly bundleId: string;
      readonly name: string;
    }>;
  };
}

export interface SessionStartResponse {
  readonly success: boolean;
  readonly sessionToken?: string;
  readonly persona?: BackendPersona;
  readonly expiresAt?: string;
  readonly error?: string;
}

export interface BackendErrorResponse {
  readonly error: string;
  readonly code?: string;
  readonly message?: string;
}
