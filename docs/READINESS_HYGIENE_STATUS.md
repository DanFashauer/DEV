# SignalGrid Readiness Hygiene Status

Date: 2026-05-13
Scope: repository documentation and readiness-facing checks for demo, pilot, launch, and production hygiene.

## Executive summary

SignalGrid is **demo-ready for controlled conversations** and has several hardening improvements already reflected in code, but it is **not yet pilot-ready or production-ready**. The remaining readiness gap is mostly around production-safe defaults, canonical package-manager/toolchain hygiene, Docker/environment validation, and cleanup of stale documentation that described older runtime behavior.

Use this file as the current source of truth for readiness hygiene until the open items below are closed or moved into tickets.

## Current readiness state

| Area | Current state | Notes |
| --- | --- | --- |
| Browser demo | Ready | `/demo` uses deterministic simulated scenarios and is safe for walkthroughs. |
| Scripted executive demo | Ready with constraints | Canonical deny-path demo is still the safest live script. |
| Compliant allow scenario | Ready when posture fixture is seeded | Session-start now reads posture from the telemetry store; no unknown-posture bypass should be required when a fresh compliant fixture exists. |
| Unknown posture behavior | Complete | Unknown posture fails closed by default unless `UNKNOWN_POSTURE_MODE=allow` is explicitly set. |
| Session extension wording | Complete | Existing active sessions update `expiresAt` and `lastActivityAt` before returning `Existing session extended`. |
| API-key helper hardening | Complete for `src/lib/utils/apiKeyAuth.ts` | This helper now fails closed when `ADMIN_API_KEY` is absent. |
| Webhook dispatcher signing fallback | Complete for integration dispatcher | Webhook dispatch now fails if a signing secret cannot be resolved. |
| ITSM credential encryption fallback | Complete for ITSM store | Credential encryption now requires `ITSM_ENCRYPTION_KEY` or `ENCRYPTION_KEY`. |
| Public `/api/v1/*` compatibility defaults | Open | `src/app/api/v1/[...path]/route.ts` still has fallback `test-api-key` and `dev-secret` values. |
| Package-manager/toolchain policy | Open | README uses npm, many scripts/docs use Bun, and both lockfiles are present. |
| Docker/customer-hosted validation | Open | Production runbook exists, but Docker build/run validation still needs a Docker-capable environment. |
| Business/manual cutover | Open / external | Domain, email, legal, bank, outreach, and PR cleanup tasks are founder/manual activities. |

## Completed readiness hygiene

1. **Unknown posture fail-closed default is implemented.** Session start rejects unknown posture with `DEVICE_POSTURE_UNKNOWN` unless `UNKNOWN_POSTURE_MODE=allow` is deliberately enabled.
2. **Session-start posture reads are no longer hardcoded unknown.** Fleet and UEM context now read the shared telemetry posture store and only return unknown when data is missing or expired.
3. **Non-compliant deny path remains the canonical live demo.** The executive script path can seed non-compliant posture and demonstrate deny-side effects for security/integration visibility.
4. **API-key helper fallback was removed.** The reusable API-key helper requires an explicit `ADMIN_API_KEY` and returns `API_KEY_NOT_CONFIGURED` when absent.
5. **Webhook dispatcher fallback secret was removed.** The dispatcher records a failed delivery when no signing secret is configured rather than signing with a predictable default.
6. **ITSM credential encryption fallback was removed.** ITSM credential writes now require an explicit encryption key.
7. **Session extension semantics are aligned.** The active-session branch updates expiration/activity timestamps before reporting that the session was extended.

## Not completed yet

### P0 — Remaining security/config defaults

- **Public v1 API auth fallback remains.** `src/app/api/v1/[...path]/route.ts` still falls back to `test-api-key` when `ADMIN_API_KEY` is absent. Remove this before shared staging, pilots, or production.
- **Public v1 signature fallback remains.** The same route still falls back to `dev-secret` when `DEVICE_WEBHOOK_SECRET` and `BACKEND_SIGNING_SECRET` are absent. Remove or explicitly gate this for local-only test mode.
- **Demo/test scripts still publish default keys.** Demo and test helpers intentionally seed local defaults such as `dev-admin-key-12345`; keep them isolated to local/demo workflows and do not treat them as production-safe defaults.

### P1 — Environment and repo reproducibility

- **Canonical package manager is unresolved.** README onboarding says npm, while active demo/test scripts and CI-style commands rely heavily on Bun. Pick one primary path, document the secondary path if needed, and keep lockfiles consistent.
- **Toolchain versions need pinning.** Add a Node/Bun version policy (`.nvmrc`, `.node-version`, `.tool-versions`, `.npmrc`, or equivalent) and avoid moving `latest` targets in automation.
- **Docker validation remains unproven in this environment.** Run production image build/run checks in a Docker-capable environment and record the exact commands/results in the production runbook or a validation report.

### P1 — Demo/pilot maturity

- **Real remediation loop is not yet implemented.** Current remediation language should remain framed as demo narrative/simulated side effects until there is an audited `attempted → re-check → final decision` workflow.
- **Scenario verification should be split by scenario.** `/api/demo/verify` is most useful for the deny-path timeline; add explicit allow/deny/unknown selectors before using it as broad demo proof.
- **Pilot success metrics and operational owner model need customer-specific completion.** The pilot execution docs provide templates, but signed scope, metrics, owner, rollback, and support paths are not yet completed.

### P2 — Documentation/source-of-truth cleanup

- **Placeholder docs remain.** `docs/CLAIM_BOUNDARIES.md`, `docs/VALUE_MAP.md`, `docs/PRODUCT_BOARD.md`, `docs/INTEGRATION_PRIORITIES.md`, and `docs/ARCHITECTURE_FUTURE_NOTES.md` still need real content or deletion if they are not intended sources of truth.
- **Old dated review docs should be treated as historical.** `docs/REPO_REVIEW_NEXT_STEPS_2026-03-30.md` and `docs/REPO_ENV_AUDIT_2026-03-31.md` contain useful backlog context, but several findings have changed and should not override this status file.
- **Manual cutover doc still references PR #72.** Confirm current GitHub state; if PR #72 is already closed or irrelevant, update or archive that checklist.

## Outdated or conflicting docs to reconcile

| Document | Conflict/outdated point | Current guidance |
| --- | --- | --- |
| `docs/DEMO_READINESS_CHECKLIST.md` | Older text said posture adapters were hardcoded unknown and compliant/non-compliant scenarios were blocked. | Updated to state posture reads come from the telemetry store and scenarios are ready when seeded with fresh fixtures. |
| `docs/REPO_REVIEW_NEXT_STEPS_2026-03-30.md` | Lists some findings as still open even though API-key helper, webhook dispatcher, ITSM encryption, unknown posture, and session extension have been hardened. | Treat as historical backlog evidence; use this status file for current state. |
| `docs/REPO_ENV_AUDIT_2026-03-31.md` | Refers to the dated hardening backlog as still prioritized wholesale. | Keep environment/package-manager findings active, but re-check individual code findings before implementation. |
| `docs/CODEX_COMPLETE_CUTOVER_CHECKLIST.md` | Mentions PR #72 and launch-critical PR noise without current GitHub verification. | Treat as manual GitHub cleanup pending confirmation. |
| `README.md` | Says pilot readiness is tracked in roadmap docs while roadmap was previously a placeholder. | Roadmap now summarizes active readiness priorities and links to this status file. |

## Next decision checklist

Before calling SignalGrid pilot-ready, all of the following should be true:

- [ ] No runtime route used in shared environments has default API keys, default HMAC secrets, or default encryption keys.
- [ ] Demo/test defaults are explicitly local-only and impossible to enable accidentally in production/shared staging.
- [ ] Package manager, lockfile, and toolchain versions are documented and pinned.
- [ ] Docker production build/run/healthcheck path is validated in a Docker-capable environment.
- [ ] Demo verification has independent pass/fail checks for allow, deny, and unknown scenarios.
- [ ] Remediation claims are either implemented as an auditable loop or consistently described as simulated/demo narrative.
- [ ] Placeholder docs are filled, deleted, or marked intentionally deferred.
- [ ] Manual business/cutover items are completed or clearly excluded from technical readiness.
