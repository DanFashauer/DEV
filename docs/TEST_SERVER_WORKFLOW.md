# Test Server Workflow (SignalGrid)

This project has two kinds of tests:

1. **Default/unit-ish tests** that run locally without booting the app server.
2. **Server-dependent suites** that call `http://localhost:3010` and require a running test server.

## Suites that require the test server

The following suites are server/harness dependent (based on current test files and failure messaging):

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

## Start the test server

In one terminal:

```bash
bun run scripts/test-server.ts start
```

Keep it running while executing server-dependent tests.

## Run server-dependent tests intentionally

In a second terminal, enable the server-test flag:

```bash
RUN_SERVER_TESTS=1 npm run test:run
```

You can also scope to specific files while the server is running:

```bash
RUN_SERVER_TESTS=1 npx vitest run tests/api/integration-v1.test.ts
```

## What default `npm run test:run` means

Without the server running (and without `RUN_SERVER_TESTS=1`), failures from the suites above are **expected harness/setup outcomes** (for example: "Server not reachable at http://localhost:3010"), not necessarily product regressions.

## Current quality signal

- `npm run typecheck` passes.
- `npm run lint` passes.
- Targeted product-path tests (non-server-dependent suites) pass.
- Remaining failures in a plain default run without localhost:3010 are expected due to missing server setup.
