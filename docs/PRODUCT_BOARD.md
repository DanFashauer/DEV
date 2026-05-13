# SignalGrid Product Board

This board summarizes current MVP scope, near-term readiness work, pilot-readiness work, and future direction. It is intentionally conservative so the repository remains business-presentable without overstating maturity.

## Current MVP

- Browser `/demo` experience for deterministic buyer-safe walkthroughs.
- Safe simulated demo API for compliant, non-compliant, and unknown-posture outcomes.
- Session-start groundwork for signed requests, badge mapping, posture checks, and allow/deny responses.
- Unknown-posture fail-closed behavior by default.
- Demo tooling for scripted walkthroughs, validation, and media capture.
- Production-oriented runbook/container/API foundation that still needs environment-specific validation.
- Security, disclaimer, and claim-boundary documentation for MVP positioning.

## Near-term demo confidence work

- Keep demo scenarios deterministic and easy to reset.
- Add scenario-specific verification for allow, deny, and unknown-posture paths.
- Keep generated demo media current after demo UI/API changes.
- Maintain clear labels for simulated behavior and sample data.
- Avoid real webhooks, production secrets, or production data in demo workflows.

## Pilot-readiness work

- Remove or explicitly local-gate remaining default keys/secrets in runtime routes.
- Validate Docker build/run/healthcheck in a Docker-capable environment.
- Define target customer workflow, success metrics, owners, rollback path, and support model.
- Validate customer-selected integrations with scoped credentials and safe test targets.
- Confirm audit records are complete enough for pilot review.
- Document operational procedures for deployment, monitoring, incidents, and rollback.

## Future roadmap

- Event-driven decision gateway for runtime access decisions.
- Constrained remediation playbooks with explicit audit states.
- Deeper posture integrations with selected UEM/MDM and endpoint telemetry systems.
- More complete admin workflows for policy configuration, review, and reporting.
- Expanded integration catalog after first pilot workflows prove repeatable.
- Optional AI-assisted explanation/classification features under strict guardrails.

## Non-goals

- Replacing IAM, UEM/MDM, DEX, NAC, SIEM, SOAR, or ITSM platforms.
- Broad autonomous remediation without explicit policy, approval, isolation, and audit controls.
- Expanding product surface before demo and pilot evidence is stable.
- Claiming production readiness before deployment validation is complete.
- Using real customer data in demos or media capture workflows.
