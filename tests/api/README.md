# Comprehensive API Testing System

## Overview

This document describes the comprehensive testing system for the SignalGrid API, including 6 test suites with 195+ test cases covering functionality, security, performance, and compatibility.

## Test Suite Architecture

### 1. **OpenAPI Validation Tests** (`openapi-validation.test.ts`)
Tests the OpenAPI 3.0.3 specification for correctness and completeness.

**Coverage:**
- Spec structure validation (version, info, servers, paths)
- Path definitions (required endpoints present)
- Response definitions (all operations have responses)
- Parameters validation (query/path params defined)
- Security definitions (auth schemes, applied correctly)
- Schema definitions (required fields, types)
- Response headers (Retry-After, rate limit headers)
- Documentation completeness

**Key Test Suites (7 total):**
1. Spec Structure (6 tests)
2. Path Definitions (4 tests)
3. Security Definitions (2 tests)
4. Schema Definitions (2 tests)
5. Response Definitions (2 tests)
6. Documentation Completeness (2 tests)
7. Input Validation & Security (6 tests)

**Purpose:** Ensures the OpenAPI specification is correct and can be used for code generation and third-party integration.

---

### 2. **Integration Tests** (`integration-v1.test.ts`)
Comprehensive tests for all public API endpoints with real-world scenarios.

**Coverage:**
- Health endpoint (status, caching, performant)
- Device listing (auth, pagination, filtering, caching)
- Event listing (pagination, filtering, limits)
- Session creation (signature validation, timestamp window)
- Location reporting (acceptance, coordinate validation)
- Metrics endpoint (Prometheus format, percentiles, no-cache)
- Error handling (standard format, request IDs)
- Rate limiting (429 enforcement)
- Performance (SLO targets met)
- Concurrency (10/50 concurrent requests)

**Test Suites (11 total):**
1. Health Checks (3 tests)
2. Devices (5 tests)
3. Events (4 tests)
4. Sessions (3 tests)
5. Location (2 tests)
6. Metrics (3 tests)
7. Error Handling (2 tests)
8. Rate Limiting (1 test)
9. Performance (3 tests)
10. Concurrency (2 tests)
11. Async Operations (1 test)

**Purpose:** Validates that all public API endpoints work correctly in realistic scenarios.

---

### 3. **Performance Benchmarks** (`performance-benchmarks.test.ts`)
Measures API performance against Service Level Objectives (SLOs).

**Coverage:**
- Health endpoint performance (p50/p95/p99)
- List endpoints performance
- Metrics endpoint performance
- Write operation performance (POST endpoints)
- Cache performance validation
- Concurrent request throughput
- Burst traffic handling
- Memory usage (no memory leaks)

**Key Tests:**
- **SLO Compliance:**
  - Health: p50 < 30ms, p95 < 100ms, p99 < 200ms
  - Lists: p50 < 100ms, p95 < 200ms, p99 < 500ms
  - Metrics: p50 < 200ms, p95 < 500ms, p99 < 1000ms
  - Writes: p50 < 50ms, p95 < 100ms, p99 < 300ms

- **Load Testing:**
  - 10 concurrent requests (should maintain latency)
  - 50 concurrent requests (allow <5% failure)
  - Pagination scalability (no significant slowdown)

**Purpose:** Ensures API meets performance requirements under load.

---

### 4. **Security Tests** (`security.test.ts`)
Validates API security posture across multiple dimensions.

**Coverage (11 test suites, 40+ tests):**

1. **Authentication & Authorization** (5 tests)
   - Token validation and expiration
   - API key restriction
   - Invalid token rejection

2. **Input Validation & Injection Prevention** (6 tests)
   - SQL injection prevention
   - Command injection prevention
   - XSS prevention
   - Request size limits
   - Content-type validation
   - Parameter type validation

3. **Rate Limiting & DoS Protection** (5 tests)
   - Rate limit enforcement
   - 429 status code
   - Retry-After headers
   - Per-API-key limits
   - Queue management

4. **CORS & Cross-origin Security** (3 tests)
   - Origin validation
   - CORS preflight
   - Allowed methods restriction

5. **HTTPS & Transport Security** (4 tests)
   - HTTPS requirement
   - HSTS headers
   - TLS version enforcement

6. **Sensitive Data Protection** (4 tests)
   - No sensitive data in errors
   - Log masking
   - PII masking
   - Data encryption at rest

7. **API Key & Token Security** (4 tests)
   - Key rotation support
   - Permission scoping
   - Key revocation
   - No key sharing

8. **Webhook Security** (4 tests)
   - Signature validation (HMAC-SHA256)
   - Timestamp validation
   - Replay prevention
   - Safe retry logic

9. **Authentication Flow Security** (3 tests)
   - JWT claims validation
   - Token substitution prevention
   - PKCE for OAuth

10. **Error Handling Security** (3 tests)
    - No stack trace exposure
    - Generic user messages
    - Detailed internal logging

**Purpose:** Ensures API is secure against common attacks and vulnerabilities.

---

### 5. **Contract Tests** (`contract.test.ts`)
Validates API response contracts for consistency and backward compatibility.

**Coverage (10 test suites, 35+ tests):**

1. **Endpoint Contracts** (5 tests)
   - Health response structure
   - Devices list structure
   - Error response format
   - Pagination contract
   - Required fields

2. **Response Headers** (5 tests)
   - Content-Type header
   - Cache-Control header
   - Request-ID header
   - Rate-limit headers
   - CORS headers

3. **Data Types** (5 tests)
   - Correct number types (int, float)
   - String formatting
   - Array handling
   - Object structure
   - Null value usage

4. **Pagination** (4 tests)
   - Limit boundaries (max 100)
   - Offset validation
   - hasMore calculation
   - Pagination accuracy

5. **Timestamps** (3 tests)
   - ISO8601 format
   - UTC timezone
   - Millisecond precision

6. **Backward Compatibility** (3 tests)
   - API versioning support
   - Structure preservation
   - Controlled deprecation

7. **Response Size** (2 tests)
   - Reasonable response sizes
   - Large dataset pagination

8. **API Evolution** (3 tests)
   - Deprecation notices
   - Feature flags
   - Version coexistence

**Purpose:** Ensures API maintains consistent contracts and supports clients across versions.

---

### 6. **Edge Cases & Integration** (`integration-edge-cases.test.ts`)
Tests real-world scenarios, edge cases, and complex integrations.

**Coverage (9 test suites, 35+ tests):**

1. **Data Consistency** (3 tests)
   - Cross-endpoint consistency
   - Event-device linkage
   - Location history integrity

2. **Filtering & Search** (4 tests)
   - Status filtering
   - Date range filtering
   - Multi-field filtering
   - Name/ID search

3. **Pagination Edge Cases** (4 tests)
   - Empty result sets
   - Single page results
   - Boundary offset values
   - Offset > total

4. **Rate Limiting Integration** (3 tests)
   - Multi-key tracking
   - Scheduled resets
   - Burst handling

5. **Error Recovery** (3 tests)
   - Transient failure retry
   - Response integrity validation
   - Error logging

6. **Concurrency & Race Conditions** (3 tests)
   - Concurrent updates
   - Duplicate prevention
   - Write consistency

7. **Data Validation & Sanitization** (4 tests)
   - Device ID format validation
   - Input sanitization
   - Coordinate range validation
   - Payload size limits

8. **Webhook Integration** (3 tests)
   - Event order preservation
   - Retry logic
   - Unsubscribe handling

9. **Performance Under Load** (3 tests)
   - Bulk requests
   - Large dataset pagination
   - Cache effectiveness

**Purpose:** Validates API behavior in complex, real-world scenarios.

---

### 7. **Test Suite Quality Assurance** (`test-suite-qa.test.ts`)
Meta-tests that validate the testing system itself.

**Coverage:**
- Test coverage completeness
- Test organization and naming
- Assertion quality
- Documentation
- CI/CD integration readiness

**Purpose:** Ensures the test suite is comprehensive, maintainable, and production-ready.

---

## Running the Tests

### Run all API tests:
```bash
npm run test:api
```

### Run specific test suite:
```bash
npm run test:api -- openapi-validation.test.ts
npm run test:api -- performance-benchmarks.test.ts
npm run test:api -- security.test.ts
npm run test:api -- contract.test.ts
npm run test:api -- integration-v1.test.ts
npm run test:api -- integration-edge-cases.test.ts
npm run test:api -- test-suite-qa.test.ts
```

### Run with coverage:
```bash
npm run test:api -- --coverage
```

### Run in watch mode:
```bash
npm run test:api -- --watch
```

---

## Test Execution Sequence

1. **OpenAPI Validation** - Validates spec before running integration tests
2. **Contract Tests** - Establishes expected response formats
3. **Integration Tests** - Tests actual endpoint functionality
4. **Security Tests** - Validates security requirements
5. **Performance Benchmarks** - Measures performance against SLOs
6. **Edge Cases** - Tests complex scenarios
7. **Quality Assurance** - Validates test suite itself

---

## Test Statistics

| Metric | Count |
|--------|-------|
| Test Files | 6 |
| Test Suites | 56+ |
| Test Cases | 195+ |
| Code Coverage | Target: 85%+ |
| Execution Time | ~30-60 seconds |

---

## Key Testing Principles

### 1. **Independence**
Each test should be independent and not rely on the execution of other tests.

### 2. **Clarity**
Test names clearly describe what is being tested and expected outcome.
- Good: `should return 401 when authentication token is missing`
- Bad: `test auth`

### 3. **Specificity**
Assertions should be specific and test one thing.
- Good: `expect(response.status).toBe(401)`
- Bad: `expect(response).toBeDefined()`

### 4. **Repeatability**
Tests should produce the same result on every run (deterministic).

### 5. **Speed**
Tests should run quickly to enable frequent execution.
- Unit tests: < 100ms
- Integration tests: < 5 seconds
- Performance tests: < 30 seconds

### 6. **Coverage**
Tests should cover:
- Happy path (normal operation)
- Error cases (expected failures)
- Edge cases (boundary conditions)
- Security concerns (auth, injection, etc.)

---

## Extending the Test Suite

### Adding a New Test:

```typescript
describe('New Feature Tests', () => {
  it('should do something specific', () => {
    // Arrange (setup)
    const input = 'test';
    
    // Act (execute)
    const result = processInput(input);
    
    // Assert (verify)
    expect(result).toBe('expected');
  });
});
```

### Performance Test Template:

```typescript
it('should complete within SLO', async () => {
  const iterations = 100;
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    // Execute operation
    const endTime = performance.now();
    results.push(endTime - startTime);
  }
  
  const p95 = getPercentile(results, 95);
  expect(p95).toBeLessThan(SLO_TARGET);
});
```

---

## CI/CD Integration

These tests should be run:

1. **On every pull request** - Block merge if tests fail
2. **On push to main** - Ensure main branch is always healthy
3. **On scheduled basis** - Nightly comprehensive testing
4. **Before deployment** - Final validation before release

---

## Performance Targets (SLOs)

| Endpoint | p50 | p95 | p99 | Error Rate |
|----------|-----|-----|-----|------------|
| Health | 30ms | 100ms | 200ms | 0% |
| Lists | 100ms | 200ms | 500ms | <0.1% |
| Metrics | 200ms | 500ms | 1000ms | <0.1% |
| Writes | 50ms | 100ms | 300ms | <0.1% |

---

## Security Testing Checklist

- [x] Authentication enforcement
- [x] Authorization validation
- [x] Input sanitization
- [x] SQL injection prevention
- [x] XSS prevention
- [x] CSRF protection (via SameSite cookies)
- [x] Rate limiting
- [x] DDoS protection
- [x] HTTPS enforcement
- [x] Sensitive data masking
- [x] Secure headers
- [x] API key management

---

## Maintenance & Updates

### When to Update Tests:

1. **API Changes** - Update contract tests
2. **Performance Regressions** - Adjust SLO targets
3. **New Endpoints** - Add integration tests
4. **Security Issues** - Add regression tests
5. **Test Failures** - Investigate and fix root cause

### Breaking Changes:

When making breaking changes to the API:
1. Update OpenAPI spec
2. Create new API version (v2)
3. Maintain v1 tests for backward compatibility
4. Update contract tests
5. Add migration guide

---

## Troubleshooting

### Tests Failing Intermittently (Flaky Tests)
- Add explicit wait times for async operations
- Use proper mocking/stubbing
- Check for race conditions
- Verify test isolation

### Performance Tests Failing
- Check system load (other processes)
- Verify database/cache performance
- Check for memory leaks
- Profile slow code sections

### Security Tests Failing
- Review authentication implementation
- Check input validation logic
- Verify rate limiting headers
- Audit error responses

---

## Next Steps

1. **Run full test suite** - `npm run test:api`
2. **Generate coverage report** - `npm run test:api -- --coverage`
3. **Set up CI/CD** - Configure GitHub Actions/similar
4. **Monitor SLOs** - Set up Prometheus metrics
5. **API documentation** - Share OpenAPI spec with partners
6. **SDK generation** - Generate client SDKs from OpenAPI spec

---

## Contact & Support

For questions about the test suite, refer to:
- OpenAPI spec: `openapi.json`
- Test files: `/tests/api/`
- API routes: `/src/app/api/v1/`
- Documentation: `/docs`
