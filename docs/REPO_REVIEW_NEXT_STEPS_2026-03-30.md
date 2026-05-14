# Repo Review & Recommended Next Steps (2026-03-30)

## Historical status note

This review is retained as dated backlog evidence. Several findings have since changed; use `docs/READINESS_HYGIENE_STATUS.md` for the current completed/open/conflicting readiness list before acting on any item below.

## Scope of this review
This is a focused, repo-wide hardening review intended to identify what should be fixed next after the recent admin-auth tightening work.

## Executive summary
The repository is in a better state than before the prior hardening pass, but there are still several **control-path fallbacks** and **default-secret/default-key behaviors** that keep non-production behavior too permissive and can bleed into shared/staging usage.

## Priority order (recommended)

1. **P0 — Remove remaining default-key/default-secret auth fallbacks**
2. **P0 — Make unknown-posture session issuance explicit/fail-closed by policy**
3. **P1 — Ensure session-extension semantics are consistent with message wording**
4. **P1 — Isolate demo/test-only behaviors from core runtime paths**
5. **P2 — Consolidate auth mode gating into one explicit policy contract**

## Detailed findings and fixes

### 1) Remaining default API key fallback exists in v1 API auth helper (P0)
**Evidence:** `src/lib/utils/apiKeyAuth.ts` still accepts a hardcoded non-production fallback key (`dev-admin-key-12345`) when `ADMIN_API_KEY` is unset.

**Risk:** Shared non-production environments can accidentally run with a known default key.

**Fix recommendation:**
- Require explicit `ADMIN_API_KEY` in all environments for this helper.
- If not configured, fail with `API_KEY_NOT_CONFIGURED` (current error shape can be preserved).
- Add/extend regression tests covering:
  - missing `ADMIN_API_KEY` -> 500 configured error
  - arbitrary key rejected
  - correct configured key accepted

### 2) Default webhook signing fallback remains in dispatch path (P0)
**Evidence:** `src/lib/integrations/webhooks/dispatch.ts` contains default fallback behavior (`default-dev-secret`) when no signing secret is configured.

**Risk:** Webhook signatures can be generated with a predictable secret in non-production/shared deployments.

**Fix recommendation:**
- Remove implicit default secret.
- Require explicit signing secret where signing is expected.
- If missing, either:
  - fail closed for required-delivery flows, or
  - skip signing with explicit high-visibility audit event (policy decision).

### 3) Default encryption key fallback remains in ITSM credential store (P0)
**Evidence:** `src/lib/integrations/itsm/store.ts` sets a hardcoded fallback encryption key (`default-dev-key-must-be-32-bytes!!`) if env keys are absent.

**Risk:** Sensitive integration credentials may be encrypted with a predictable key if misconfigured.

**Fix recommendation:**
- Remove hardcoded encryption key fallback.
- Require explicit `ITSM_ENCRYPTION_KEY`/`ENCRYPTION_KEY` before writes.
- Fail closed on credential write/update when key is absent.

### 4) Unknown posture can still mint sessions (P0)
**Evidence:** Session-start flow grants a session when device is compliant **or when there is no posture data**, because denial only triggers when posture indicates enrollment and non-compliance.

**Risk:** Policy gap allows session issuance under unknown posture, which may conflict with intended zero-trust posture semantics.

**Fix recommendation:**
- Add explicit policy gate for unknown posture outcome:
  - deny by default, or
  - configurable allowlist for controlled demo/local scenarios.
- Emit explicit decision reason so audits distinguish unknown-posture allows from true compliance allows.

### 5) Session extension wording vs behavior should be unified (P1)
**Evidence:** Existing active session branch returns message `"Existing session extended"` while returning existing session directive; extension semantics depend on downstream TTL updates and may not always represent a true extension event.

**Risk:** Operators/readers can misinterpret whether expiration was actually updated.

**Fix recommendation:**
- Align response wording with actual behavior, or
- always perform/record explicit extension action before returning this message.
- Add regression test asserting expiresAt movement when response claims extension.

### 6) Demo/test behavior still mixed into core paths (P1)
**Evidence:** Posture service includes explicit demo/testing lookup comments and pathing; multiple UI/test locations still rely on development placeholders.

**Risk:** Runtime behavior can diverge between demo and production assumptions, increasing accidental policy drift.

**Fix recommendation:**
- Move demo/testing branches behind a dedicated feature flag + isolated module boundary.
- Keep runtime defaults production-safe; let demo scripts seed explicit config instead.

### 7) Auth mode fallback policy is still distributed (P2)
**Evidence:** Auth behavior is split across `src/lib/auth.ts`, `src/lib/adminAuth.ts`, and `src/lib/utils/apiKeyAuth.ts` with different fallback semantics.

**Risk:** Future changes can reintroduce permissive behavior due to drift across helpers.

**Fix recommendation:**
- Define one auth-policy contract for:
  - JWT mode,
  - API-key mode,
  - dev bypass eligibility,
  - explicit fail-closed conditions.
- Keep all entrypoints delegating to that shared contract.

## Suggested immediate implementation sequence

1. Remove default API key fallback in `src/lib/utils/apiKeyAuth.ts`.
2. Remove default webhook signing secret in webhook dispatch.
3. Remove default encryption key fallback for ITSM credential storage.
4. Add explicit unknown-posture policy gate in session start.
5. Add tests for each fail-closed branch above.

## Validation checklist for the next hardening PR
- Typecheck
- Lint
- Targeted security tests for auth/secret/posture gates
- Build (if environment supports)
- Verify no public response shape regressions unless intentionally documented
