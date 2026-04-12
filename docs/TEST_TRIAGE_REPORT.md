# Test Triage Report (Post Session-Start Hardening)

Date: 2026-04-11  
Repository: `signalgrid`

## Scope
This pass is triage-only. No broad product logic changes were made.

## Validation Run
- Command: `npm run test:run`
- Result summary:
  - Test files: **19 failed**, 8 passed (27 total)
  - Tests: **10 failed**, 205 passed, 80 skipped (295 total)
  - Main failures split between assertion mismatches in static/unit-style test files and integration suites that require a running local server.

## Failure Categories

### 1) API contract / pagination expectation issues
**Affected files**
- `tests/api/contract.test.ts`
- `tests/api/integration-edge-cases.test.ts`

**Observed failures**
- `should calculate hasMore correctly`
- `should handle boundary offset values`

**Likely root cause**
- The test vectors are internally inconsistent with the formula used (`offset + limit < total`).
- Case `offset=90, limit=10, total=100` currently expects `hasMore=true` although the expression evaluates to `false`.

**Classification**
- **Outdated/brittle test** (not a demonstrated runtime product bug).

---

### 2) OpenAPI validation issues
**Affected files**
- `tests/api/openapi-validation.test.ts`
- `openapi.json`

**Observed failures**
- Missing expected `required` properties in one or more schemas.
- Invalid timestamp test expects `new Date('invalid-date')` to throw (it returns `Invalid Date` instead).
- Invalid coordinates test asserts invalid values must be valid (inverted expectation).
- `openApiSpec is not defined` in `API Security Compliance` describe block (scope issue).

**Likely root cause**
- Mixture of:
  1) test logic bugs (incorrect assumptions about JS Date behavior and intentionally invalid coordinates),
  2) test scoping bug for `openApiSpec` (declared in a different describe scope),
  3) possible drift between OpenAPI schema requirements expected by tests vs current `openapi.json` content.

**Classification**
- **Mostly outdated/brittle test**, with a possible **API spec contract drift** item to validate.

---

### 3) Security expectation mismatches
**Affected files**
- `tests/api/security.test.ts`

**Observed failures**
- Expired JWT string assertion checks encoded token contains plaintext `exp`.
- XSS payload assertion requires every payload contain `<`, but one payload is `javascript:...`.
- Parameter type assertion treats `'-1'` as invalid via `isNaN(parseInt(...))` even though parseInt returns a number.

**Likely root cause**
- Tests validate string literals/heuristics instead of actual security behavior and include mismatched assumptions.

**Classification**
- **Outdated/brittle test** (security intent is valid; current checks are not representative).

---

### 4) Server-orchestration / integration harness assumptions
**Affected files**
- `tests/api/integration-v1.test.ts`
- `tests/api/integrations-itsm.test.ts`
- `tests/api/integrations-webhooks.test.ts`
- `tests/api/location-report.test.ts`
- `tests/api/policies.test.ts`
- `tests/api/session-start.test.ts`
- `tests/api/webauthn-admin.test.ts`
- `tests/demo/healthcare-flow.test.ts`
- `tests/demo/logistics-flow.test.ts`
- `tests/demo/retail-flow.test.ts`
- `tests/security/rate-limit.test.ts`
- `tests/security/replay-attack.test.ts`
- `tests/security/secret-redaction.test.ts`
- `tests/security/stepup-enforcement.test.ts`
- `tests/security/webhook-signing.test.ts`

**Observed failures**
- Server bootstrap/connectivity errors, e.g.:
  - `Server did not start within timeout`
  - `Server not reachable at http://localhost:3010. Start with: bun run scripts/test-server.ts start`

**Likely root cause**
- `vitest run` is being executed without the required local test server lifecycle.
- Suite expectations are split between ports (`3000` and `3010`) and rely on external startup sequencing.

**Classification**
- **Test harness/environment problem**.

---

### 5) Other
None beyond the categories above in this run.

## Practical Interpretation
- The highest-volume red signal is harness orchestration, not core business-logic regressions.
- The direct failing assertions that *do* execute are dominated by brittle/inverted tests.
- There is at least one area requiring product/spec verification: OpenAPI schema required fields vs test expectations.

## Top 3 Recommended Next Fix Tasks
1. **Stabilize test execution modes and CI entrypoints**
   - Separate pure unit/static suites from server-required integration suites.
   - Enforce server lifecycle wrappers for integration jobs (start/wait/stop) and normalize test base URL/port config.

2. **Repair brittle assertions in contract/security/openapi tests (small bounded patch set)**
   - Fix inverted pagination/coordinate expectations.
   - Replace non-representative JWT/XSS/type assertions with behavior-oriented checks.
   - Resolve `openApiSpec` scope leakage in OpenAPI security block.

3. **Run OpenAPI contract alignment pass**
   - Compare `openapi.json` required fields against current endpoint/schema reality.
   - Decide and document whether to update spec, tests, or both for the MVP surface.

## Files Changed
- `docs/TEST_TRIAGE_REPORT.md`
