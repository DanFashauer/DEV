# Roadmap

Date: 2026-05-13
Current source of truth for readiness hygiene: [`docs/READINESS_HYGIENE_STATUS.md`](READINESS_HYGIENE_STATUS.md).

## Current phase

SignalGrid is in **controlled demo readiness**. The immediate goal is to move from repeatable demo proof to a constrained pilot posture without overstating production maturity.

## Phase 0 — Readiness hygiene closeout

- Remove remaining public v1 default API-key and HMAC-secret fallbacks.
- Isolate local/demo defaults behind explicit local-only scripts and documentation.
- Choose and document the canonical package manager and lockfile strategy.
- Pin local and CI toolchain versions.
- Fill, archive, or delete placeholder docs that are not active sources of truth.
- Reconcile dated audit/review documents with the current readiness status.

## Phase 1 — Demo confidence

- Keep `/demo` as the safe buyer walkthrough path with simulated deterministic scenarios.
- Keep the executive deny-path demo as the canonical live script until all scenario checks are equally strong.
- Add scenario-specific verification for allow, deny, and unknown-posture outcomes.
- Ensure any remediation language is explicitly labeled as simulated until a real audited loop exists.

## Phase 2 — Pilot readiness

- Validate production container build/run/healthcheck workflow in a Docker-capable environment.
- Define pilot customer scope, success metrics, owners, rollback steps, and support paths.
- Harden shared/staging environment configuration so missing secrets fail closed.
- Confirm operational runbook coverage for deployment, monitoring, incidents, and rollback.

## Phase 3 — Production readiness

- Replace temporary admin API-key operation with customer-approved identity/admin access.
- Complete integration-specific security validation for customer-selected NAC, SIEM, ITSM, MDM/UEM, and identity systems.
- Add load, resiliency, and security validation reports for the actual deployment topology.
- Finalize legal/commercial/security review artifacts before external production use.

## Non-goals for current phase

- Broad feature expansion beyond demo/pilot-critical trust decisions.
- Claims that SignalGrid replaces MDM, IAM, NAC, SIEM, or ITSM systems.
- Production availability, compliance, or remediation guarantees before validation evidence exists.
