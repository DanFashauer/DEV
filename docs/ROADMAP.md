# SignalGrid Roadmap (Working)

This roadmap is a directional planning artifact and will evolve as implementation and pilot feedback mature.

SignalGrid remains positioned as **The Decision Layer for Enterprise Risk**: Others detect. SignalGrid decides.

## Planning buckets

1. Identity and client authenticity
2. Device trust / posture / attestation
3. Physical access / badge ecosystem / mobile credentials
4. Decisioning / enforcement / ITSM-SIEM-NAC orchestration

## Supported now (implemented behavior)

- Badge-driven session start with request validation, rate limits, and fail-closed posture gating.
- Policy-evaluated allow / deny / step-up-style directives with audit/security event capture.
- Device posture ingestion and normalization from UEM/Fleet pathways.
- Integration paths for NAC, SIEM, ITSM, and webhooks with operational logging.

## Next (near-term roadmap)

- Tighten trust-evidence modeling (identity + posture + client authenticity signals) into clearer policy inputs.
- Expand pilot-ready policy packs for shared-device and frontline workflows.
- Improve admin/operator visibility into why decisions were made and which signals drove outcomes.
- Standardize enforcement playbooks across NAC, ITSM, and endpoint workflows.
- Expand integration depth across identity, endpoint, and IT operations systems needed for enterprise rollout.

## Later (future concept direction)

- Decision memory and reusable remediation patterns across repeated incident types.
- Broader trust orchestration for app/API/session layers beyond initial beachhead flows.
- Governance automation for cross-team policy change management and accountability.
- Higher-scale resilience patterns for multi-site and multi-tenant enterprise programs.

## Concept only (narrative/research)

- Hardware-backed trust as a first-class score input across all decisions.
- Autonomous policy suggestions with human approval loops.
- Unified trust fabric linking physical and digital identity planes.
