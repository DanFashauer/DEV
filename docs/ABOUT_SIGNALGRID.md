# About SignalGrid

## Short company description
SignalGrid is building a closed-loop decision layer for session-start access risk. We help security and IT teams decide, remediate when needed, and return a final auditable access outcome before workflows break.

## Longer company description
SignalGrid focuses on the decision gap between risk detection and final access outcome. Many organizations already have strong tools for posture reporting and policy enforcement, but operators still get pulled into manual remediation when risk appears at login. SignalGrid adds a closed-loop step at session start: evaluate risk, attempt remediation for non-compliant posture, re-check trust, and return a final allow/deny result with audit context. The current product is intentionally MVP-scoped and designed for early design partners validating this closed-loop flow.

## One-line product description
SignalGrid is a closed-loop decision layer that evaluates session-start risk, attempts remediation for non-compliant posture, and returns a final access decision with audit context.

## Problem statement
Security teams can detect posture risk and enforce allow/deny policy, but often lack an operational loop that handles remediation attempts and clear final outcomes at session start. This creates manual work, slower access decisions, and inconsistent decision trails.

## Solution statement
SignalGrid runs in the pre-access decision path. It ingests identity/device/session risk inputs, applies policy logic, attempts remediation for non-compliant posture, re-evaluates trust, and returns a final decision (`allow` or `deny`) with explainable reasons and an auditable record.

## Where SignalGrid fits (vs. Intune/Entra and existing security tooling)
- **Intune (or other UEM/MDM):** source of device and compliance posture signals.
- **Entra Conditional Access (or similar enforcement layer):** enforces access controls based on policy outcomes.
- **SignalGrid:** decision-and-closure layer between detection and outcome at session start.
- **Other security tooling (SIEM/ITSM/NAC):** surrounding systems for monitoring and operations; not replaced by SignalGrid.

In practice: Intune reports posture, Entra enforces policy, and SignalGrid closes the loop on what happens next when posture risk appears.

## MVP boundary statement
SignalGrid is currently in MVP closed-loop launch mode, scoped to session-start behavior:
- Compliant posture → `allow`
- Non-compliant posture → remediation attempt → final `allow` or `deny`
- Unknown posture → fail-closed `deny`
- Final output includes decision, reason, timestamp, and remediation context (when attempted)

Out of scope for current MVP: broad enterprise remediation coverage, full production hardening claims, and large-scale multi-system orchestration claims.

## Tagline options
- Close the loop before access breaks.
- Decide, remediate, and verify—before session start.
- From posture signal to final access outcome.
- The closed-loop decision layer for access risk.
- Turn risk signals into auditable access decisions.
