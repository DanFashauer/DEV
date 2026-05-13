# SignalGrid Claim Boundaries

SignalGrid should be described with clear MVP/demo boundaries. Use this document when preparing website copy, demos, sales materials, investor notes, or partner outreach.

## What SignalGrid can claim today

SignalGrid can credibly claim that it:

- Provides a working MVP/demo path for posture-aware shared-device session decisions.
- Evaluates identity, device posture, session context, and policy inputs before returning an access outcome.
- Demonstrates deterministic outcomes for compliant, non-compliant, and unknown-posture scenarios.
- Fails closed for unknown posture in the current session-start path unless an explicit local/demo override is configured.
- Produces auditable decision context and demo-visible integration/action records.
- Includes simulated/demo workflows for NAC, SIEM, ITSM, and remediation-oriented narratives.
- Includes production-oriented packaging and runbook foundations that still require deployment-specific validation.

## What is simulated or demo-only

The following should be labeled as simulated, deterministic demo behavior, or implementation foundation unless validated in a real pilot environment:

- Browser `/demo` scenarios and demo media outputs.
- Demo integration payload previews for NAC, SIEM, ITSM, and related action logs.
- Remediation attempts described in the current demo narrative.
- Any fallback storyboard media generated when browser capture is unavailable.
- Local/demo default keys or local-only script configuration.
- Buyer-safe sample data, seeded posture fixtures, and simulated frontline scenarios.

## What not to claim yet

Do not claim the following until pilot or production validation exists for the target environment:

- Production readiness for a customer deployment.
- Guaranteed uptime, latency, scale, resilience, or compliance outcomes.
- Certified regulatory compliance such as HIPAA, SOC 2, ISO 27001, FedRAMP, or PCI.
- Fully automated remediation with verified post-remediation re-checks.
- Live customer integrations with a specific IAM, UEM/MDM, DEX, NAC, SIEM, ITSM, or badge system unless that integration has been configured and validated.
- Replacement of existing identity, endpoint, observability, network, ticketing, or device-management systems.
- AI-driven autonomous enforcement decisions.

## Replacement boundaries

SignalGrid is positioned as a decision and orchestration layer between authentication, device posture, and enforcement systems. It does **not** replace:

| Existing category | Boundary language |
| --- | --- |
| IAM / identity provider | SignalGrid uses identity context; it does not replace identity proofing, authentication, or directory ownership. |
| UEM / MDM | SignalGrid consumes posture and enrollment signals; it does not manage full device lifecycle, configuration, or app deployment. |
| DEX / observability | SignalGrid can use operational signals; it does not replace broad employee-experience monitoring or telemetry platforms. |
| NAC / network enforcement | SignalGrid can request enforcement actions; it does not replace network control planes. |
| SIEM / SOAR | SignalGrid emits and enriches events; it does not replace security analytics, incident investigation, or enterprise SOAR governance. |
| ITSM | SignalGrid can create or update workflow records; it does not replace ticketing, change management, or service operations ownership. |

## Safe phrasing

Use language like:

- “SignalGrid sits between authentication and enforcement to make shared-device access decisions based on runtime trust.”
- “The current MVP demonstrates deterministic access outcomes and auditable decision context.”
- “Pilot readiness depends on customer-specific integration validation, operational runbooks, and removal of local/demo defaults.”
- “Remediation is currently shown as a constrained demo narrative unless explicitly implemented and validated in the target environment.”

Avoid language like:

- “Production-ready today.”
- “Replaces your MDM/IAM/NAC/SIEM/ITSM stack.”
- “Fully autonomous remediation.”
- “Compliance guaranteed.”
- “AI decides who gets access.”
