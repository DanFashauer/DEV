# SignalGrid Testing Strategy

## Overview

SignalGrid employs a comprehensive multi-layer testing strategy to ensure reliability, security, and performance at scale. This document outlines our testing approach, tools, and best practices.

## Testing Pyramid

```
           ┌─────────────┐
           │   E2E       │  ← Few, slow, expensive
           │   Tests     │
         ┌─┴─────────────┴─┐
         │  Integration    │  ← More, faster
         │    Tests        │
       ┌─┴─────────────────┴─┐
       │   Unit Tests       │  ← Many, fast, cheap
       │   (Vitest)         │
       └────────────────────┘
```

## Test Categories

### 1. Unit Tests (Vitest)

**Purpose**: Test individual functions and utilities in isolation

**Location**: `tests/` (excluding e2e and load)

**Run**: 
```bash
bun run test           # Watch mode
bun run test:run       # Single run
```

**Coverage**:
- Utility functions
- Type validation
- Business logic
- Security helpers (signing, redaction)

### 2. Integration Tests (Vitest + API)

**Purpose**: Test API endpoints and service integrations

**Location**: `tests/api/`

**Run**:
```bash
bun run test:api
```

**Coverage**:
- `/api/session/start` - Badge authentication flow
- `/api/location/report` - Location signal ingestion
- `/api/admin/policies` - Policy CRUD
- `/api/admin/integrations/webhooks` - Webhook management
- `/api/admin/integrations/itsm` - ITSM integration
- `/api/admin/webauthn/*` - WebAuthn authentication

### 3. Demo Flow Tests (Vitest)

**Purpose**: Validate end-to-end demo scenarios

**Location**: `tests/demo/`

**Run**:
```bash
bun run test:demo
```

**Scenarios**:
- Healthcare: Nurse badge → session start → compliance check → quarantine
- Retail: Cashier badge → session start → clean
- Logistics: Warehouse badge → session start → high-risk violations

### 4. E2E Tests (Playwright)

**Purpose**: Test the admin UI end-to-end

**Location**: `tests/e2e/`

**Run**:
```bash
bun run test:e2e
```

**Coverage**:
- `/admin` - Dashboard loads
- `/admin/policies` - Policy management UI
- `/admin/devices` - Device registry UI
- `/admin/receipts` - Policy action receipts
- `/admin/dlq` - Dead letter queue
- `/admin/security` - WebAuthn status

### 5. Security Tests (Vitest)

**Purpose**: Validate security controls

**Location**: `tests/security/`

**Run**:
```bash
bun run test:security
```

**Coverage**:
- Replay attack prevention
- Rate limiting enforcement
- Webhook signature validation
- Secret redaction in logs
- Step-up authentication enforcement

### 6. Load Tests (k6)

**Purpose**: Validate performance under load

**Location**: `tests/load/`

**Run**:
```bash
bun run test:load
```

**Scenarios**:
- Session start: 50-100 concurrent users
- Location reports: 30 concurrent users
- Webhook dispatch: 20 concurrent dispatches

**Metrics**:
- p95 latency < 500ms
- Error rate < 10%

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Type check, lint, build, unit tests |
| `e2e.yml` | PR/Manual | Playwright browser tests |
| `nightly-demo.yml` | Daily (2 AM UTC) | Full demo validation |
| `security.yml` | Daily/PR | Semgrep + dependency scan |
| `load.yml` | Manual | k6 performance tests |

## Local Development

### Quick Validation

```bash
# Install dependencies
bun install

# Run all tests
bun run test

# Run specific test suites
bun run test:demo
bun run test:api
bun run test:security

# Run E2E (requires dev server)
bun run test:e2e
```

### Full Pilot Readiness Check

```bash
# Start dev server
bun run dev

# Seed demo data
bun run demo:seed

# Validate demo flow
bun run demo:validate

# Run E2E tests
bun run test:e2e

# Run security tests
bun run test:security

# Run load tests
bun run test:load

# Generate failure summary
bun run test:summary
```

## Test Reports

Reports are generated in `scripts/reports/`:

| Report | Generation | Contents |
|--------|------------|----------|
| `demo-validate-report.json` | `bun run demo:validate` | Demo flow results |
| `demo-flow-report.json` | `bun run demo:flow` | Scenario results |
| `api-test-report.json` | `bun run test:api` | API test results |
| `security-test-report.json` | `bun run test:security` | Security test results |
| `playwright-report.json` | `bun run test:e2e` | E2E test results |
| `*-load-report.json` | `bun run test:load` | Load test metrics |

## Observability

### Request Tracing

All requests include a correlation ID (`x-request-id`) that is propagated through:
- Session flow
- Policy evaluation
- ITSM ticket creation
- SIEM events
- Webhook deliveries

### Logging

Logs are structured JSON with:
- Timestamp
- Request ID
- Level (debug, info, warn, error)
- Message
- Context (device, user, session)

### Metrics

Key metrics tracked:
- Session start latency (p50, p95, p99)
- Policy evaluation time
- Webhook delivery success rate
- API error rate by endpoint

## Best Practices

### Writing Tests

1. **Test behavior, not implementation** - Focus on inputs/outputs
2. **Use descriptive names** - `should reject invalid badge` not `test1`
3. **One assertion per test** - Easier to diagnose failures
4. **Mock external dependencies** - Don't rely on real integrations
5. **Clean up after tests** - Delete created resources

### Test Data

1. **Use deterministic data** - Same input = same output
2. **Isolate test data** - Don't share state between tests
3. **Use fixtures** - Reusable test data structures
4. **Clean up** - Remove test data after tests

### CI Best Practices

1. **Fast feedback** - Run fast tests first
2. **Parallel execution** - Use CI parallelism
3. **Retry flaky tests** - But investigate root causes
4. **Fail fast** - Stop on first critical failure

## Troubleshooting

### Tests Failing

1. Check test output for specific failures
2. Run `bun run test:summary` for overview
3. Review recommendations in report
4. Check logs for correlation IDs

### E2E Tests Timing Out

1. Increase timeout in `playwright.config.ts`
2. Check server is running
3. Verify baseURL is correct

### Load Tests Showing High Latency

1. Check server resource usage
2. Review database connection pooling
3. Look for N+1 queries
4. Check for blocking operations

## Contact

For questions about testing, reach out to the platform team.
