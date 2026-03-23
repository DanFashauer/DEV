# SignalGrid Integration API

## Overview

SignalGrid provides a public integration API for external services to connect without complex authentication. This enables easy integration with MDM systems, badge readers, and location services.

---

## Base URL

```
https://your-domain.com/api/integrations/v1
```

---

## Authentication

The public integration endpoints are designed for open access from trusted internal services. For production deployments, consider:
- IP allowlisting
- API keys for partners
- Network segmentation

---

## Endpoints

### GET /status

Returns integration capabilities and supported features.

**Response:**
```json
{
  "service": "signalgrid",
  "status": "operational",
  "version": "v1",
  "timestamp": "2026-03-20T12:00:00.000Z",
  "integrations": {
    "supported": ["mdm-posture", "badge-events", "location-updates", "webhook-events"]
  },
  "endpoints": {
    "POST /posture": "Report device posture from MDM",
    "POST /badge": "Report badge tap event",
    "POST /location": "Report device location",
    "POST /heartbeat": "Health heartbeat",
    "GET /device/:id": "Get device status"
  }
}
```

---

### POST /posture

Report device posture from MDM systems (Jamf, Intune, Workspace ONE, etc.)

**Request:**
```json
{
  "deviceId": "device-123",
  "complianceStatus": "compliant",
  "violations": [],
  "lastChecked": "2026-03-20T12:00:00.000Z",
  "mdm": "jamf"
}
```

**Required Fields:**
- `deviceId` (string): Unique device identifier

**Optional Fields:**
- `complianceStatus` (string): "compliant" | "non_compliant" | "unknown"
- `violations` (string[]): List of compliance violations
- `lastChecked` (ISO timestamp): When posture was checked
- `mdm` (string): MDM provider - "jamf" | "intune" | "workspace-one" | "other"

**Response:**
```json
{
  "success": true,
  "deviceId": "device-123",
  "status": "posture_updated",
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

---

### POST /badge

Report badge tap event from badge readers.

**Request:**
```json
{
  "badgeUid": "ABC123456",
  "readerId": "reader-nurse-station-a",
  "location": "Nurse Station A",
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

**Required Fields:**
- `badgeUid` (string): Badge/credential identifier
- `readerId` (string): Badge reader identifier

**Optional Fields:**
- `location` (string): Physical location
- `timestamp` (ISO timestamp): When badge was tapped

**Response:**
```json
{
  "success": true,
  "event": "badge_tapped",
  "badgeUid": "ABC123456",
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

---

### POST /location

Report device location updates.

**Request:**
```json
{
  "deviceId": "device-123",
  "latitude": 42.3601,
  "longitude": -71.0589,
  "accuracy": 10,
  "zone": "Nurse Station A",
  "method": "wifi",
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

**Required Fields:**
- `deviceId` (string): Unique device identifier

**Optional Fields:**
- `latitude` (number): GPS latitude
- `longitude` (number): GPS longitude
- `accuracy` (number): Accuracy in meters
- `zone` (string): Logical zone/location name
- `method` (string): "gps" | "wifi" | "beacon" | "network"
- `timestamp` (ISO timestamp): When location was recorded

**Response:**
```json
{
  "success": true,
  "deviceId": "device-123",
  "status": "location_updated",
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

---

### GET /device/{deviceId}

Get current device status including posture and location.

**Response:**
```json
{
  "deviceId": "device-123",
  "posture": {
    "deviceId": "device-123",
    "complianceStatus": "compliant",
    "violations": [],
    "lastChecked": "2026-03-20T12:00:00.000Z",
    "mdm": "jamf"
  },
  "location": {
    "deviceId": "device-123",
    "zone": "Nurse Station A",
    "method": "wifi",
    "timestamp": "2026-03-20T12:00:00.000Z"
  },
  "lastUpdate": "2026-03-20T12:00:00.000Z"
}
```

---

### POST /heartbeat

Simple health check for monitoring systems.

**Request:**
```json
{
  "service": "mdm-connector",
  "status": "healthy"
}
```

**Response:**
```json
{
  "status": "ok",
  "received": {
    "service": "mdm-connector",
    "status": "healthy"
  },
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

---

## Integration Examples

### MDM (Jamf) Webhook

Configure Jamf to POST to:
```
POST /api/integrations/v1/posture
```

Payload from Jamf:
```json
{
  "deviceId": "jamf-device-id",
  "complianceStatus": "compliant",
  "mdm": "jamf"
}
```

### Badge Reader

Badge reader hardware POSTs:
```
POST /api/integrations/v1/badge
```

```json
{
  "badgeUid": "ABC123",
  "readerId": "reader-001",
  "location": "Main Entrance"
}
```

### Location Service

Location service POSTs:
```
POST /api/integrations/v1/location
```

```json
{
  "deviceId": "device-123",
  "latitude": 42.3601,
  "longitude": -71.0589,
  "zone": "Emergency Department",
  "method": "beacon"
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "deviceId is required"
}
```

**404 Not Found:**
```json
{
  "error": "Device not found"
}
```

---

## Rate Limits

- **Posture updates**: 100 requests/minute per device
- **Badge events**: 60 requests/minute per reader
- **Location updates**: 60 requests/minute per device

For higher limits, contact support.

---

## Support

- Email: integrations@signalgrid.io
- Docs: https://docs.signalgrid.io
