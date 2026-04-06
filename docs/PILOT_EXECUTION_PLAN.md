# SignalGrid Pilot Execution Plan (Minimal Working Scope)

## Objective
Run a deterministic, end-to-end SignalGrid pilot that proves session access decisions can be made in real time from badge + posture signals, with auditable outcomes.

---

## 1) Core Flow (Required)

The pilot must execute this exact sequence for every request:

1. **Badge event received**
2. **Session start invoked**
3. **Posture fetched** (from active posture services)
4. **Policy decision evaluated**
5. **Response returned** to caller
6. **Audit record written**

### Flow Contract
- The decision engine must run **after** posture fetch and **before** response.
- The response must always include a stable decision payload shape.
- Audit write must happen for **allow**, **deny**, and **fail-closed** outcomes.

---

## 2) Required Scenarios

## Scenario A — Compliant Device → ALLOW
**Input condition:** Device posture resolves to compliant.

**Expected decision:** `ALLOW`

**Expected behavior:**
- Session start succeeds.
- Response returns allow decision with no denial actions.
- Audit includes posture status `compliant` and decision `ALLOW`.

## Scenario B — Non-Compliant Device → DENY
**Input condition:** Device posture resolves to non-compliant.

**Expected decision:** `DENY`

**Expected behavior:**
- Session start is denied.
- Response returns deny decision and reason tied to posture failure.
- Audit includes posture status `non_compliant` and decision `DENY`.

## Scenario C — Unknown Posture → FAIL-CLOSED
**Input condition:** Posture cannot be resolved (missing, stale, or error).

**Expected decision:** `DENY` with fail-closed reason.

**Expected behavior:**
- Session start does not proceed.
- Response explicitly indicates fail-closed posture handling.
- Audit includes posture status `unknown` and fail-closed reason.

---

## 3) Real vs Mocked Components

## Real (must be active in pilot)
- **Session start route** (decision entrypoint)
- **Posture services** used by session flow
- **Policy evaluation** logic
- **Response generation** returned to client

## Mocked / Stubbed (allowed for pilot)
- **MDM integrations** (Jamf/Intune/etc. adapters can be simulated)
- **Redis** (in-memory store is acceptable)
- **External identity systems** (directory/IdP lookups can be fixture-based)

### Boundary Rule
All mocked systems may provide input signals, but **final decisioning + response + audit path must be real runtime logic**.

---

## 4) Validation Steps (Exact Requests + Expected Outputs)

Assume local runtime:
- `BASE_URL=http://localhost:3000`

Use this common badge/session payload:

```json
{
  "schemaVersion": "1.0",
  "eventType": "badge.scan",
  "eventId": "11111111-1111-4111-8111-111111111111",
  "timestamp": "2026-04-03T12:00:00.000Z",
  "badge": { "badgeId": "BADGE-1001" },
  "reader": { "readerId": "reader-nurse-station-a", "readerType": "nfc" },
  "device": {
    "deviceId": "device-001",
    "deviceSerial": "SER-001",
    "deviceModel": "iPad14,3",
    "osVersion": "17.4"
  },
  "mdm": { "enrolled": true },
  "context": { "locationId": "nurse-station-a", "locationName": "Nurse Station A" }
}
```

> Note: If security headers are enforced in your environment, include required `x-signature`, `x-timestamp`, and `x-nonce` headers.

### 4.1 Prepare posture signal (compliant)

```bash
curl -sS -X POST "$BASE_URL/api/integrations/v1/posture" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-001",
    "complianceStatus": "compliant",
    "violations": [],
    "mdm": "stub-mdm"
  }'
```

**Expected JSON (example):**

```json
{
  "success": true,
  "deviceId": "device-001",
  "status": "posture_updated",
  "timestamp": "2026-04-03T12:00:01.000Z"
}
```

### 4.2 Trigger session start (expect ALLOW)

```bash
curl -sS -X POST "$BASE_URL/api/session/start" \
  -H "Content-Type: application/json" \
  -d @session-event.json
```

**Expected JSON shape (ALLOW):**

```json
{
  "decision": "ALLOW",
  "reason": "Device compliant",
  "success": true,
  "sessionId": "<non-empty>",
  "actions": []
}
```

### 4.3 Prepare posture signal (non_compliant)

```bash
curl -sS -X POST "$BASE_URL/api/integrations/v1/posture" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-001",
    "complianceStatus": "non_compliant",
    "violations": ["jailbreak_detected"],
    "mdm": "stub-mdm"
  }'
```

### 4.4 Trigger session start (expect DENY)

```bash
curl -sS -X POST "$BASE_URL/api/session/start" \
  -H "Content-Type: application/json" \
  -d @session-event.json
```

**Expected JSON shape (DENY):**

```json
{
  "decision": "DENY",
  "reason": "Device non-compliant",
  "success": false,
  "code": "DEVICE_NON_COMPLIANT",
  "actions": [
    { "type": "reenroll_device" }
  ]
}
```

### 4.5 Prepare posture signal (unknown)

```bash
curl -sS -X POST "$BASE_URL/api/integrations/v1/posture" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-001",
    "complianceStatus": "unknown",
    "violations": [],
    "mdm": "stub-mdm"
  }'
```

### 4.6 Trigger session start (expect fail-closed)

```bash
curl -sS -X POST "$BASE_URL/api/session/start" \
  -H "Content-Type: application/json" \
  -d @session-event.json
```

**Expected JSON shape (FAIL-CLOSED):**

```json
{
  "decision": "DENY",
  "reason": "Posture unknown - fail closed",
  "success": false,
  "code": "POSTURE_UNKNOWN_FAIL_CLOSED",
  "actions": [
    { "type": "recheck_posture" }
  ]
}
```

### 4.7 Expected audit records

For each of the 3 session-start requests, expect one audit record with:
- unique record id/hash
- timestamp
- badge id
- device id
- posture status
- final decision
- reason/code

**Expected audit examples (shape):**

```json
{
  "eventType": "session.start",
  "badgeId": "BADGE-1001",
  "deviceId": "device-001",
  "postureStatus": "compliant",
  "decision": "ALLOW",
  "reason": "Device compliant",
  "timestamp": "2026-04-03T12:00:10.000Z"
}
```

```json
{
  "eventType": "session.start",
  "badgeId": "BADGE-1001",
  "deviceId": "device-001",
  "postureStatus": "non_compliant",
  "decision": "DENY",
  "reason": "Device non-compliant",
  "code": "DEVICE_NON_COMPLIANT",
  "timestamp": "2026-04-03T12:01:10.000Z"
}
```

```json
{
  "eventType": "session.start",
  "badgeId": "BADGE-1001",
  "deviceId": "device-001",
  "postureStatus": "unknown",
  "decision": "DENY",
  "reason": "Posture unknown - fail closed",
  "code": "POSTURE_UNKNOWN_FAIL_CLOSED",
  "timestamp": "2026-04-03T12:02:10.000Z"
}
```

---

## 5) Success Criteria (Pilot Exit)

Pilot is successful only if all criteria below are met:

1. **Deterministic decisions**
   - Same posture input always returns same decision.
2. **No crashes**
   - Session start route remains healthy across all three scenarios.
3. **Consistent response shape**
   - Every response includes decision + reason + success (+ code/actions when applicable).
4. **Audit record for every request**
   - One auditable record exists for allow, deny, and fail-closed outcomes.

---

## Execution Notes
- Keep pilot scope intentionally narrow: one device, one badge, one route, three posture states.
- Do not expand to production integration hardening during pilot.
- Treat unknown posture as a security state, not a transient success path.
