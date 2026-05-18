# SignalGrid Bug Bash Report

Date: 2026-05-14
Scope: demo readiness, scenario verification, v1 compatibility API fail-closed behavior, dependency update triage, and buyer-demo stability.

## Executive summary

SignalGrid is demo-ready for controlled buyer walkthroughs. No P0 demo blockers were found after the validation pass. The browser demo and deterministic demo API remain safe/simulated, scenario-specific verification is available for all canonical outcomes, and the `/api/v1/*` compatibility surface now fails closed when required API keys or HMAC signing secrets are missing.

Remediation should remain described as simulated/talk-track until an audited remediation loop exists.

## Commands and checks run by Codex

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:run`
- `npm run test:api:server`
- `npx vitest run tests/api/demo-session-start.test.ts`
- `npm run demo:media`
- `git diff --check`

`npm run demo:media` completed with deterministic storyboard fallback artifacts because Playwright browser binaries were unavailable in the validation container.

## Scenario verification

Scenario-specific verification was added to:

```text
GET /api/demo/verify?scenario=compliant
GET /api/demo/verify?scenario=non-compliant
GET /api/demo/verify?scenario=unknown
GET /api/demo/verify?scenario=all
```

Each scenario returns machine-readable PASS/FAIL checks for:

- expected outcome
- expected decision
- expected simulated HTTP status
- deterministic demo data only
- no webhook calls
- no production data mutation
- no secret exposure

The original deny-path timeline verifier remains available when no `scenario` query parameter is provided.

## P0 findings

No P0 demo blockers were found.

## P1 findings

| Finding | Status | Notes |
| --- | --- | --- |
| Scenario-specific verification was under-specified | Fixed | Added explicit verification selectors for compliant, non-compliant, unknown, and all scenarios. |
| `/api/v1/*` default API key/signing fallbacks could confuse shared-stage posture | Fixed | Runtime route now fails closed when required `ADMIN_API_KEY`, `DEVICE_WEBHOOK_SECRET`, or `BACKEND_SIGNING_SECRET` configuration is absent. |
| Toolchain drift made demo automation less reproducible | Improved | Node 22 is pinned via `.nvmrc`; demo validation workflow pins Bun for media script execution. |
| Dependency update PRs include major-version migration risk | Open | PR #92 and PR #93 should not merge as-is. |

## P2 findings / non-blockers

- Polished screenshots/video require a Playwright browser-capable environment.
- Docker build/run validation still needs a Docker-capable environment.
- Real remediation loop maturity remains future/pilot work.
- Major dependency upgrades should be split and migrated deliberately.

## Dependabot PR triage

### PR #92 — production dependency group

Recommendation: **do not merge as-is**.

Reason: `npm ci` passed, but `npm run typecheck` failed after the upgrade. The failures indicate migration work is needed, especially around Zod 4 and stricter dependency typing. Examples include Zod 4 API differences such as `ZodError.errors`, `z.string().ip()`, stricter schema calls, and unknown/object assignment issues.

### PR #93 — development dependency group

Recommendation: **do not merge as-is**.

Reason: `npm ci` passed with peer warnings, but `npm run typecheck` failed on TypeScript 6 `baseUrl` deprecation. ESLint 10 and Vitest 4 should be split into smaller updates after TypeScript/config compatibility is addressed.

## Demo readiness recommendation

Demo-ready: **yes, for controlled buyer walkthroughs**.

Use these guardrails:

- Present `/demo` and `/api/demo/*` outputs as deterministic simulated demo behavior.
- Use scenario-specific verification before demos.
- Keep remediation framed as simulated/talk-track until a real audited loop is implemented.
- Do not claim production readiness until Docker deployment, customer-selected integrations, and operational runbooks are validated in the target environment.
