# SignalGrid Readiness Hygiene Status

Date: 2026-05-13
Scope: repository documentation and readiness-facing checks for demo, pilot, launch, and production hygiene.

## Executive summary

SignalGrid is **demo-ready for controlled conversations** and has several hardening improvements already reflected in code. It is not yet broad production-ready. The remaining readiness gap is mostly around Docker/customer-hosted validation, remediation-loop maturity, polished browser media capture, and reworked dependency major upgrades.

Use this file as the current source of truth for readiness hygiene until the open items below are closed or moved into tickets.

## Current readiness state

| Area | Current state | Notes |
| --- | --- | --- |
| Browser demo | Ready | `/demo` uses deterministic simulated scenarios and is safe for walkthroughs. |
| Scripted executive demo | Ready with constraints | Canonical deny-path demo is still the safest live script. |
| Scenario-specific demo verification | Complete | `/api/demo/verify?scenario=compliant|non-compliant|unknown|all` returns deterministic machine-readable PASS/FAIL checks. |
| Compliant allow scenario | Ready when posture fixture is seeded | Session-start reads posture from the telemetry store; missing or expired posture still fails closed unless explicitly overridden for local/demo use. |
| Unknown posture behavior | Complete | Unknown posture fails closed by default unless `UNKNOWN_POSTURE_MODE=allow` is explicitly set. |
| Session extension wording | Complete | Existing active sessions update `expiresAt` and `lastActivityAt` before returning `Existing session extended`. |
| API-key helper hardening | Complete for `src/lib/utils/apiKeyAuth.ts` | This helper now fails closed when `ADMIN_API_KEY` is absent. |
| Webhook dispatcher signing fallback | Complete for integration dispatcher | Webhook dispatch now fails if a signing secret cannot be resolved. |
| ITSM credential encryption fallback | Complete for ITSM store | Credential encryption now requires `ITSM_ENCRYPTION_KEY` or `ENCRYPTION_KEY`. |
| Public `/api/v1/*` compatibility defaults | Complete for runtime route | `/api/v1/*` now fails closed when required `ADMIN_API_KEY`, `DEVICE_WEBHOOK_SECRET`, or `BACKEND_SIGNING_SECRET` values are missing. |
| Package-manager/toolchain policy | Mostly complete | Node 22 is pinned via `.nvmrc`; npm is the primary package manager; Bun is scoped to demo/media scripts and pinned in demo CI. |
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
8. **Scenario-specific demo verification is implemented.** Each canonical demo scenario can be checked independently or as an aggregate `all` run.
9. **Public v1 API fallbacks are fail-closed.** Runtime v1 auth/signing paths no longer fall back to default API keys or default HMAC secrets.
10. **Toolchain policy is clearer.** Node 22 is pinned, npm remains primary, and Bun usage is scoped to existing demo/media automation.

## Not completed yet

### P1 — Demo/pilot maturity

- **Real remediation loop is not yet implemented.** Current remediation language should remain framed as demo narrative/simulated side effects until there is an audited `attempted → re-check → final decision` workflow.
- **Pilot success metrics and operational owner model need customer-specific completion.** The pilot execution docs provide templates, but signed scope, metrics, owner, rollback, and support paths are not yet completed.
- **Polished screenshot/video capture still requires browser binaries.** `npm run demo:media` can produce deterministic storyboard artifacts when Playwright browsers are unavailable; polished screenshots/video need a browser-capable environment.

### P1 — Environment and repo reproducibility

- **Docker validation remains unproven in this environment.** Run production image build/run checks in a Docker-capable environment and record the exact commands/results in the production runbook or a validation report.
- **Dependabot major upgrades need rework.** PR #92 and PR #93 should not merge as-is because validation exposed typecheck/tooling migration blockers.

### P2 — Documentation/source-of-truth cleanup

- **Old dated review docs should be treated as historical.** `docs/REPO_REVIEW_NEXT_STEPS_2026-03-30.md` and `docs/REPO_ENV_AUDIT_2026-03-31.md` contain useful backlog context, but several findings have changed and should not override this status file.
- **Manual cutover doc still references PR #72.** PR #72 is closed; archive or update that checklist when doing final launch-ops cleanup.

## Dependabot status

| PR | Recommendation | Reason |
| --- | --- | --- |
| #92 production dependency group | Do not merge as-is | `npm run typecheck` fails after the upgrade, especially around Zod 4 migration issues and stricter dependency types. |
| #93 development dependency group | Do not merge as-is | `npm run typecheck` fails with TypeScript 6 `baseUrl` deprecation; ESLint 10 and Vitest 4 should be split/reworked after config compatibility is resolved. |

## Next decision checklist

Before calling SignalGrid pilot-ready, all of the following should be true:

- [x] Runtime v1 routes fail closed when required API keys or signing secrets are absent.
- [x] Demo verification has independent pass/fail checks for allow, deny, and unknown scenarios.
- [x] Node version and demo CI Bun usage are pinned/documented.
- [ ] Docker production build/run/healthcheck path is validated in a Docker-capable environment.
- [ ] Remediation claims are either implemented as an auditable loop or consistently described as simulated/demo narrative.
- [ ] Demo/test defaults are explicitly local-only and impossible to enable accidentally in production/shared staging.
- [ ] Manual business/cutover items are completed or clearly excluded from technical readiness.
