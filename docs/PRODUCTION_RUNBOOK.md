# SignalGrid Production Runbook

This runbook is the operating baseline for piloting or running SignalGrid as a managed product or customer-hosted service after the target environment, customer scope, and release gates have been validated.

## Release gates

Every release candidate must pass these commands before deployment:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run test:run
npm run test:api:server
```

`npm run test:run` covers deterministic unit, API contract, and security logic tests. `npm run test:api:server` starts a live Next.js server on port `3010` and runs server-dependent API, demo-flow, and security suites.

## Required production configuration

Set these values in the runtime environment before serving customer traffic:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV=production` | Yes | Enables production runtime behavior. |
| `BACKEND_SIGNING_SECRET` | Yes | HMAC signing secret for device/session event ingestion. |
| `ADMIN_API_KEY` | Temporary only | Break-glass admin API key until customer OIDC is enabled. |
| `OIDC_ISSUER_URL` | Yes for SaaS/admin access | Issuer used to validate admin JWTs. |
| `OIDC_CLIENT_ID` | Yes for SaaS/admin access | Expected admin application client ID. |
| `OIDC_AUDIENCE` | Recommended | Explicit JWT audience validation. |
| `REDIS_URL` | Yes for multi-instance SaaS | Shared nonce, session, and rate-limit state. |
| `INTEGRATION_SIGNING_SECRET` | Yes when webhooks are enabled | HMAC signing secret for outbound integration webhooks. |
| `CORS_ORIGIN` | Yes for browser customers | Exact customer/admin origin; do not use `*`. |
| `TRUSTED_PROXIES` | Yes behind a proxy | Comma-separated proxy IPs trusted for forwarded client IPs. |

Keep `ENABLE_DEV_BYPASS=false`, `ENABLE_DESTRUCTIVE_ACTIONS=false`, and `DEMO_MODE=false` for production unless a signed customer change request explicitly says otherwise.

## Container deployment

Build and run the standalone production container. These commands must be validated in a Docker-capable environment before relying on them for a customer deployment:

```bash
docker build -t signalgrid:latest .
docker run --rm -p 3000:3000 --env-file .env.production signalgrid:latest
```

The Dockerfile is intended to run as a non-root `signalgrid` user and serve the Next.js standalone build from `server.js`; confirm this behavior during Docker-capable release validation.

## Health and compatibility endpoints

- `GET /api/health` is the load-balancer health check.
- `GET /api/v1/health` is the public compatibility health check for partners and customer integrations.
- `GET /api/v1/metrics` returns a Prometheus-compatible metrics payload and requires admin API authentication.

## Customer launch sequence

1. Create customer tenant configuration and production secrets.
2. Configure OIDC admin login and disable development bypasses.
3. Configure Redis for shared nonce/session/rate-limit state.
4. Run release gates against the exact image or commit being deployed.
5. Smoke test `/api/health`, `/api/v1/health`, session start, location report, and one denied-risk path.
6. Enable monitoring on health status, 401/403 spikes, rate-limit spikes, integration DLQ depth, and webhook retry count.
7. Keep the first customer rollout in shadow or advisory mode until the customer signs off on enforcement actions.
8. Confirm demo and production modes remain separated, with simulated demo data excluded from customer production workflows.

## Incident rollback

- Roll back to the last image that passed the release gates.
- Rotate `BACKEND_SIGNING_SECRET` and `INTEGRATION_SIGNING_SECRET` if request signing is suspected to be compromised.
- Disable destructive integrations first; keep decision/audit collection online when possible.
- Export audit receipts before making manual state repairs.
