# Test Server Workflow (SignalGrid)

This repo has both in-process tests and tests that call a running app at `http://localhost:3010`.

## API test scripts (explicit behavior)

- `bun run test:api:unit`
  - Runs API suites that do **not** require an external server.
- `bun run test:api:server`
  - **Recommended** for current server-dependent API suites.
  - Automatically starts the test server, waits for readiness, runs suites, and stops the server (even on failure).
- `bun run test:api:server:only`
  - Runs only server-dependent API suites and assumes the test server is already running.
- `bun run test:api:server:local`
  - Alias of `test:api:server`.
- `bun run test:api`
  - Alias of `test:api:unit` (safe default).
- `bun run test:api:all`
  - Runs all API tests regardless of server requirements.

## API suites in `test:api:server:only`

- `tests/api/integrations-itsm.test.ts`
- `tests/api/integrations-webhooks.test.ts`
- `tests/api/location-report.test.ts`
- `tests/api/policies.test.ts`
- `tests/api/webauthn-admin.test.ts`

## Optional manual server workflow

If you want to manage server lifecycle manually:

```bash
bun run test:server:start
bun run test:server:wait
bun run test:api:server:only
bun run test:server:stop
```

## Notes

- Use `test:api:server` for reliability in local dev and CI to avoid setup blockers.
- Use `test:api:server:only` only when you intentionally manage server lifecycle yourself.

- `tests/api/integration-v1.test.ts` is currently a legacy contract suite and is intentionally not part of default server-dependent runs until `/api/v1/*` endpoints are restored.
