# SignalGrid Founder One-Pager

## Company
**SignalGrid**

## One-line product description
SignalGrid is a shared-device access and runtime decision platform between authentication and enforcement that evaluates identity, device, and session risk, attempts remediation when possible, and returns a final access outcome with audit context.

## Founder / investor blurb
Modern security stacks are fragmented across identity, device, experience, and enforcement layers. Those systems can authenticate, configure, and observe—but they still do not own the decision of what happens next when runtime conditions degrade. SignalGrid is the runtime decision layer that unifies those signals, attempts remediation when possible, and determines the correct access outcome before disruption occurs.
The initial launch wedge is frontline shared-device workflows where friction and downtime are most visible, with expansion potential across other industries over time.

## Problem
Security and access teams often have the right controls but a broken flow at decision time:
- Identity systems authenticate.
- Device and posture systems report state.
- Enforcement systems apply allow/deny policy.
- When risk is found, users and operators still fall into manual, slow remediation paths.

The gap is the runtime loop between authentication, remediation attempt, and final outcome before workflow disruption.

## Solution
SignalGrid runs in the runtime decision path between authentication and enforcement before access proceeds:
1. Ingests identity/device/session risk inputs at session start.
2. Evaluates trust and determines whether remediation should be attempted.
3. Re-evaluates trust after remediation attempt.
4. Returns a final `allow` or `deny` decision with reasons and audit trail.

This positions SignalGrid as additive to existing controls, not a rip-and-replace replacement.
SignalGrid ensures access decisions reflect runtime truth, not stale or incomplete signals.

## MVP scope (locked)
Current MVP is intentionally narrow and focused on the session-start closed loop:
- **Compliant posture:** `allow`.
- **Non-compliant posture:** remediation attempt, then final `allow` or `deny`.
- **Unknown posture:** fail-closed `deny`.
- Decision output includes final decision, reason, timestamp, and remediation context when applicable.
- Audit trail records enough detail to reconstruct decision flow.

Out of scope for MVP: full enterprise remediation integrations, complete production hardening, and broad multi-system orchestration.

## Where SignalGrid fits (Intune / Entra / broader tooling)
SignalGrid sits between system-of-record and enforcement controls:
- **Intune (or other UEM/MDM):** provides device/compliance posture signals.
- **DEX platforms:** show endpoint/user experience failures and friction signals.
- **Entra Conditional Access (or equivalent):** enforces access policy outcomes.
- **SignalGrid:** runtime decision layer that decides what should happen next when risk is detected, including remediation attempt and final outcome logic.

In short: UEM tools show what is configured, DEX tools show what is failing, and SignalGrid decides what happens next before enforcement. SignalGrid is additive and does not replace IAM, UEM, DEX, or enforcement systems.

## Who it is for
- Frontline environments with shared-device workflows, including healthcare and operations-heavy teams.
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
