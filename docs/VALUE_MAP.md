# SignalGrid Value Map

SignalGrid connects shared-device access decisions to executive, IT/security, frontline, and audit outcomes. This map keeps the business value concise without expanding beyond current MVP/demo readiness.

## Executive value

| Outcome | SignalGrid contribution |
| --- | --- |
| Risk reduction | Makes access decisions explicit instead of assuming shared-device trust. |
| Operational resilience | Gives frontline workflows a deterministic allow/deny/step-up path when runtime conditions change. |
| Accountability | Preserves decision context for review, audit, and post-incident learning. |
| Tool leverage | Uses existing identity, posture, ticketing, security, and enforcement systems instead of replacing them. |
| Pilot clarity | Defines measurable workflow outcomes before broader rollout. |

## IT and security value

- Connects badge/session context with device posture and policy decisions.
- Fails closed when posture is unknown by default.
- Provides a single decision point that can coordinate downstream actions.
- Makes NAC, SIEM, ITSM, and audit outputs easier to explain in a shared-device workflow.
- Reduces ambiguity between “authenticated user” and “trusted session.”

## Frontline/shared-device workflow value

- Supports fast, deterministic session decisions for shared and mobile devices.
- Reduces manual interpretation of device health and access risk.
- Helps teams understand why access was allowed, denied, or routed to another action.
- Keeps demos focused on realistic healthcare, logistics, and regulated frontline scenarios.
- Protects user experience by making policy behavior predictable before pilot rollout.

## Audit and compliance value

SignalGrid is not a compliance certification product, but it can strengthen evidence quality by recording:

- Identity and badge/session context used in the decision.
- Device posture status and unknown/non-compliant handling.
- Policy outcome, risk context, and final decision.
- Downstream demo or integration action records.
- Timestamps and reason codes useful for review.

## Measurable pilot metrics

Potential pilot success metrics should be agreed with the design partner before deployment. Examples include:

| Metric | Why it matters |
| --- | --- |
| Unknown-posture deny rate | Shows where posture telemetry or enrollment is incomplete. |
| Non-compliant access attempts | Quantifies risky shared-device sessions before access proceeds. |
| Decision latency | Confirms the workflow remains usable for frontline staff. |
| Manual escalation volume | Measures whether decision context reduces help desk or security triage burden. |
| Successful compliant starts | Confirms trusted sessions proceed without unnecessary friction. |
| Audit record completeness | Verifies that reviewers can reconstruct access decisions. |
| Integration action accuracy | Confirms downstream NAC/SIEM/ITSM actions match policy intent during pilot scope. |

## Pilot value statement

A good pilot should prove that SignalGrid can make shared-device access decisions clearer, safer, and easier to audit without adding unacceptable frontline friction.
