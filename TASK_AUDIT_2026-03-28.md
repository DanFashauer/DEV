# Codebase Task Proposals (2026-03-28)

## 1) Typo Fix Task
**Task:** Normalize the device endpoint placeholder typo in `docs/INTEGRATION_API.md` from `GET /device/:id` to `GET /device/{deviceId}`.

**Why:** The same document uses `{deviceId}` elsewhere, so `:id` is inconsistent and can confuse integrators reading the API guide.

**Acceptance criteria:**
- Endpoint key under the `/status` response example is updated to `GET /device/{deviceId}`.
- Parameter naming is consistent throughout the document.

---

## 2) Bug Fix Task
**Task:** Fix Workspace ONE request authentication header construction in `src/lib/integrations/uem/workspace-one.ts`.

**Why:** Requests currently send `Authorization: Bearer {tenantId}:{accessToken}`. OAuth bearer tokens should be sent as `Bearer {accessToken}` only, with tenant metadata in its own header. This likely causes authentication failures against Workspace ONE APIs.

**Acceptance criteria:**
- `Authorization` header uses only `Bearer ${accessToken}`.
- Existing tenant header (`aw-tenant-identifier`) remains present.
- Add/adjust tests to verify request headers for at least one adapter method.

---

## 3) Code Comment / Documentation Discrepancy Task
**Task:** Resolve the mismatch in `src/lib/utils/rateLimit.ts` where comments claim atomic Redis operations while implementation uses a non-transactional pipeline.

**Why:** The comment says operations are atomic, but `pipeline()` batches commands without transaction guarantees. This can mislead maintainers and security reviewers.

**Acceptance criteria:**
- Either switch implementation to transactional semantics (e.g., `multi`) with clear behavior, **or**
- update comments to accurately describe current consistency guarantees.
- Include a short note in code explaining race-condition implications.

---

## 4) Test Improvement Task
**Task:** Tighten `tests/api/webauthn-admin.test.ts` assertions so they validate precise behavior rather than broad status ranges.

**Why:** Current assertions accept broad sets like `[200, 204, 405]` and `[400, 401, 403]`, which can hide regressions and misconfigurations.

**Acceptance criteria:**
- Assert expected status per endpoint/method for the intended environment.
- Validate response body fields (e.g., `error`, `success`) for negative paths.
- Add one positive-path case using authenticated request fixtures.
