# SignalGrid System Architecture Specification

**Problem:** Shared or multi-user devices (clinician tablets, warehouse handhelds, retail POS) lack persistent identity, creating security gaps where device trust is assumed rather than verified.

**Solution:** SignalGrid makes access decisions in real time before a session starts, using device posture, identity, and context — and automatically enforces security actions across NAC, SIEM, and ITSM systems.

---

## 1. End-to-End Flow

```
[Badge Tap]
     ↓ NFC (proximity required <5cm)
[Reader PCB] → extracts badgeUid + signs payload
     ↓ USB-C or BLE
[Mobile App] → forwards signed payload
     ↓ HTTPS POST /api/session/start
[SignalGrid API] → validates signature, enriches context
     ↓
[Policy Engine] → evaluates rules
     ↓
[Decision Engine] → ALLOW | DENY | STEP_UP
     ↓
[Actions Layer]
     ├─ NAC (Cisco ISE / Aruba ClearPass)
     ├─ SIEM (Splunk / Sentinel / QRadar)
     ├─ ITSM (ServiceNow / Jira)
     └─ App (session directive)
```

---

## 2. Interface Definitions

### Reader → App (USB-C/BLE) - SIGNED PAYLOAD

```json
{
  "schemaVersion": "1.0",
  "eventType": "badge.scan",
  "eventId": "uuid",
  "timestamp": "ISO8601",
  "nonce": "random-64bit",
  "badge": {
    "badgeUid": "string",
    "signalStrength": "number (dBm)"
  },
  "reader": {
    "readerId": "string",
    "readerType": "nfc|ble",
    "firmwareVersion": "string"
  },
  "signature": "hex-encoded-signature"
}
```

**Security:** Signature binds badgeUid + readerId + timestamp + nonce to prevent replay attacks.

### App → SignalGrid API

```json
{
  "schemaVersion": "1.0",
  "eventType": "badge.scan",
  "eventId": "uuid",
  "timestamp": "ISO8601",
  "badge": {
    "badgeId": "string",
    "employeeId": "string"
  },
  "reader": {
    "readerId": "string",
    "readerType": "nfc|ble"
  },
  "device": {
    "deviceId": "string",
    "deviceSerial": "string",
    "deviceModel": "string",
    "osVersion": "string"
  },
  "context": {
    "locationId": "string"
  }
}
```

### API Response (Decision Receipt)

```json
{
  "decision": "ALLOW|DENY|STEP_UP",
  "reason": "string",
  "session": {
    "sessionId": "uuid",
    "expiresAt": "ISO8601"
  } | null,
  "nextAction": "LAUNCH_APP|UNLOCK|NONE",
  "policyActions": [
    { "type": "quarantine_device", "params": {...} },
    { "type": "emit_siem_event", "params": {...} },
    { "type": "send_itsm_ticket", "params": {...} }
  ]
}
```

### API → Downstream Systems

**NAC (Cisco ISE / Aruba ClearPass)**
```json
{ "command": "quarantine", "deviceId": "...", "reason": "...", "source": "SignalGrid" }
```

**SIEM (Splunk / Microsoft Sentinel / QRadar)**
```json
{ "eventType": "signalgrid.access.denied", "deviceId": "...", "riskScore": 95, "policy": "...", "timestamp": "..." }
```

**ITSM (ServiceNow / Jira Service Management)**
```json
{ "shortDescription": "Non-compliant device access denied", "urgency": "high", "category": "Security", "assignedTo": "security-team" }
```

---

## 3. Trust Model

| Component | Trust Level | Rationale |
|-----------|-------------|-----------|
| Badge | Trusted | Physical proximity required (NFC <5cm) |
| Reader | Semi-Trusted | readerId registered, firmware tracked, optionally attested |
| Mobile App | Untrusted | Can be compromised, runtime-detected |
| Device Posture | Trusted | MDM/UEM attestation |
| Identity Provider | Trusted | Microsoft Entra ID / Okta upstream |
| SignalGrid API | Trusted | Internal decision engine |

**Spoofing Prevention:**
- **Badge:** Proximity-based (NFC requires physical presence)
- **Reader:** Signed payloads with nonce; production uses device-bound keys or secure element (ATECC608)
- **App:** Device posture validation required before processing
- **Replay:** Timestamp + nonce validation required
- **Demo mode:** May operate unsigned for ease of testing; production requires signature

**Reader Trust Details:**
- Each reader has unique readerId registered in system
- Firmware version tracked and validated
- Future: secure element for cryptographic signing

---

## 4. Identity Integration

SignalGrid does not replace identity providers — it leverages them.

| Source | Integration | Data Used |
|--------|-------------|-----------|
| Microsoft Entra ID | OIDC / SCIM | userId, department, title |
| Okta | OIDC / SCIM | userId, department, title |
| MDM (Intune/Jamf) | API | deviceId, complianceStatus |

User identity flows from upstream IdP → SignalGrid maps badge → user for decisioning.

---

## 5. What SignalGrid Is NOT

| Misconception | Reality |
|---------------|----------|
| SignalGrid IS MDM | NO - leverages MDM for posture, doesn't manage devices |
| SignalGrid IS IAM | NO - uses identity from IdP, doesn't replace auth |
| SignalGrid IS NAC | NO - sends commands to NAC, doesn't replace network control |
| SignalGrid IS badge system | NO - accepts badge events, doesn't manage credentials |

**SignalGrid IS:**
- Decision engine for shared-device access
- Orchestration layer for security actions
- Policy runtime for context-based access control

---

## 6. Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| badgeUid | string | Yes | Unique badge identifier |
| deviceId | string | Yes | MDM-enrolled device ID |
| userId | string | Yes | Mapped user identity |
| postureStatus | enum | Yes | compliant, non_compliant, unknown |
| riskScore | number | Yes | 0-100 |
| decision | enum | Yes | ALLOW, DENY, STEP_UP |
| actionsTriggered | array | Yes | List of executed actions |
| policyMatched | string | No | Policy name that triggered |
| locationZone | string | No | Physical location context |
| timestamp | ISO8601 | Yes | Event timestamp |
| nonce | string | Yes | Anti-replay nonce |
| signature | string | No | Reader signature (future) |

---

## 7. Timing Expectations

**Target: <500ms end-to-end**

| Stage | Typical | Maximum |
|-------|---------|---------|
| Badge read → Reader | 10ms | 50ms |
| Reader → App (USB-C) | 20ms | 50ms |
| App → SignalGrid API | 50ms | 100ms |
| Policy evaluation | 10ms | 50ms |
| Action dispatch | 20ms | 100ms |
| **Total** | **~110ms** | **<500ms** |

---

## 8. Decision Logic

```
IF device.postureStatus == non_compliant:
    DECISION = DENY
    ACTIONS = [quarantine_device, emit_siem_event, send_itsm_ticket]
ELSE IF user.riskScore >= 70:
    DECISION = DENY
    ACTIONS = [emit_siem_event]
ELSE IF location.zone == restricted AND time > 22:00:
    DECISION = STEP_UP
    ACTIONS = [require_mfa]
ELSE:
    DECISION = ALLOW
    ACTIONS = []
```

---

## 9. System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                     SignalGrid Platform                       │
├─────────────────────────────────────────────────────────────┤
│  INPUTS                  CORE                 OUTPUTS       │
│  ──────                 ─────                 ──────          │
│  Badge tap           Policy Engine         Session allow     │
│  Device posture     Decision Engine         NAC quarantine   │
│  User identity     Risk Scoring            SIEM alert       │
│  Location          Action Dispatcher       ITSM ticket      │
│                                                                 │
│  INTEGRATES WITH:              DOES NOT REPLACE:              │
│  - MDM/UEM (posture)          - MDM (Jamf, Intune)          │
│  - NAC (ISE, ClearPass)       - IAM (Okta, Entra)         │
│  - SIEM (Splunk, Sentinel)    - NAC (network control)       │
│  - ITSM (ServiceNow)          - Badge systems (HID, etc)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Key Constraints

- **Fail-secure:** Unknown states default to DENY
- **Audit-first:** Every decision logged before action execution
- **At-least-once:** Webhooks retry on failure (5 min, 3x)
- **No session persistence:** Decisions are stateless
- **Non-replayable:** Timestamp + nonce validation required
