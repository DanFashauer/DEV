# SignalGrid Demo Readiness Checklist (Single Repeatable E2E Demo)

## Scope
This package defines one **repeatable, buyer-safe E2E demo workflow** for SignalGrid MVP behavior and explicitly maps what is real vs simulated.

**Primary demo track for live conversations:**
- `non-compliant → remediation attempt narrative → final decision (deny)`

The other two scenarios (`compliant → allow`, `unknown → fail closed`) are defined and validated here as readiness checks, but only one track should be run live unless explicitly requested.

---

## Browser Runtime Decision Demo (`/demo`)

Use this path when the goal is to let a buyer understand SignalGrid in under 3 minutes without running the full admin/demo script flow.

### How to run locally
1. Start the app with `npm run dev` or run a production build with `npm run build && npm run start`.
2. Open `http://localhost:3000/demo`.
3. Review the three scenario cards:
   - Compliant device → `ACCESS_GRANTED`
   - Non-compliant device → `DEVICE_NON_COMPLIANT`
   - Unknown posture → `DEVICE_POSTURE_UNKNOWN`
4. Click **Run scenario** on any card to call `POST /api/demo/session-start` with deterministic demo data.

### Safety contract
- The browser demo uses deterministic scenario fixtures only.
- `POST /api/demo/session-start` is simulated and clearly marks responses with `demo.simulated: true`.
- The browser demo does not send real webhooks.
- The browser demo does not mutate production state.
- The browser demo does not expose secrets.

### Expected API shape
The safe demo API mirrors the real session-start response envelope closely enough for buyer walkthroughs:
- Allow path: `success: true`, `decision: "ACCESS_GRANTED"`, `session`, `actions`, `riskScore`, `riskLevel`, and `demo` metadata.
- Deny paths: `success: false`, `decision: "ACCESS_DENIED"`, `error`, `code`, `actions`, `riskScore`, `riskLevel`, and `demo` metadata containing the visible outcome (`DEVICE_NON_COMPLIANT` or `DEVICE_POSTURE_UNKNOWN`).

## 1) Canonical Demo Flow (No Improvisation Runbook)

### Preconditions
- Node/Bun deps installed.
- `.env.local` includes (or defaults provide):
  - `ADMIN_API_KEY` (default used by scripts: `dev-admin-key-12345`)
  - `BACKEND_SECRET` for HMAC session-start signing.
- Demo server starts and `/api/health` + `/api/demo/verify` respond.

### Exact command sequence
1. **Start demo server**
   - `bun run demo:up`
2. **Run deterministic healthcare deny demo**
   - `bun run demo:exec`
3. **Verify outcome**
   - `curl http://localhost:3000/api/demo/verify`
4. **Show evidence in UI**
   - Open `http://localhost:3000/admin`
   - Confirm denied event + integration logs.
5. **Shutdown after demo**
   - `bun run demo:down`

### Expected result for canonical live demo
- Session start returns **403** + `DEVICE_NON_COMPLIANT`.
- Security events include `session_denied`, `quarantine`, `siem_alert`, `itsm_ticket`.
- `/api/demo/verify` should report `status: PASS` and `decision: DENY` when full action timeline is present.

---

## 2) Required E2E Scenarios

## Scenario A — compliant → allow

### Demo input
- Signed badge scan to `POST /api/session/start` with enrolled badge/device.
- Posture sources indicate compliant.

### Expected system behavior
- Creates/extends active session.
- Evaluates allow path policy actions (e.g., launch app/TTL actions if configured).
- Writes session-start audit event.

### Expected final output
- HTTP `200` with:
  - `success: true`
  - `decision: "ACCESS_GRANTED"`
  - `session` object

### Expected audit/log output
- Audit ledger includes `session.start` for created session.
- Webhook/session start emit path is invoked.
- Security event stream may include allow event depending on policy/event pipeline.

### Current readiness status
- **Partially blocked** in this repo state because session-start posture adapters currently return `unknown` by default, which causes fail-closed deny unless `UNKNOWN_POSTURE_MODE=allow`.

---

## Scenario B — non-compliant → remediation attempt → final decision

### Demo input
- Enrolled device + badge.
- Device posture set to non-compliant (demo script uses `/api/admin/test/posture`).
- Signed badge scan to `POST /api/session/start`.

### Expected system behavior
- Non-compliant posture triggers deny branch.
- Policy engine runs deny policy actions.
- Side effects logged for NAC/SIEM/ITSM demo visibility.
- **Remediation attempt is currently a demo narrative step, not an enforced orchestration loop in `session/start`.**

### Expected final output
- HTTP `403` with:
  - `success: false`
  - `decision: "ACCESS_DENIED"`
  - `code: "DEVICE_NON_COMPLIANT"`

### Expected audit/log output
- Security events include:
  - `session_denied`
  - `quarantine`
  - `siem_alert`
  - `itsm_ticket`
- Integration log entries for NAC/SIEM/ITSM payload previews.
- Audit stream includes auth/policy records expected by demo scripts.

### Current readiness status
- **Working as the canonical repeatable live demo** (`bun run demo:exec`).
- Remediation is **simulated/talk-track only** today.

---

## Scenario C — unknown → fail closed

### Demo input
- Enrolled badge/device, but posture unresolved/unknown.
- Signed badge scan to `POST /api/session/start`.

### Expected system behavior
- Unknown posture checks trigger explicit fail-closed branch when `UNKNOWN_POSTURE_MODE !== allow`.

### Expected final output
- HTTP `403` with:
  - `error: "Device posture unknown"`
  - `code: "DEVICE_POSTURE_UNKNOWN"`

### Expected audit/log output
- Auth failure audit with `device_posture_unknown` context.
- No active session created.

### Current readiness status
- **Working** and enforced by default posture adapter behavior.

---

## 3) Working vs Mocked vs Future Work

### Truly working now
- Signed session-start request validation, badge enrollment dependency, and deny/allow response envelopes.
- Explicit unknown-posture fail-closed branch.
- Non-compliant deny branch with security-event + integration-log side effects.
- Deterministic executive demo script orchestration for healthcare deny scenario.

### Mocked / simulated now
- `getFleetContext` and `getUEMContext` in session-start path are hardcoded to `unknown` (not live adapter-backed).
- `demo:seed` and `sim:posture` are largely simulation/logging utilities and do not provide authoritative live adapter state for session-start.
- Remediation attempt in scenario B is talk-track/simulated, not a stateful remediation-retry decision loop.

### Future work (demo-readiness relevant only)
- Real adapter wiring from posture telemetry store into `getFleetContext/getUEMContext`.
- First-class remediation workflow: `attempted → succeeded/failed → re-evaluate → final allow/deny` with auditable steps.
- Stable, scriptable “compliant allow” fixture scenario that does not rely on bypass env flags.

---

## 4) Remaining Technical Blockers (Can Break Demo)

1. **Posture adapter disconnect (highest risk):** session-start posture service is hardcoded unknown; this can collapse intended compliant/non-compliant differentiation.
2. **Remediation path gap:** required MVP scenario mentions remediation attempt, but session-start currently jumps directly to deny on non-compliance.
3. **Test drift in session-start API expectations:** current API tests show status-code expectation mismatches, indicating contract drift risk before buyer demos.
4. **Demo verification coupling:** `/api/demo/verify` PASS is tied to denied timeline + specific action event presence; allow-path demo validation is under-specified.

---

## 5) Validation Checklist for Demo Host (Day-of Demo)

- [ ] `bun run demo:up` succeeds and reports reachable URL.
- [ ] `curl /api/health` returns OK JSON.
- [ ] `bun run demo:exec` exits 0 and reports denied outcome.
- [ ] `curl /api/demo/verify` returns `status: PASS` and `decision: DENY`.
- [ ] `/admin` shows matching denied event and integration logs.
- [ ] Fallback line prepared: “Remediation step is simulated in this MVP demo build.”

---

## 6) Demo-Readiness Next Fix Tasks (No Feature Expansion)

1. **Wire real posture reads in session-start service** from existing telemetry/UEM stores so scenario A and B are both first-class and deterministic.
2. **Implement minimal remediation attempt state machine** in session-start flow (single retry path + explicit audit fields).
3. **Add one golden script for each scenario** (allow/deny/unknown) that returns machine-checkable pass/fail JSON.
4. **Align session-start API tests with contract** (or contract with tests) to remove status-code ambiguity before external demos.
5. **Extend `/api/demo/verify` with scenario selector** so each of the three required scenarios can be verified explicitly.

