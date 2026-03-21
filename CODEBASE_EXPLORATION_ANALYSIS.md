# Codebase Exploration & Analysis Report

**Project:** SignalGrid  
**Framework:** Next.js 16.1.6  
**Runtime:** Node.js (with Next.js hybrid edge/node support)  
**Generated:** March 20, 2026

---

## 1. Testing Framework Setup 🧪

### 1.1 Vitest Configuration
**File:** [vitest.config.ts](vitest.config.ts)

```typescript
- Environment: Node.js
- Test files: tests/**/*.test.ts, scripts/**/*.test.ts
- Excluded: tests/e2e/**, tests/load/**
- Coverage: v8 reporter (text, json, html)
- Test timeout: 30 seconds
- Hook timeout: 30 seconds
- Path alias: @/* → ./src/*
```

**Test Scripts:**
```bash
bun run test                    # Run all tests in watch mode
bun run test:run               # Run all tests once
bun run test:demo              # Run demo tests only
bun run test:api               # Run API tests only
bun run test:security          # Run security tests only
bun run test:semgrep           # Static analysis (semgrep)
bun run test:load              # Load tests (k6)
```

### 1.2 Playwright Configuration
**File:** [playwright.config.ts](playwright.config.ts)

**E2E Test Setup:**
- Test directory: `tests/e2e/`
- Parallel execution: Enabled
- Retries: 2 (in CI), 0 (local)
- Reporters: HTML + JSON
- Browsers tested: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- Base URL: `http://localhost:3000` or `$SERVER_URL` env var
- Screenshots: On failure only
- Videos: Retained on failure
- Traces: On first retry

**Auto-start server:**
```typescript
webServer: {
  command: 'bun run dev'
  url: 'http://localhost:3000'
  timeout: 120s
}
```

### 1.3 Test Suites

**API Tests** (`tests/api/`)
```
├── session-start.test.ts           # POST /api/session/start validation
├── policies.test.ts                # Policy CRUD operations
├── location-report.test.ts         # Location signals
├── integrations-webhooks.test.ts   # Webhook dispatch
├── integrations-itsm.test.ts       # ITSM integration (ServiceNow, Jira)
└── webauthn-admin.test.ts          # WebAuthn registration/verification
```

**Demo Tests** (`tests/demo/`)
```
├── healthcare-flow.test.ts         # Healthcare use case validation
├── logistics-flow.test.ts          # Logistics flow
└── retail-flow.test.ts             # Retail flow
```

**Security Tests** (`tests/security/`)
```
├── rate-limit.test.ts              # Rate limiting enforcement
├── replay-attack.test.ts           # HMAC-SHA256 replay attack prevention
├── webhook-signing.test.ts         # Webhook signature verification
├── secret-redaction.test.ts        # Secret masking in logs
└── stepup-enforcement.test.ts      # Step-up authentication
```

**Load Tests** (`tests/load/`)
- `session-start.js` — p95 < 500ms, error rate < 10%
- `location-report.js` — p95 < 300ms, error rate < 10%
- `webhooks.js` — Webhook dispatch performance

---

## 2. API Routes Structure 🛣️

### 2.1 Core API Endpoints

**Health Check**
- Route: [src/app/api/health/route.ts](src/app/api/health/route.ts)
- Method: GET
- Auth: None
- Response: `{ ok: true, service: "signalgrid", timestamp: ISO8601 }`

**Session Management**
```
POST   /api/session/start              → src/app/api/session/start/route.ts
GET    /api/session/[sessionId]        → src/app/api/session/[sessionId]/route.ts
```

**Events & Timeline**
- Route: [src/app/api/events/route.ts](src/app/api/events/route.ts)
- Method: GET
- Auth: Admin (requireAdminAuth)
- Query params: `correlationId`, `limit` (default 20, max 100), `offset` (default 0)
- Response: Paginated timeline of security events with ordering

**Location Reporting**
```
POST   /api/location/report            → src/app/api/location/report/route.ts
```

### 2.2 Admin API Routes

**Authentication**
```
requireAdminAuth()  → src/lib/adminAuth.ts
 - JWT/OIDC (primary)
 - API key fallback (development)
 - Timing-safe comparison
 - Rate limiting: 30 req/min per IP
 - Step-up authentication for sensitive ops
```

**Device Management**
- Route: [src/app/api/admin/devices/route.ts](src/app/api/admin/devices/route.ts)
- Methods: GET (list devices), POST (register)
- Auth: Required + step-up for quarantine operations
- Response: Device registry with status, OS version, app version

**Statistics Dashboard**
- Route: [src/app/api/admin/stats/route.ts](src/app/api/admin/stats/route.ts)
- Method: GET
- Auth: Required
- Data: Total sessions, device metrics, policy metrics, provider status

**Policy Management**
- Route: [src/app/api/admin/policies/route.ts](src/app/api/admin/policies/route.ts)
- Methods: GET (list), POST (create)
- Auth: Required
- Validation: PolicySchema (Zod)
- Individual policy: `GET /api/admin/policies/[id]`

**Integrations**
```
/api/admin/integrations/
├── nac/                           # Network Access Control
│   ├── route.ts                   # Cisco ISE, Aruba ClearPass config
│   ├── quarantine/route.ts        # Device quarantine
│   └── network-location/route.ts  # Geographic policy
├── uem/                           # Unified Endpoint Management
│   ├── route.ts                   # Intune, Jamf, Workspace ONE config
│   └── enrollment/route.ts        # Device enrollment
├── webhooks/                      # Webhook management
│   ├── [id]/route.ts              # Get/update specific webhook
│   └── (CRUD operations)
└── telemetry/fleetdm/            # osquery integration
    └── route.ts
```

**Security Events**
- Route: [src/app/api/admin/security-events/route.ts](src/app/api/admin/security-events/route.ts)
- Audit ledger with SHA-256 chain validation
- Append-only design

**WebAuthn (Passwordless Auth)**
- Register: `POST /api/admin/webauthn/register/challenge`
- Verify: `POST /api/admin/webauthn/register/verify`
- Challenge creation & verification flow

**Badges**
- Route: [src/app/api/admin/badges/route.ts](src/app/api/admin/badges/route.ts)
- Methods: GET (list), POST (create)
- Enrollment: `POST /api/admin/badges/enroll/route.ts`

---

## 3. API Response Structure & Error Handling 📋

### 3.1 Standard Response Format

**Success Response**
```typescript
// Standard JSON response
{
  ok: true,
  data: { /* ... */ },
  requestId: "hex-string-16-bytes"
}

// Or specific routes like session start
{
  success: true,
  session: SessionDirective,
  riskScore: number,
  riskLevel: "low" | "medium" | "high",
  identityId: string
}
```

**Error Response**
```typescript
{
  error: string,                  // Human-readable message
  code?: string,                  // Error code for programmatic handling
  message?: string,               // Additional details
  requestId?: string              // Trace ID (from x-request-id header)
}

// Status codes used:
- 200: Success
- 400: Bad request (validation error)
- 401: Unauthorized / Authentication failed
- 404: Resource not found
- 429: Rate limited
- 500: Internal server error
```

### 3.2 Error Handling Pattern

**Files:**
- [src/lib/adminAuth.ts](src/lib/adminAuth.ts) — `adminError()`, `adminSuccess()` helpers
- [src/lib/observability.ts](src/lib/observability.ts) — `createErrorResponse()`, `createResponse()`

**Key Implementation:**
```typescript
// Function: adminError(message: string, status: number = 401): NextResponse
export function adminError(message: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { error: message },
    { 
      status,
      headers: getSecurityHeaders(),  // CSP, HSTS, X-Frame-Options, etc.
    }
  );
}

// Function: createErrorResponse(request, context, message, status): NextResponse
// Includes request ID for tracing
```

**Error Handling Issues Identified:**
```
🟡 INCONSISTENT: Some routes wrap in try-catch, others don't
- Wrapped: src/app/api/admin/badges/route.ts
- Not wrapped: src/app/api/location/report/route.ts
```

### 3.3 Observability/Request Tracking

**File:** [src/lib/observability.ts](src/lib/observability.ts)

```typescript
export interface LogEntry {
  timestamp: string;              // ISO8601
  requestId: string;              // 16-byte hex
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;                  // Event name
  method?: string;                // HTTP method
  route?: string;                 // Request path
  statusCode?: number;            // Response status
  latencyMs?: number;             // Request latency
  deviceId?: string;              // Extracted from request
  userId?: string;                // Extracted from auth
  error?: string;                 // Error message
  context?: Record<string, unknown>; // Additional data (NO SECRETS)
}
```

**Features:**
- Request ID generation in request headers
- Structured logging with consistent format
- Latency tracking per request
- Sensitive data never logged

---

## 4. OpenAPI/Swagger Documentation 📚

**Current Status:** ❌ NOT IMPLEMENTED

**Findings:**
- No OpenAPI schema defined
- No Swagger UI endpoint
- API documentation exists only in code comments and test files
- No auto-generated API docs

**Recommendation:**
```typescript
// Could use next-swagger or @nestjs/swagger approach for auto-docs
// Example structure needed:
POST /api/session/start
  Request: { badgeUid: string, deviceId: string, timestamp: number, signature: string }
  Response: { success: boolean, session: SessionDirective, riskScore: number }
  Auth: HMAC-SHA256 signature verification required
  Rate limit: 30/min per device + IP

POST /api/admin/policies
  Request: { name: string, rules: PolicyRule[], enabled: boolean }
  Response: { policy: Policy }
  Auth: Admin JWT/OIDC or API key
  Rate limit: 30/min per IP
```

---

## 5. Performance Metrics & Bottlenecks 🚀

### 5.1 Load Test Configuration

**Session Start Load Test** (`tests/load/session-start.js`)
```
Scenario 1 - Steady State:
  - Ramp: 0 → 50 VUs over 10s
  - Hold: 50 VUs for 30s
  - Ramp down: 50 → 0 VUs over 10s
  
Scenario 2 - Spike Test:
  - Quick spike: 0 → 100 VUs over 5s
  - Hold: 100 VUs for 10s
  - Drop: 100 → 0 VUs over 5s

Performance Thresholds:
  - p95 latency: < 500ms
  - Error rate: < 10%
```

**Location Report Load Test** (`tests/load/location-report.js`)
```
Steady State:
  - Ramp: 0 → 30 VUs over 10s
  - Hold: 30 VUs for 30s

Performance Threshold:
  - p95 latency: < 300ms
```

**Webhook Dispatch Load Test** (`tests/load/webhooks.js`)
```
Metrics:
  - Delivery success rate
  - Retry behavior
  - Concurrent webhook batching
```

### 5.2 Known Performance Bottlenecks

| Issue | Severity | File | Impact | Notes |
|-------|----------|------|--------|-------|
| In-memory session store | 🟠 HIGH | `src/lib/sessionStore.ts` | Multi-instance deployments - sessions lost | Needs Redis-backed persistence |
| Badge registry fallback | 🟠 HIGH | `src/lib/badgeRegistry.ts` | Cross-instance ID lookup fails | Redis required for scale |
| Rate limiting in-memory | 🟠 HIGH | `src/lib/utils/rateLimit.ts` | Bypass via instance rotation | Redis-backed now available |
| No pagination on events | 🟠 HIGH | `src/app/api/events/route.ts` | Memory exhaustion on large datasets | Added pagination (limit max 100) |
| JWKS cache TTL | 🟡 MEDIUM | `src/lib/auth.ts` | Auth fails if provider rotates keys | Reduced from 60min → 15min |
| Unbounded location storage | 🟡 MEDIUM | `src/lib/location/store.ts` | Redis memory exhaustion | Need TTL + aggregation policy |
| Missing database indexes | 🟡 MEDIUM | `src/lib/**` | Slow queries in production | Document Redis key patterns |
| No timeout on external API calls | 🔴 CRITICAL | 8+ integration files | Connection pool exhaustion | **REMEDIATED**: fetchWithTimeout added |

### 5.3 Caching Strategy

**Currently Implemented:**
- Redis with in-memory fallback (dev)
- No page caching (force-dynamic on admin routes)
- Cache-Control headers: `no-store, max-age=0, must-revalidate`

**Data Stores:**
```typescript
// Rate limiting
- Redis (production) OR in-memory Map (dev)
- Window-based with sliding TTL

// Badge registry
- Redis (production) OR in-memory Map (dev)
- Key: badge:uid:{badgeUid}

// Sessions
- Redis (production) OR in-memory Map (dev)
- Key: session:{sessionId}

// Security events
- Append-only event log
- Pagination-friendly

// Location data
- ⚠️ NO TTL - can balloon unbounded
```

---

## 6. Database & Storage Patterns 🗄️

### 6.1 Data Layer Architecture

**No traditional SQL database.** Project uses:

1. **Redis** (primary for production)
   - Session store
   - Rate limiting buckets
   - Badge → userId mapping
   - Location signals
   - Integration configs

2. **In-Memory Storage** (fallback/dev)
   - Maps for all above
   - Single-instance only

3. **Append-Only Audit Log**
   - Security events with SHA-256 chaining
   - File system or stream-based

### 6.2 Data Persistence Strategy

**Session Store** (`src/lib/sessionStore.ts`)
```typescript
interface Session {
  sessionId: string;
  userId: string;
  deviceId: string;
  badgeUid: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'locked' | 'terminated';
  nextAction: 'LAUNCH_APP' | 'UNLOCK_DEVICE' | 'WAIT' | 'ERROR';
}

// Redis key: session:{sessionId}
// TTL: Based on session expiry
```

**Badge Registry** (`src/lib/badgeRegistry.ts`)
```typescript
interface BadgeMapping {
  badgeUid: string;
  userId: string;
  enrolledAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

// Redis key: badge:uid:{badgeUid}
// TTL: None (persistent mapping)
```

**Rate Limiting** (`src/lib/utils/rateLimit.ts`)
```typescript
export interface RateLimitOptions {
  max: number;        // Max requests per window
  window: number;     // Window in ms
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;      // Timestamp when window resets
  total: number;      // Total requests in window
}

// Key: rate-limit:{identifier}
// TTL: Window duration (auto-expire)
```

**Location Data** (`src/lib/location/store.ts`)
```typescript
// ⚠️ Current: No explicit TTL
// Recommended: 24-hour TTL + hourly aggregation

interface LocationSignal {
  deviceId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  confidence: number;
}

// Key: location:{deviceId}:{timestamp}
// TTL: MISSING - implement 24h
```

### 6.3 No ORM or Query Language

**Implications:**
- Direct Redis write/read patterns
- Manual key management
- No migration system
- No query builder safety

**Key Naming Convention:**
```
rate-limit:{identifier}
badge:uid:{badgeUid}
session:{sessionId}
location:{deviceId}:{timestamp}
identity:device:{deviceId}
events:timeline
webhook:delivery:{id}
```

---

## 7. Authentication & Authorization 🔐

### 7.1 Admin Authentication

**File:** [src/lib/adminAuth.ts](src/lib/adminAuth.ts)

**Strategy:**
1. **JWT/OIDC** (primary)
   - Authorization header: `Bearer <jwt>`
   - Validates against OIDC provider
   - JWKS fetched with 15-min cache TTL

2. **API Key** (fallback/dev)
   - Header: `Authorization: Bearer <api-key>`
   - Must be 32+ chars
   - Timing-safe comparison (constant-time)
   - Must be explicitly set: `export ADMIN_API_KEY="your-key"`

**Security Features:**
- Rate limiting: 30 req/min per IP
- Timing-safe comparison to prevent timing attacks
- IP validation (x-forwarded-for handled carefully)
- Request ID generation for audit trail

**Step-Up Authentication** (`src/lib/auth/stepUpStore.ts`)
```typescript
// For sensitive operations (quarantine, allowlist changes)
interface StepUpChallenge {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
  requiredFactors: string[];  // e.g., ['mfa', 'password']
}

// Implementation: Additional authentication required
```

### 7.2 Device Authentication

**Session Start** (`src/app/api/session/start/route.ts`)
```
Security validation:
  ✓ HMAC-SHA256 request signature verification
  ✓ Timestamp validation (5-minute window)
  ✓ Replay attack prevention (nonce)
  ✓ Schema validation (Zod)
  ✓ Rate limiting per deviceId + IP
```

### 7.3 WebAuthn (Passwordless)

**Flows:**
1. Create challenge
2. Register credential
3. Verify registration

**Files:**
- [src/app/api/admin/webauthn/register/challenge/route.ts](src/app/api/admin/webauthn/register/challenge/route.ts)
- [src/app/api/admin/webauthn/register/verify/route.ts](src/app/api/admin/webauthn/register/verify/route.ts)

---

## 8. Integration Points 🔗

### 8.1 Unified Endpoint Management (UEM)

**Supported Providers:**
- VMware Workspace ONE
- Apple Jamf
- Microsoft Intune

**Integration Files:**
- [src/lib/integrations/uem/workspace-one.ts](src/lib/integrations/uem/workspace-one.ts)
- [src/lib/integrations/uem/store.ts](src/lib/integrations/uem/store.ts)

**Capabilities:**
- Device enrollment verification
- Compliance status check
- Quarantine action

### 8.2 Network Access Control (NAC)

**Supported Providers:**
- Cisco ISE
- Aruba ClearPass
- Fortinet FortiNAC

**Integration Files:**
- [src/lib/integrations/nac/cisco-ise.ts](src/lib/integrations/nac/cisco-ise.ts)
- [src/lib/integrations/nac/aruba-clearpass.ts](src/lib/integrations/nac/aruba-clearpass.ts)

### 8.3 IT Service Management (ITSM)

**Supported:**
- ServiceNow
- Jira
- Generic webhook

**Features:**
- Create incident tickets
- Ticket lookup
- Retry with exponential backoff

**Files:**
- [src/lib/integrations/itsm/servicenow.ts](src/lib/integrations/itsm/servicenow.ts)
- [src/lib/integrations/itsm/jira.ts](src/lib/integrations/itsm/jira.ts)
- [src/lib/integrations/itsm/generic-webhook.ts](src/lib/integrations/itsm/generic-webhook.ts)

**Response Format:**
```typescript
{
  success: boolean,
  ticketId?: string,
  ticketUrl?: string,
  error?: string
}
```

### 8.4 Security Information & Event Management (SIEM)

**Event Export Features:**
- Syslog (RFC 5424)
- Splunk
- Datadog

**Severity Levels:**
```typescript
enum SyslogSeverity {
  EMERGENCY = 0,
  ALERT = 1,
  CRITICAL = 2,
  ERROR = 3,
  WARNING = 4,
  NOTICE = 5,
  INFO = 6,
  DEBUG = 7,
}
```

### 8.5 Telemetry & Compliance

**FleetDM Integration**
- osquery-style device telemetry
- Compliance signals
- Configuration management

**Files:**
- [src/lib/integrations/telemetry/fleetdm.ts](src/lib/integrations/telemetry/fleetdm.ts)
- [src/lib/integrations/telemetry/types.ts](src/lib/integrations/telemetry/types.ts)

### 8.6 Webhook Dispatcher

**Features:**
- Event-driven delivery
- Retry with exponential backoff
- Timeout handling (5 second default)
- Redacted payload for secrets

**Rate Limits:**
- Per webhook: Configurable
- Global: Depends on Redis capacity

**Files:**
- [src/lib/integrations/webhooks/dispatch.ts](src/lib/integrations/webhooks/dispatch.ts)
- [src/lib/integrations/webhooks/emitter.ts](src/lib/integrations/webhooks/emitter.ts)

---

## 9. Specialized Components 🧩

### 9.1 Policy Engine

**File:** [src/lib/policy/runtime/evaluate.ts](src/lib/policy/runtime/evaluate.ts)

**Evaluation Context:**
```typescript
interface EvaluationContext {
  deviceId: string;
  userId: string;
  riskScore: number;
  devicePosture: DevicePosture;
  uemStatus: UEMStatus;
  locationSignal: LocationSignal;
  timeContext: TimeContext;
}
```

**Actions Triggered:**
- `QUARANTINE_DEVICE`
- `REQUIRE_STEPUP`
- `BLOCK_ACCESS`
- `NOTIFY_ADMIN`
- `CREATE_INCIDENT`

### 9.2 Risk Scoring

**File:** [src/lib/risk/score.ts](src/lib/risk/score.ts)

**Factors Considered:**
- Device compliance
- User's login history
- Geographic anomalies
- UEM enrollment status
- Authentication method
- Time-based risk (late night, weekends)

**Output:**
```typescript
{
  riskScore: number (0-100),
  riskLevel: 'low' | 'medium' | 'high',
  reasons: string[]
}
```

### 9.3 Identity & Device Registry

**Files:**
- [src/lib/identity/deviceIdentity.ts](src/lib/identity/deviceIdentity.ts)
- [src/lib/deviceRegistry.ts](src/lib/deviceRegistry.ts)

**Purpose:**
- Badge → Device mapping
- Device metadata
- Enrollment state

### 9.4 Audit Ledger

**File:** [src/lib/auditLedger.ts](src/lib/auditLedger.ts)

**Design:**
- Append-only event log
- SHA-256 chain integrity (each event includes hash of previous)
- Immutable records
- Used for compliance & forensics

**Event Types:**
```
- session.created
- session.closed
- policy.evaluated
- device.quarantined
- incident.created
- auth.failed
- admin.action
```

---

## 10. File Structure Summary 📂

### Key Directories

```
/src
├── app/
│   └── api/
│       ├── health/                  # Health check endpoint
│       ├── session/                 # Session management
│       ├── location/                # Location signals
│       ├── events/                  # Event timeline
│       └── admin/                   # Admin APIs
│           ├── devices/
│           ├── policies/
│           ├── badges/
│           ├── integrations/
│           └── security-events/
└── lib/
    ├── adminAuth.ts                # Admin authentication
    ├── auth.ts                     # OIDC/JWT validation
    ├── auditLedger.ts              # Immutable audit log
    ├── badgeRegistry.ts            # Badge → userId mapping
    ├── deviceRegistry.ts           # Device metadata
    ├── observability.ts            # Logging & tracing
    ├── sessionStore.ts             # Session persistence
    ├── securityEvents.ts           # Event store
    ├── auth/
    │   ├── stepUpStore.ts          # Step-up auth challenges
    │   └── (OIDC/JWT logic)
    ├── backend/
    │   └── validation.ts           # Request signature validation
    ├── identity/
    │   └── deviceIdentity.ts       # Device ID resolution
    ├── integrations/
    │   ├── nac/                    # Network access control
    │   ├── uem/                    # Device management
    │   ├── itsm/                   # IT service management
    │   ├── siem/                   # Security monitoring
    │   ├── telemetry/              # osquery integration
    │   └── webhooks/               # Event delivery
    ├── location/
    │   └── store.ts                # Geolocation data
    ├── policy/
    │   ├── runtime/
    │   │   ├── dispatch.ts         # Action execution
    │   │   └── evaluate.ts         # Policy evaluation
    │   ├── types.ts                # Policy data types
    │   └── store/
    │       └── policyStore.ts      # Policy CRUD
    ├── risk/
    │   └── score.ts                # Risk calculation
    ├── types/
    │   ├── badge-event.ts          # BadgeEvent schema
    │   └── (other type definitions)
    └── utils/
        ├── rateLimit.ts            # Redis rate limiter
        └── fetchWithTimeout.ts     # HTTP client timeout wrapper
```

---

## 11. Dependencies & Tech Stack 📦

### Core Dependencies
```json
{
  "next": "^16.1.6",
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "ioredis": "^5.10.0",
  "zod": "^3.24.0",
  "jose": "^6.1.3",
  "uuid": "^13.0.0"
}
```

### Dev Dependencies
```json
{
  "@playwright/test": "^1.48.0",
  "vitest": "^2.1.8",
  "typescript": "^5.9.3",
  "eslint": "^9.39.1",
  "tailwindcss": "^4.1.17"
}
```

### Supporting Tools
- **Runtime:** Bun (package manager & runtime)
- **Static Analysis:** Semgrep
- **Load Testing:** k6
- **API Documentation:** None (needs implementation)

---

## 12. Configuration Files Summary ⚙️

| File | Purpose | Key Settings |
|------|---------|--------------|
| [package.json](package.json) | Dependencies & scripts | 30+ npm scripts including test, demo, integration test |
| [tsconfig.json](tsconfig.json) | TypeScript config | ES2017 target, strict mode, path aliases |
| [next.config.ts](next.config.ts) | Next.js build config | Security headers, redirects, environment vars |
| [vitest.config.ts](vitest.config.ts) | Unit test config | Node.js environment, 30s timeout, v8 coverage |
| [playwright.config.ts](playwright.config.ts) | E2E test config | 5 browsers, retry 2x, on-failure videos |
| [.eslintrc.json](eslint.config.mjs) | Linting rules | Next.js preset |
| [tsconfig.json](tsconfig.json) | Type checking | Strict mode enabled |

---

## 13. Key Findings & Recommendations 🎯

### ✅ Strengths
1. **Comprehensive Testing:** Unit, E2E, load, security, and demo tests
2. **Security-First Design:** HMAC validation, timing-safe comparison, step-up auth
3. **Observability:** Request ID tracing, structured logging, audit ledger
4. **Modular Integration:** Pluggable UEM/NAC/ITSM/SIEM adapters
5. **Performance Monitoring:** Load testing with k6, latency tracking
6. **Dev Experience:** Bun runtime, vitest for fast test cycles

### ⚠️ Issues to Address
1. **No OpenAPI Documentation** — Add Swagger/OpenAPI for auto-generated docs
2. **Inconsistent Error Handling** — Some routes missing try-catch
3. **In-Memory Fallback Risk** — Production should require Redis
4. **No Database Indexes Documented** — Document Redis key patterns for optimization
5. **Location Data TTL Missing** — Implement 24-hour TTL + aggregation
6. **JWKS Cache Refresh** — Added cache invalidation on key rotation failures
7. **Webhook Retry Logic** — Partially implemented, needs completion

### 🚀 Optimization Opportunities
1. Implement Redis persistence for all stores (already has fallback)
2. Add query depth limiting for complex operations
3. Implement connection pooling for external API calls
4. Add cache warming strategies for hot data
5. Implement distributed tracing with OpenTelemetry
6. Document SLA targets for each API endpoint

---

## 14. Testing Execution Guide 🧪

### Quick Tests
```bash
bun run test:demo:local          # Demo tests with server
bun run test:api                 # API tests only
bun run test:security:local      # Security tests with server
```

### Full CI Pipeline
```bash
bun run test:ci                  # Full pre-merge validation
# Includes: typecheck, lint, build, test:run
```

### Load & Performance
```bash
bun run test:load                # k6 load tests
# Measures p95 latency as shown in each .js file
```

### Development Flow
```bash
bun run dev                      # Start dev server (localhost:3000)
bun run test                     # Run tests in watch mode
bun run typecheck                # Type validation only
bun run lint                     # ESLint checks
```

---

## Appendix: Response Examples

### Session Start Success
```json
{
  "success": true,
  "session": {
    "sessionId": "uuid",
    "userId": "user-id",
    "nextAction": "LAUNCH_APP",
    "expiresAt": "2026-03-20T15:00:00Z"
  },
  "riskScore": 25,
  "riskLevel": "low",
  "identityId": "identity-uuid"
}
```

### Admin Stats Success
```json
{
  "totalSessions": 1247,
  "activeSessions": 12,
  "devices": {
    "total": 50,
    "active": 42,
    "offline": 8
  },
  "executiveSummary": {
    "highRiskDevices": 3,
    "incidentsCreated": 7,
    "quarantinedDevices": 2
  }
}
```

### Event Timeline Response
```json
{
  "correlationId": "uuid",
  "totalEvents": 150,
  "timeline": [
    {
      "order": 1,
      "time": "2026-03-20T10:30:00Z",
      "event": "Device Badge Scanned",
      "details": {
        "type": "BADGE_SCANNED",
        "actor": "device-123",
        "decision": "APPROVED",
        "riskScore": 15
      }
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

---

**Document Generated:** March 20, 2026  
**Analysis Scope:** Complete codebase exploration  
**Next Steps:** Consider implementing OpenAPI specification and database migration strategy for production deployment.
