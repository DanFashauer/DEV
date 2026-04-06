# SignalGrid MVP Demo Contract (Closed-Loop Session Start)

This document defines the **MVP-only** contract for `/api/session/start`.

## Scope

This contract is intentionally constrained to the session-start closed loop:

1. Receive signed badge-scan session-start input.
2. Resolve badge identity.
3. Evaluate posture + remediation outcome.
4. Return **allow/deny** decision receipt.
5. Write audit output for every decision path.

No additional policy/orchestration scope is included here.

---

## Supported Inputs

### Endpoint

- `POST /api/session/start`

### Headers

Required security headers:

- `x-signature`
- `x-timestamp`
- `x-nonce`

Optional:

- `x-request-id`

### Body (BadgeEvent v1 + MVP posture hints)

Required BadgeEvent shape:

- `schemaVersion` = `"1.0"`
- `eventType` = `"badge.scan"`
- `eventId` (uuid)
- `timestamp` (ISO-8601)
- `badge.badgeId`
- `reader.readerId`, `reader.readerType`
- `device.deviceId`, `device.deviceSerial`, `device.deviceModel`, `device.osVersion`
- `mdm.enrolled`

MVP posture/remediation hints use `mdm.personaAttributes`:

- `complianceStatus`: `compliant | non_compliant | unknown`
- `remediationAttempted`: `"true" | "false"`
- `remediationSucceeded`: `"true" | "false"`

---

## Decision Behavior

The MVP closed-loop decisions are deterministic:

1. **Compliant → allow**
   - `complianceStatus = compliant`
   - session is created
   - decision = `allow`

2. **Non-compliant → remediation attempt → final allow or deny**
   - `complianceStatus = non_compliant`
   - remediation is considered attempted via `remediationAttempted`
   - if `remediationSucceeded = true`, final decision is `allow`
   - otherwise final decision is `deny`

3. **Unknown → fail-closed deny**
   - `complianceStatus = unknown` (or missing/unrecognized)
   - final decision is `deny`
   - no open-by-default path exists for unknown posture in MVP

---

## Response Contract

Every response returns a decision receipt with these top-level fields:

- `decision`: `allow | deny`
- `reason`: human-readable reason for demo clarity
- `timestamp`: ISO-8601 decision time
- `remediation`: object **only when remediation was attempted**

### Allow response

```json
{
  "success": true,
  "decision": "allow",
  "reason": "Device posture is compliant",
  "timestamp": "2026-04-05T00:00:00.000Z",
  "session": {
    "sessionId": "session-...",
    "userId": "...",
    "deviceId": "...",
    "nextAction": "LAUNCH_APP",
    "bundleId": "com.signalgrid.demo",
    "createdAt": "...",
    "expiresAt": "..."
  }
}
```

### Deny response

```json
{
  "success": false,
  "decision": "deny",
  "reason": "Posture unknown; fail-closed deny",
  "timestamp": "2026-04-05T00:00:00.000Z"
}
```

### Remediation object

When remediation is attempted, include:

```json
"remediation": {
  "attempted": true,
  "status": "succeeded | failed",
  "reason": "..."
}
```

---

## Audit Contract

For **every decision path**, the endpoint writes audit entries:

1. `session.start`
2. `decision.allow` or `decision.deny`

Audit metadata includes:

- `decision`
- `reason`
- `timestamp`
- `badgeId`
- `remediation` (when attempted)

This applies to:

- successful allow
- deny due to non-compliance after remediation attempt
- deny due to unknown posture (fail-closed)
- deny due to validation/rate-limit/internal error

---

## Explicit MVP Non-Goals

The following are intentionally out of scope for this MVP contract:

1. Full policy DSL / multi-step rule evaluation expansion.
2. New decision outcomes beyond `allow` and `deny`.
3. Advanced remediation workflows (ticketing, device command fan-out, retries).
4. Cross-endpoint orchestration redesign.
5. Broad schema evolution beyond the existing BadgeEvent + personaAttributes hints.

