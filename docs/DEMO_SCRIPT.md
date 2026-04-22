# SignalGrid Runtime Access Demo Runbook

## Goal of this demo

Prove one thing only:

**SignalGrid makes the correct access decision at runtime, before disruption reaches operations.**

This is intentionally not a full product walkthrough.

---

## End-to-end demo structure (3 scenarios)

Run only these scenarios in the buyer demo.

## Scenario 1 — Compliant path

### Story
Everything is healthy. SignalGrid validates the request and allows access.

### Input
- Valid signed request
- Badge enrolled and active
- `posture = compliant`

### What SignalGrid does
1. Validate signature
2. Confirm badge enrollment
3. Read posture
4. Evaluate policy
5. Create or extend session
6. Return success
7. Emit audit and webhook events

### Expected output
- HTTP `200`
- Outcome code such as `ACCESS_GRANTED`

### Talk track
> “When conditions are valid, SignalGrid stays out of the way and returns the correct allow decision.”

---

## Scenario 2 — Non-compliant path (recoverable-or-deny)

### Story
The device is known, but posture is not acceptable. SignalGrid returns an enforced decision based on runtime condition.

### Input
- Valid signed request
- Badge enrolled and active
- `posture = non-compliant`

### What SignalGrid does
1. Validate signature
2. Confirm badge enrollment
3. Detect non-compliant posture
4. Evaluate whether remediation path exists
5. Return final decision
6. Emit audit and webhook events

### Expected output
- HTTP `403`
- Outcome code such as `DEVICE_NON_COMPLIANT`

### Talk track
> “Instead of blindly allowing or relying on manual guesswork, SignalGrid evaluates runtime condition and returns the correct outcome based on posture.”

**Note for current demos:** if visible remediation is not implemented in the active build, present this as a direct non-compliant deny path.

---

## Scenario 3 — Unknown posture (fail closed)

### Story
SignalGrid lacks enough trustworthy runtime posture information, so access is denied safely.

### Input
- Valid signed request
- Badge enrolled and active
- `posture = unknown`

### What SignalGrid does
1. Validate signature
2. Confirm badge enrollment
3. Detect unknown posture
4. Fail closed
5. Emit audit and webhook events

### Expected output
- HTTP `403`
- Outcome code such as `DEVICE_POSTURE_UNKNOWN`

### Talk track
> “When runtime truth is incomplete, SignalGrid fails closed instead of allowing risky ambiguity.”

---

## Optional pre-check (Scenario 0)

Use this only as a quick opener.

### Input
- Invalid signature

### Expected output
- HTTP `401`

### Talk track
> “Before any policy logic runs, SignalGrid validates that the request itself is trustworthy.”

---

## Recommended demo order

1. Invalid request (optional, 15 seconds)
2. Compliant → allow
3. Non-compliant → deny
4. Unknown → fail closed

This tells a clean sequence:
- Trust the request
- Allow when safe
- Deny when degraded
- Fail closed when uncertain

---



## Deterministic operator runbook (copy/paste)

Use this sequence for live demos to avoid improvisation:

1. `bun run demo:up`
2. `curl -sS http://localhost:3000/api/health`
3. Run scenarios in order (payload + expected output below)
4. `curl -sS http://localhost:3000/api/demo/verify`
5. `bun run demo:down`

### Shared prerequisites for scenarios 1-3
- Badge is enrolled and active (via admin flow with `ADMIN_API_KEY`).
- Request is HMAC-signed with `BACKEND_SIGNING_SECRET` (demo defaults are injected by `demo:up` if unset).
- Device posture is set through `POST /api/admin/test/posture` for deterministic outcomes.

## What to physically show

Keep visuals minimal.

### Show
1. One-line architecture or homepage
2. Request payload (or test input)
3. Response/result
4. Audit log or emitted event

### Do not show unless asked
- Repo deep-dives
- Test internals
- Multiple tabs and implementation details
- Future-state architecture details

---

## Word-for-word script (under 3 minutes)

### Opening
> “SignalGrid sits between authentication and enforcement. It evaluates runtime conditions and returns the correct access outcome.”

### Scenario 1
> “Here’s a valid request with an enrolled badge and compliant posture. SignalGrid validates the request, evaluates posture, and returns access granted.”

### Scenario 2
> “Here’s the same flow with non-compliant posture. Instead of allowing access or forcing guesswork, SignalGrid returns the correct deny outcome based on runtime condition.”

### Scenario 3
> “Here’s an unknown posture state. SignalGrid does not assume trust when information is incomplete. It fails closed and records the event.”

### Close
> “That’s the core value: SignalGrid makes the access decision based on runtime truth before disruption reaches the business.”

---

## Demo success criteria

Demo is buyer-ready when all are true:
- Three scenarios run consistently
- Inputs are predetermined
- Outputs are deterministic
- Story fits under 3 minutes
- No manual server scrambling
- Audit output is visible
- You can explain the difference between scenarios in one sentence

---

## Pre-demo cleanup checklist

Before showing externally, verify:
- Route and test names are readable
- Responses are not cluttered
- Decision codes are understandable
- Audit output is visibly traceable
- No internal hacks need explanation live

---

## What not to do during demo

Do not:
- Overpromise remediation if not visibly implemented
- Mix in future hardware concepts
- Run competitor teardown live
- Explain entire architecture
- Turn demo into code walkthrough

---

## One-line takeaway

**SignalGrid turns fragmented identity, device, and session signals into the correct access outcome at runtime.**
