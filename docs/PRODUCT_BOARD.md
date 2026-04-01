# SignalGrid Product Board (Grounded)

SignalGrid category anchor: **The Decision Layer for Enterprise Risk**.

Prioritization model:
- **Now** = highest pilot value + lowest implementation risk.
- **Next** = strong strategic expansion with manageable execution risk.
- **Later** = meaningful, but not blocking initial pilot success.
- **Concept only** = narrative/research themes, not current product claims.

## Idea buckets with classification

### 1) Identity and client authenticity

| Idea | Classification | Why |
|---|---|---|
| Identity + posture-informed access decisions at session start | Supported now | Implemented in current decision flow and policy evaluation path. |
| Step-up/deny actions based on trust degradation | Supported now | Existing policy action model supports trust-based enforcement actions. |
| Stronger client-authenticity weighting (cert/device evidence) | Next | Valuable expansion once upstream evidence quality is standardized. |
| Hardware-backed client confidence as first-class scoring input | Concept only | Strategic direction, not yet codified as shipped product behavior. |

### 2) Device trust / posture / attestation

| Idea | Classification | Why |
|---|---|---|
| UEM/Fleet posture normalization into decision context | Supported now | Current posture services feed policy and session decisions. |
| Unknown-posture fail-closed mode for protected flows | Supported now | Existing posture gating and deny-mode policy behavior. |
| Attestation evidence confidence tiers | Next | Clear value, requires tighter signal contracts and scoring policy. |
| Full attestation-aware policy pack across all workflows | Later | Depends on broader telemetry maturity and rollout readiness. |

### 3) Physical access / badge ecosystem / mobile credentials

| Idea | Classification | Why |
|---|---|---|
| Badge-driven shared-device session initiation | Supported now | Core current access entrypoint for frontline workflows. |
| Expanded badge/mobile credential provider integrations | Next | High GTM impact for beachhead expansion. |
| HID/mobile wallet credential orchestration patterns | Later | Important expansion but not required for current pilot value. |
| Unified physical+digital trust fabric | Concept only | Compelling thesis theme; requires broader product surface. |

### 4) Decisioning / enforcement / ITSM-SIEM-NAC orchestration

| Idea | Classification | Why |
|---|---|---|
| Real-time policy decision and enforcement dispatch | Supported now | Existing allow/deny/action execution pattern in platform. |
| Integration-backed remediation playbooks | Next | Builds directly on existing integration adapters and policy actions. |
| Decision memory + reusable suppression logic | Later | Meaningful operational gain, but not a pilot blocker. |
| Autonomous policy suggestions | Concept only | Architecture direction requiring safety and governance controls. |

## Now (top priorities)

1. Stabilize session-start trust decisions (identity + posture + policy) with fail-closed defaults.
2. Improve decision explainability in admin views (why allow/deny/step-up happened).
3. Harden integration reliability for NAC, SIEM, ITSM, and webhooks in pilot workflows.
4. Reduce shared-device friction while preserving posture-aware controls.
5. Tighten audit/security-event quality for governance and incident review.

## Next (top priorities)

1. Expand client-authenticity signal weighting with explicit confidence levels.
2. Package repeatable remediation playbooks for common denied-session patterns.
3. Improve policy authoring ergonomics for identity/platform/endpoint operators.
4. Expand endpoint and shared-device deployment patterns for regulated environments.
5. Add stronger operational coverage metrics (latency, enforcement success, protected-flow coverage).

## Later

1. Decision memory across incident patterns and outcomes.
2. Human-reviewed policy tuning suggestions.
3. Broader control-plane coverage for privileged/app/API decisions.
4. Governance workflows for policy change approvals and accountability.
5. Multi-site/multi-tenant reliability maturity layers.

## Concept only themes

- Hardware-backed identity confidence as a first-class policy signal.
- Unified trust fabric spanning badge, endpoint, session, and workflow layers.
- Autonomous orchestration recommendations from incident pattern learning.
- Deep attestation-aware trust scoring across heterogeneous enterprise stacks.
- Cross-domain trust governance as a long-term control-plane layer.
