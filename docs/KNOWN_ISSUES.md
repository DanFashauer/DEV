# SignalGrid Known Issues

## Purpose
This file tracks issues found during demo validation.
Use this to prevent repeated confusion and to separate blockers from polish.

---

## Blockers
Issues that break the demo or make validation unreliable.

### Issue Template
- ID: 
- Title: 
- Found by: Reviewer / Human / Both
- Date: 
- Environment: 
- Severity: Critical / High
- Repro steps: 
- Expected: 
- Actual: 
- Status: Open / In Progress / Fixed
- Owner: 
- Notes: 

---

### Current Blockers

- ID: PORT_3000_BLOCKED
- Title: Port 3000 occupied by unknown process
- Found by: Reviewer
- Date: 2026-03-19
- Environment: Cloud sandbox
- Severity: High
- Repro steps: Run `bun run demo:up`
- Expected: Server starts on port 3000
- Actual: EADDRINUSE error
- Status: Workaround Available
- Owner: User
- Notes: Use `PORT=3011 bun run demo:up` as workaround

---

## Non-Blocking Polish
Issues that do not break the demo but should be improved.

### Issue Template
- ID: 
- Title: 
- Found by: Reviewer / Human / Both
- Date: 
- Severity: Medium / Low
- Area: UI / wording / animation / spacing / consistency
- Suggested fix: 
- Status: 

---

### Current Non-Blocking Items


- ID: AUTO_WORKFLOWS_MANUAL_PHASE
- Title: Auto-approve/auto-merge workflows archived (not active)
- Date: 2026-05-20
- Severity: Low
- Area: repository workflow governance
- Suggested fix: Restore only after branch protection, labels, app permissions, and merge policy are reviewed.
- Status: Archived (intentional)


---

## Fixed
Resolved issues that were validated after correction.

### Issue Template
- ID: 
- Title: 
- Fixed by: 
- Date fixed: 
- Validation method: 
- Notes: 

---

### Fixed Items

- ID: DEMO_UP_PORT_CHECK
- Title: demo:up did not check if port was already in use
- Fixed by: Reviewer
- Date fixed: 2026-03-19
- Validation method: Added port check and health verification to demo-control.ts
- Notes: Now checks if SignalGrid is already running before starting

- ID: DEMO_EXEC_ROUTE_CHECK
- Title: demo:exec did not verify routes before running
- Fixed by: Reviewer
- Date fixed: 2026-03-19
- Validation method: Added /api/health and /api/demo/verify checks
- Notes: Now fails with clear diagnostics if routes unavailable

- ID: DEMO_DOCTOR_MISSING
- Title: No way to diagnose demo environment issues
- Fixed by: Reviewer
- Date fixed: 2026-03-19
- Validation method: Created bun run demo:doctor command
- Notes: Prints PASS/FAIL with reasons

---

## Deferred
Valid concerns that are intentionally postponed.

### Issue Template
- ID: 
- Title: 
- Reason deferred: 
- Revisit after: 
- Notes: 

---

### Deferred Items

(None yet)
