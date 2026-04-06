# SignalGrid MVP Demo Contract: Session-Start Flow

## Purpose
This document locks the exact behavior of the SignalGrid MVP session-start flow so product behavior, website messaging, demo narrative, and launch communication stay aligned.

## Supported Inputs
The MVP session-start flow supports these request inputs:

### Required
- `userId`: Unique identifier for the user requesting access.
- `deviceId`: Unique identifier for the device associated with the access request.
- `posture`: Device posture signal used to evaluate compliance state (for example: compliant, non-compliant, or unknown).

### Optional (if included in a request)
- `issue`: Optional structured or textual issue detail describing why posture is non-compliant.
- `remediation`: Optional remediation hint, metadata, or instruction context used by the MVP remediation attempt path.

## Required Decision Behaviors
The MVP must enforce the following decision behavior at session start:

1. **Compliant posture → `allow`**
   - If posture is compliant, access is allowed.

2. **Non-compliant posture → remediation attempt → final `allow` or `deny`**
   - If posture is non-compliant, the system attempts remediation.
   - After remediation attempt, trust is re-evaluated.
   - The final decision must be either:
     - `allow` (if trust is restored), or
     - `deny` (if trust is not restored).

3. **Unknown posture → fail-closed `deny`**
   - If posture is unknown or cannot be evaluated confidently, access is denied.
   - This is explicit fail-closed behavior for MVP.

## Response Contract
Each session-start decision response must include:

- `decision`: Final access decision (`allow` or `deny`).
- `reason`: Human-readable reason for the final decision.
- `timestamp`: Decision timestamp in a consistent machine-readable format.
- `remediation` object (only if remediation was attempted), containing at minimum:
  - whether remediation was attempted,
  - remediation outcome/state,
  - any resulting context needed to explain the final decision.

## Audit Contract
The MVP audit trail must record enough data to reconstruct decision flow.

### Always logged
For every session-start decision, always log:
- request identifiers and core inputs (`userId`, `deviceId`, posture state),
- final `decision`,
- final `reason`,
- decision `timestamp`.

### Remediation attempt logging
If remediation is triggered for non-compliant posture, log:
- remediation attempt start,
- relevant issue/remediation context used,
- remediation outcome,
- post-remediation re-evaluation result,
- final decision after remediation path completion.

## Explicit MVP Non-Goals
The following are explicitly out of MVP scope:

- Full enterprise remediation integrations.
- Complete production hardening.
- Broad multi-system orchestration.
