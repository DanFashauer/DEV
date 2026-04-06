# Pilot Execution Plan

## Objective
Establish a minimal, reliable end-to-end pilot proving this flow:

**badge event → session start → posture fetch → policy decision → response → audit**

This plan is intentionally constrained to pilot validation only.

---

## 1) Core Pilot Flow

1. **Badge event received**
   - Input includes badge identifier and device/user context needed by session-start.
2. **Session Start API called**
   - Request is sent to the real session start route.
3. **Posture fetched**
   - Session start logic retrieves posture from real posture service(s).
4. **Policy decision executed**
   - Policy engine evaluates posture and request context.
5. **Response returned**
   - API returns deterministic decision payload (`ALLOW` or `DENY`).
6. **Audit written**
   - Every request emits an audit record with request input, decision, and reason.

---

## 2) Required Scenarios

### Scenario A — Compliant device → **ALLOW**
- Posture indicates compliant device status.
- Expected policy outcome: `ALLOW`.
- Expected API result: successful session creation / allow decision.

### Scenario B — Non-compliant device → **DENY**
- Posture indicates non-compliant status.
- Expected policy outcome: `DENY`.
- Expected API result: deny decision with clear reason.

### Scenario C — Unknown posture → **Fail-closed DENY**
- Posture unavailable, missing, or indeterminate.
- Expected policy outcome: `DENY` (fail-closed).
- Expected API result: deny decision with unknown-posture reason.

---

## 3) What Is Real vs Mocked

### Real (must be active in pilot)
- Session start route/handler
- Posture services used by decision logic
- Policy evaluation logic
- API response generation
- Audit write path

### Mocked / Stubbed (allowed for pilot)
- MDM vendor integrations
- Redis
- External identity systems

---

## 4) Validation Steps

> Replace placeholders (host/route/field names) with repo-accurate values from the running service.

### Common request shape
```bash
curl -sS -X POST "http://localhost:3000/api/session/start" \
  -H "Content-Type: application/json" \
  -d '{
    "badgeId": "BADGE-123",
    "userId": "user-001",
    "deviceId": "device-001",
    "requestId": "req-001"
  }'
```

### A) Compliant device test
1. Set posture source so `device-001` resolves to compliant.
2. Send request:
```bash
curl -sS -X POST "http://localhost:3000/api/session/start" \
  -H "Content-Type: application/json" \
  -d '{
    "badgeId": "BADGE-ALLOW",
    "userId": "user-allow",
    "deviceId": "device-compliant",
    "requestId": "req-allow-001"
  }'
```
3. Expected response JSON (shape):
```json
{
  "decision": "ALLOW",
  "session": {
    "created": true
  },
  "reason": "device_compliant",
  "requestId": "req-allow-001"
}
```
4. Expected audit log:
- Contains `requestId=req-allow-001`
- Contains decision `ALLOW`
- Contains reason for compliance

### B) Non-compliant device test
1. Set posture source so target device resolves to non-compliant.
2. Send request:
```bash
curl -sS -X POST "http://localhost:3000/api/session/start" \
  -H "Content-Type: application/json" \
  -d '{
    "badgeId": "BADGE-DENY",
    "userId": "user-deny",
    "deviceId": "device-noncompliant",
    "requestId": "req-deny-001"
  }'
```
3. Expected response JSON (shape):
```json
{
  "decision": "DENY",
  "session": {
    "created": false
  },
  "reason": "device_non_compliant",
  "requestId": "req-deny-001"
}
```
4. Expected audit log:
- Contains `requestId=req-deny-001`
- Contains decision `DENY`
- Contains non-compliance reason

### C) Unknown posture test (fail-closed)
1. Set posture source to return unknown/missing for target device.
2. Send request:
```bash
curl -sS -X POST "http://localhost:3000/api/session/start" \
  -H "Content-Type: application/json" \
  -d '{
    "badgeId": "BADGE-UNKNOWN",
    "userId": "user-unknown",
    "deviceId": "device-unknown",
    "requestId": "req-unknown-001"
  }'
```
3. Expected response JSON (shape):
```json
{
  "decision": "DENY",
  "session": {
    "created": false
  },
  "reason": "posture_unknown_fail_closed",
  "requestId": "req-unknown-001"
}
```
4. Expected audit log:
- Contains `requestId=req-unknown-001`
- Contains decision `DENY`
- Contains fail-closed reason for unknown posture

---

## 5) Pilot Success Criteria

Pilot is considered successful only if all are true:

1. **Deterministic decisions**
   - Same input posture + request context always yields same decision.
2. **No crashes**
   - Service remains stable across repeated runs of all 3 scenarios.
3. **Consistent response shape**
   - `ALLOW`/`DENY` responses keep a stable JSON schema.
4. **Audit for every request**
   - Exactly one audit record (minimum) exists per session-start request, including decision and reason.

---

## Execution Boundary

Out of scope for this pilot phase:
- UI work
- External integration hardening
- Redis adoption
- MDM API completeness
- OIDC/JWT expansion
- Load/performance infra

Focus remains strictly on proving and stabilizing the decision loop.
