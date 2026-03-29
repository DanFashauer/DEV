# SignalGrid Demo Validation Checklist

## Purpose
This checklist is the single source of truth for validating the SignalGrid demo.
All reviewers should use this same checklist.

---

## A. Environment Readiness

- [ ] Project root is correct
- [ ] Required dependencies installed
- [ ] No conflicting process is already using the target port
- [ ] Correct app is running on the selected port
- [ ] Environment variables are loaded correctly

### Expected checks
- `curl /api/health` returns success
- `curl /api/demo/verify` is reachable
- Demo routes are not returning 404 unexpectedly

---

## B. Startup Validation

- [ ] `bun run demo:up` starts successfully
- [ ] Startup output clearly shows selected port
- [ ] Startup output clearly shows app URL
- [ ] Startup output clearly shows admin URL
- [ ] Startup output clearly shows health check result

### Expected result
- Demo app is running
- Health endpoint responds successfully
- No port collision or wrong-process issue

---

## C. Executive Demo Flow Validation

- [ ] `bun run demo:exec` runs successfully
- [ ] Demo scenario uses healthcare default
- [ ] Device posture is set to non-compliant
- [ ] Badge scan executes
- [ ] Session result is deterministic

### Expected result
- Session decision = `DENY`
- Reason reflects non-compliant device
- Demo does not unexpectedly allow the session

---

## D. Automated Action Validation

- [ ] Quarantine action triggered
- [ ] SIEM event triggered
- [ ] ITSM ticket triggered
- [ ] Actions are visible in returned payload or event log
- [ ] Actions are visible in admin UI integration logs

### Expected result
- `quarantine_device`
- `emit_siem_event`
- `send_itsm_ticket`

---

## E. Verify Endpoint Validation

- [ ] `curl /api/demo/verify` returns JSON
- [ ] `status` field is present
- [ ] `decision` field is present
- [ ] `actions` field is present
- [ ] `timelineComplete` field is present

### Expected result
```json
{
  "status": "PASS",
  "decision": "DENY"
}
```

---

## F. Admin Portal Validation

- [ ] /admin loads
- [ ] Dashboard loads without error
- [ ] Demo Ready indicator is visible
- [ ] Security events appear
- [ ] Decision banner is visible on event detail
- [ ] Timeline is ordered correctly
- [ ] Integration logs are visible
- [ ] Glance Layer preview renders correctly

Timeline order must be:
1. Badge Tapped
2. Device Security Check
3. Risk Assessment
4. Security Policy
5. Access Denied / Granted
6. Automated actions

---

## G. Mobile Prototype Validation

- [ ] Xcode prototype launches
- [ ] Ready screen loads
- [ ] Processing screen animates properly
- [ ] Access Granted screen renders
- [ ] Access Denied screen renders
- [ ] Glance Layer preview renders
- [ ] Wording matches admin portal wording
- [ ] State toggles work
- [ ] Vertical selector works

---

## H. Buyer-Facing Language Validation

- [ ] Uses "Access Granted" / "Access Denied"
- [ ] Uses "Device Security Check"
- [ ] Uses "Security Policy"
- [ ] Uses "Automated Security Actions"
- [ ] Uses "Return to"
- [ ] Uses "Due back"
- [ ] Uses "Checked out to"
- [ ] Avoids unnecessary technical jargon

---

## I. Required Screenshots for Review

- [ ] Admin dashboard
- [ ] Event detail with decision banner
- [ ] Timeline view
- [ ] Integration logs panel
- [ ] Glance Layer preview
- [ ] iOS Ready screen
- [ ] iOS Access Denied screen

---

## J. Pass / Fail Rule

### PASS
- Demo starts cleanly
- Demo executes cleanly
- Verify endpoint returns PASS
- Session is denied for non-compliant device
- Actions trigger visibly
- Admin UI shows the expected results

### FAIL
Any of the following:
- Wrong process on selected port
- Missing health route
- Missing verify route
- Demo returns 404 unexpectedly
- Session is allowed unexpectedly
- Actions do not trigger
- Admin UI does not reflect the event correctly
