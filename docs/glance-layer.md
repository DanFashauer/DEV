# SignalGrid Glance Layer

## Product Overview

**Glance Layer** is a managed, policy-driven device identity surface that shows the minimum critical context needed for users, floor leads, and IT staff on shared devices.

**Core Principle**: One-glance readable, privacy-aware, policy-driven, location-aware, return-oriented, brandable per tenant.

---

## Design Principles

1. **One-glance readable** - Critical info in <2 seconds
2. **Privacy-aware** - No PHI/PII exposure beyond role need
3. **Policy-driven** - Content adapts to compliance state
4. **Location-aware** - Shows return location / zone
5. **Return-oriented** - Nudges correct return behavior
6. **Brandable per tenant** - Customizable colors, logos, messaging
7. **Optional** - Not required for core platform value

---

## Tier 1: Lock Screen Card

The primary surface - shown on device lock screen or managed wallpaper.

### Healthcare Template

```
┌─────────────────────────────────────────────┐
│  🏥 St. Mary's Hospital                    │
│  iPad - Nurse Station A                    │
├─────────────────────────────────────────────┤
│  Current User: Dr. Sarah Chen              │
│  Role: Emergency Medicine                   │
│  Shift: 7:00 AM - 7:00 PM                  │
├─────────────────────────────────────────────┤
│  📍 Return to: Nurse Station A Cart #3     │
│  ⏰ Due back: 6:45 PM (15 min)            │
├─────────────────────────────────────────────┤
│  ✅ Device Compliant                       │
│  Last sync: 2 min ago                      │
└─────────────────────────────────────────────┘
```

**Visible Fields**:
- Hospital/unit branding
- Device name & location
- Current user name & role
- Shift times
- Return location
- Overdue countdown
- Compliance status
- Last sync time

**Alert States**:
- 🔴 RED: Overdue, Non-compliant, Lost
- 🟡 AMBER: Due soon (<30 min), Low battery
- 🟢 GREEN: Available, Compliant, Checked out

**Privacy Mode**: Show role only, not name, when user is not currently authenticated

---

### Warehouse Template

```
┌─────────────────────────────────────────────┐
│  📦 Acme Logistics - Zone B               │
│  Scanner #042                               │
├─────────────────────────────────────────────┤
│  Current User: Marcus J.                    │
│  Shift: Day Shift (6A-6P)                  │
├─────────────────────────────────────────────┤
│  📍 Return to: Zone B Charging Dock        │
│  ⏰ Shift ends: 6:00 PM                    │
├─────────────────────────────────────────────┤
│  🔋 Battery: 78%   📶 Signal: Strong       │
└─────────────────────────────────────────────┘
```

**Visible Fields**:
- Company/warehouse branding
- Device ID & zone
- Current user (first name + initial)
- Shift schedule
- Return dock/station
- End-of-shift countdown
- Battery level
- Signal strength

**Alert States**:
- 🔴 RED: Not returned, Wrong zone, Low battery
- 🟡 AMBER: Shift ending soon, Device needs sync
- 🟢 GREEN: Available, In correct zone

---

### Retail Template

```
┌─────────────────────────────────────────────┐
│  🛒 Target Store #2847                     │
│  Handheld - Floor                           │
├─────────────────────────────────────────────┤
│  Checked out to: Jamie K.                   │
│  Dept: Electronics                          │
├─────────────────────────────────────────────┤
│  📍 Return to: Service Desk                │
│  ⏰ Due: End of shift                       │
├─────────────────────────────────────────────┤
│  ⚠️  Do not leave store                    │
└─────────────────────────────────────────────┘
```

**Visible Fields**:
- Store branding
- Device type & area
- Current user name
- Department
- Return location
- Return deadline
- Store-specific alerts

**Alert States**:
- 🔴 RED: Overdue, Left store boundary
- 🟡 AMBER: Break ending, Inventory count due
- 🟢 GREEN: Active, Within bounds

---

## Tier 2: Wallpaper / Branding Layer

Full-screen managed wallpaper with business context.

### Elements

| Element | Description |
|---------|-------------|
| Logo | Tenant logo (top corner) |
| Background | Solid color or gradient |
| Device State | Color-coded border or badge |
| Zone Label | Large text showing current zone |
| Return Instruction | "Return to: [location]" |
| Support Contact | IT support phone/QR |

### Color Mapping

| State | Border Color | Background Hint |
|-------|--------------|----------------|
| Available | Green | Subtle green gradient |
| In Use | Blue | Subtle blue gradient |
| Overdue | Red | Subtle red gradient |
| Non-Compliant | Red + Warning Icon | Red tint |
| Low Battery | Amber | Subtle amber gradient |

---

## Tier 3: Widget / Glance Panel

Optional in-app panel for deeper context (when user unlocks device).

### Fields

- Assigned user / checkout history
- Return deadline with calendar view
- Device posture summary (compliant/issue count)
- Last check-in / location zone
- Compliance details
- Tap for full details action

### Privacy Modes

| Mode | What Shows | Who Sees |
|------|------------|----------|
| Open | Full name, role, photo | Any user |
| Restricted | First name + initial, role only | Shared device users |
| Private | Device ID only, no user | Guest mode |

---

## Admin Configuration Model

```typescript
interface GlanceConfig {
  // Branding
  tenant: {
    name: string;
    logo?: string;          // URL to logo
    primaryColor: string;   // Hex color
    secondaryColor?: string;
  };

  // Template
  template: 'healthcare' | 'warehouse' | 'retail' | 'custom';
  
  // Field Toggles
  fields: {
    showUser: boolean;
    showRole: boolean;
    showShift: boolean;
    showReturnLocation: boolean;
    showOverdueCountdown: boolean;
    showComplianceStatus: boolean;
    showBattery: boolean;
    showLastSync: boolean;
    showIdleTimer: boolean;    // Show idle time remaining
    showChargingStatus: boolean; // Show if device is charging
  };

  // Privacy
  privacyMode: 'open' | 'restricted' | 'private';
  
  // Thresholds
  overdueThresholdMinutes: number;  // Default: 30
  lowBatteryPercent: number;        // Default: 20
  
  // Idle & Session Timeout
  idleTimeout: {
    enabled: boolean;              // Auto-logoff after idle
    idleMinutes: number;          // Minutes before auto-logoff (default: 5)
    warnMinutes: number;          // Minutes before warning (default: 2)
    forceReturnOnIdle: boolean;   // Force return to dock on idle
  };

  // Charging Bay / Dock Detection
  chargingBay: {
    enabled: boolean;              // Detect when device is docked/charging
    autoReturnOnDock: boolean;    // Auto-trigger return workflow when docked
    dockLocation: string;         // Name of dock/charging location
    requireUserConfirm: boolean;   // User must confirm return on dock
    notifyOnDock: boolean;        // Notify IT when device docked
  };

  // Location & Zone Settings
  location: {
    enabled: boolean;              // Enable location tracking
    mode: 'gps' | 'wifi' | 'beacon' | 'manual';  // Location detection method
    currentZone: string;          // Current zone/location
    expectedZone: string;         // Expected zone (where device should be)
    allowedZones: string[];        // List of allowed zones
    warnOnZoneExit: boolean;      // Warn if device leaves allowed zone
    autoQuarantineOnZoneExit: boolean; // Auto-quarantine if device leaves authorized area
    lastLocationUpdate: string;    // Last known location
    locationHistory: boolean;     // Track location history for audit
  };

  // Passcode / Security
  security: {
    requirePasscodeOnReturn: boolean;  // Require passcode before return
    requireBadgeOnReturn: boolean;    // Require badge tap to confirm return
    allowPINFallback: boolean;        // Allow PIN instead of badge
  };

  // Support
  supportContact?: {
    phone?: string;
    email?: string;
    qrCodeUrl?: string;
  };

  // Battery & Power
  battery: {
    enabled: boolean;
    lowThresholdPercent: number;    // Warn below this (default: 20)
    criticalThresholdPercent: number; // Force return below this (default: 10)
    warnOnLow: boolean;           // Warn user when low
    autoReturnOnCritical: boolean; // Force return when critical
    showChargingStatus: boolean;   // Show charging indicator
    chargingLocationRequired: boolean; // Must be at charging location when critical
  };

  // Device Health
  deviceHealth: {
    enabled: boolean;
    showStorage: boolean;        // Show available storage
    showOSUpdate: boolean;      // Show pending OS updates
    showLastReboot: boolean;    // Show last reboot time
    warnOnStorageLow: boolean;   // Warn if storage < 10%
    warnOnOSOutdated: boolean;   // Warn if OS > 30 days outdated
  };

  // Time-Based Policies
  timeBased: {
    enabled: boolean;
    allowedHours: {              // Business hours
      start: string;           // "07:00"
      end: string;             // "19:00"
      days: string[];          // ["mon","tue","wed","thu","fri"]
    };
    afterHoursAction: 'deny_all' | 'deny_new' | 'allow_existing';
    weekendMode: 'same_as_weekday' | 'restricted' | 'open';
  };

  // Emergency / Break-Glass
  emergency: {
    enabled: boolean;
    allowOverride: boolean;      // Allow emergency override
    overrideRequiresBadge: boolean; // Require supervisor badge
    overrideRequiresPIN: boolean;   // Require supervisor PIN
    overrideLogsToSIEM: boolean;  // Log all overrides to SIEM
    overrideNotifiesIT: boolean;  // Notify IT on override
    maxOverrideDuration: number;  // Minutes (default: 60)
  };

  // Notifications
  notifications: {
    enabled: boolean;
    userNotifications: boolean;   // Show notifications to user
    itNotifications: boolean;    // Notify IT
    pushToDevice: boolean;       // MDM push notifications
    emailIT: boolean;           // Email IT
    smsIT: boolean;             // SMS IT for critical
    digestFrequency: 'realtime' | 'hourly' | 'daily';
  };

  // Return Workflow
  returnWorkflow: {
    enabled: boolean;
    requireScan: boolean;    // Require badge tap to return
    capturePhoto: boolean;   // Capture photo on return
    notifyOnReturn: boolean; // Notify IT on device return
  };
}
```

---

## Sample Configurations

### Healthcare Default

```json
{
  "tenant": {
    "name": "St. Mary's Hospital",
    "primaryColor": "#0066CC"
  },
  "template": "healthcare",
  "fields": {
    "showUser": true,
    "showRole": true,
    "showShift": true,
    "showReturnLocation": true,
    "showOverdueCountdown": true,
    "showComplianceStatus": true,
    "showLastSync": true
  },
  "privacyMode": "restricted",
  "overdueThresholdMinutes": 15,
  "returnWorkflow": {
    "enabled": true,
    "requireScan": true,
    "notifyOnReturn": true
  }
}
```

### Warehouse Default

```json
{
  "tenant": {
    "name": "Acme Logistics",
    "primaryColor": "#FF6600"
  },
  "template": "warehouse",
  "fields": {
    "showUser": true,
    "showRole": false,
    "showShift": true,
    "showReturnLocation": true,
    "showOverdueCountdown": true,
    "showComplianceStatus": false,
    "showBattery": true,
    "showLastSync": false
  },
  "privacyMode": "restricted",
  "overdueThresholdMinutes": 60,
  "returnWorkflow": {
    "enabled": true,
    "requireScan": false,
    "notifyOnReturn": false
  }
}
```

### Retail Default

```json
{
  "tenant": {
    "name": "Target",
    "primaryColor": "#CC0000"
  },
  "template": "retail",
  "fields": {
    "showUser": true,
    "showRole": false,
    "showShift": true,
    "showReturnLocation": true,
    "showOverdueCountdown": true,
    "showComplianceStatus": false,
    "showBattery": false,
    "showLastSync": false
  },
  "privacyMode": "open",
  "overdueThresholdMinutes": 480,
  "returnWorkflow": {
    "enabled": true,
    "requireScan": false,
    "notifyOnReturn": false
  }
}
```

---

## Technical Notes

### Platform Constraints

- **iOS (Managed)**: Use Managed Screen Whitelist, Single App Mode, wallpaper APIs
- **Android (MDM)**: Use device owner mode, wallpaper intents, custom lock screen
- **Windows**: Use assigned access, shell customizations

### Data Flow

1. SignalGrid evaluates session state
2. Glance config pulled per device
3. Template rendered server-side or via MDM push
4. Lock screen/wallpaper updated via MDM APIs

### Integration Points

- **MDM**: Jamf, Intune, Workspace ONE for wallpaper/policy push
- **SignalGrid**: Session state, compliance, return location
- **ITSM**: Optional notification on device return

---

## Vertical-Specific Location Examples

### Healthcare
| Location Type | Example | Glance Layer Shows |
|--------------|---------|-------------------|
| Nurse Station | Nurse Station A | "Return to: Cart #3" |
| Exam Room | Exam Room 204 | "Return to: Exam Room Dock" |
| Operating Room | OR Suite B | "Return to: OR Storage" |
| Charging Cart | Cart #5 | "Return to: Cart #5 (Charging)" |

### Warehouse
| Location Type | Example | Glance Layer Shows |
|--------------|---------|-------------------|
| Zone | Zone A, B, C | "Zone: B" |
| Dock | Loading Dock 1 | "Return to: Dock 1" |
| Charging Station | Station 7 | "Charging @ Station 7" |
| Station | Packing Station 3 | "Station: Packing 3" |

### Retail
| Location Type | Example | Glance Layer Shows |
|--------------|---------|-------------------|
| Store Area | Electronics, Grocery | "Floor: Electronics" |
| Stockroom | Stockroom A | "Return to: Stockroom A" |
| Service Desk | Front Desk | "Return to: Service Desk" |
| Fitting Room | Fitting Room 2 | "Location: Fitting Room 2" |

---

## Real-World Use Cases

### Use Case 1: Nurse Ending Shift
1. Nurse finishes shift at 6:45 PM
2. Glance Layer shows "Due in 15 min"
3. Nurse returns iPad to cart dock
4. System detects dock connection
5. Auto-triggers return workflow
6. Badge confirmation (or passcode fallback)
7. Session ends, IT notified

### Use Case 2: Device Left Unattended
1. Nurse walks away from device for 5+ minutes
2. Idle timer triggers warning (2 min warning)
3. If no activity, session auto-locks
4. Glance Layer shows "Session Locked - Tap badge to resume"
5. Reduces unauthorized access risk

### Use Case 3: Low Battery Return
1. Device drops below 20% battery
2. User sees warning on Glance Layer
3. Below 10%, forces return to charging location
4. If docked, auto-returns and notifies IT

### Use Case 4: Emergency (Break-Glass)
1. Critical situation, nurse needs immediate access
2. Taps "Emergency Override"
3. Enters supervisor PIN or badges supervisor
4. Access granted for 60 min (configurable)
5. All overrides logged to SIEM
6. IT notified immediately

### Use Case 5: Zone Exit Alert
1. Device leaves authorized zone (e.g., leaves hospital)
2. GPS/WiFi triangulation detects exit
3. Immediate quarantine triggered
4. SIEM alert + ITSM ticket created
5. Security team notified

### Use Case 6: After-Hours Access
1. User tries to access device at 9 PM
2. Time policy checks hours (7 AM - 7 PM)
3. Denied - outside business hours
4. Or: allowed with restriction (no PHI apps)

---

## Practical Integration Patterns (Don't Reinvent)

Use existing infrastructure rather than building custom:

### Location Detection
| Method | Use Case | Integration |
|--------|----------|-------------|
| **BLE Beacons** | Indoor positioning | Existing beacon infrastructure (Estimote, Gimbal) |
| **WiFi RTT** | Sub-room accuracy | Built into iOS/Android |
| **NFC Tags** | Dock/station detection | Tap to confirm location |
| **MDM Location** | GPS coordinates | Jamf/Intune built-in |
| **Network** | DHCP subnet mapping | Existing network infrastructure |

### Device State Detection
| Signal | Source | Use |
|--------|--------|-----|
| Charging | Battery API | Detect dock/charger connected |
| Dock | USB-C/Lightning | Hardware detection |
| Badge | BLE reader | Physical location confirmation |
| Network | NAC/Network | Port/switch location |

### Alert & Notification
| Channel | Integration |
|---------|------------|
| Push | Existing MDM (Jamf, Intune) |
| Email | Existing email/ITSM |
| SMS | Existing telecom/ITSM |
| Audio | Device speaker for alerts |
| Visual | Lock screen messages |

---

## Location-Based Policy Examples

These use existing SignalGrid policy engine:

```json
{
  "name": "Zone-Restricted Access",
  "conditions": {
    "location.zone": "restricted_area"
  },
  "actions": ["require_step_up_auth"]
},
{
  "name": "Auto-Return on Dock",
  "conditions": {
    "device.docked": true,
    "session.active": true
  },
  "actions": ["end_session", "notify_user"]
},
{
  "name": "Geofence Alert",
  "conditions": {
    "location.exit_allowed_zone": true
  },
  "actions": ["quarantine_device", "emit_siem_event", "send_itsm_ticket"]
}
```

---

## Roadmap

| Phase | Description |
|-------|-------------|
| v1 | Lock screen card template (managed wallpaper) |
| v2 | Admin config UI + privacy modes |
| v3 | Return workflow (badge-to-return) |
| v4 | Widget panel for in-app context |
| v5 | QR code help/support integration |

---

## Success Metrics

- **Return compliance rate**: % devices returned on time
- **IT ticket reduction**: Fewer "where is device X" calls
- **User satisfaction**: Quick device checkout/return
- **Audit efficiency**: Real-time device location awareness
