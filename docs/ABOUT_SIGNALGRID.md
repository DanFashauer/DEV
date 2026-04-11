# About SignalGrid

## Short company description
SignalGrid is the runtime decision layer between authentication and enforcement that resolves identity, device, and session risk before access breaks.

## Medium company description
Modern enterprise stacks can authenticate identity, enforce policy, and visualize issues, but they still leave a critical gap between risk detection and final access outcome. SignalGrid fills that gap by evaluating identity, device posture, and session risk at runtime, attempting remediation when possible, re-evaluating trust, and returning a final access decision before disruption reaches the business.

## Longer company description
SignalGrid exists to close the decision gap between authentication and enforcement in modern enterprise environments. Today’s stacks are strong at verifying identity, managing endpoints, and observing failures, but they still leave operators with the same problem: when runtime conditions degrade, the common result is a block, a lockout, or a manual recovery process. SignalGrid adds a runtime decision layer that connects identity, device, and session signals, attempts remediation when possible, re-evaluates trust, and returns the correct final access outcome before disruption reaches the business.

SignalGrid's core principle: access decisions should reflect runtime truth, not stale or incomplete signals.

## One-line product description
SignalGrid is a runtime decision layer that evaluates identity, device, and session risk at session start, attempts remediation when possible, and returns a final access decision with audit context.

## Problem statement
Authentication and enforcement are necessary, but they are not sufficient. When risk is detected, most systems either block access or rely on manual intervention. That creates lockouts, delays, and operational friction at exactly the moment when systems should be making the right decision automatically.

## Solution statement
SignalGrid sits between authentication and enforcement to make the correct access decision at runtime. It evaluates identity, device posture, and session risk, attempts remediation when possible, re-evaluates trust after response, and returns a final allow or deny outcome with audit context.

## Differentiator
Authentication proves identity. SignalGrid ensures the system is actually capable of operating before access is granted.

## Guardrail
SignalGrid does not replace IAM, UEM, or DEX tools. It operationalizes real-time decisioning between them.

## Where SignalGrid fits (vs. Intune/Entra and existing security tooling)
- **Intune (or other UEM/MDM):** source of device and compliance posture signals.
- **Entra Conditional Access (or similar enforcement layer):** enforces access controls based on policy outcomes.
- **DEX tools:** highlight user experience and endpoint failures.
- **SignalGrid:** runtime decision layer between authentication and enforcement that determines what happens next.
- **Other security tooling (SIEM/ITSM/NAC):** surrounding systems for monitoring and operations; not replaced by SignalGrid.

In practice: UEM tools show what is configured, DEX tools show what is failing, enforcement systems apply policy outcomes, and SignalGrid decides what happens next. SignalGrid does not replace IAM, UEM, DEX, or enforcement tooling.

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
