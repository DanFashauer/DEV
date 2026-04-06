# SignalGrid Founder One-Pager

## Company
**SignalGrid**

## One-line product description
SignalGrid is a closed-loop decision layer that evaluates session-start risk, attempts remediation for non-compliant posture, and returns a final access outcome with audit context.

## Problem
Security and access teams often have the right controls but a broken flow at decision time:
- Device and posture systems report state.
- Conditional access systems enforce allow/deny.
- When risk is found, users and operators still fall into manual, slow remediation paths.

The gap is the loop between detection, remediation attempt, and final outcome before workflow disruption.

## Solution
SignalGrid runs in the decision path before access proceeds:
1. Ingests identity/device/session risk inputs at session start.
2. Evaluates trust and determines whether remediation should be attempted.
3. Re-evaluates trust after remediation attempt.
4. Returns a final `allow` or `deny` decision with reasons and audit trail.

This positions SignalGrid as additive to existing controls, not a rip-and-replace replacement.

## MVP scope (locked)
Current MVP is intentionally narrow and focused on the session-start closed loop:
- **Compliant posture:** `allow`.
- **Non-compliant posture:** remediation attempt, then final `allow` or `deny`.
- **Unknown posture:** fail-closed `deny`.
- Decision output includes final decision, reason, timestamp, and remediation context when applicable.
- Audit trail records enough detail to reconstruct decision flow.

Out of scope for MVP: full enterprise remediation integrations, complete production hardening, and broad multi-system orchestration.

## Where SignalGrid fits (Intune / Entra / broader tooling)
SignalGrid sits above system-of-record and enforcement controls:
- **Intune (or other UEM/MDM):** provides device/compliance posture signals.
- **Entra Conditional Access (or equivalent):** enforces access policy outcomes.
- **SignalGrid:** decides what should happen next when risk is detected, including remediation attempt and final outcome logic.

In short: Intune reports posture, Entra enforces policy, and SignalGrid closes the operational loop between detection and outcome.

## Who it is for
- Identity and access teams.
- Endpoint/UEM and mobility teams.
- Security operations and Zero Trust program owners.
- Early design partners that need clearer, auditable session-start decisions without replacing core Microsoft controls.

## Why now
Organizations are under pressure to reduce access friction and tighten control at the same time. Most stacks can detect and block, but often stop before practical remediation and outcome closure. A closed-loop decision layer is now a pragmatic way to improve security outcomes without re-platforming.

## Current launch status
SignalGrid is in MVP closed-loop launch mode:
- MVP contract is documented and locked to session-start behavior.
- Landing page narrative is live around closed-loop positioning.
- Launch checklist is defined for product, website, outreach, and founder manual tasks.
- CTA/contact path is in place for early design-partner conversations.

Immediate priority: use this one-pager for outreach, website/about copy, and early deck narrative while keeping claims within MVP boundaries.
