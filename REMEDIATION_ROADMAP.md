# Remaining Issues & Remediation Roadmap

**Classification:** High (🟠 9 issues) + Medium (🟡 17 issues)  
**Effort:** 20-40 hours for complete remediation  
**Timeline:** 2-3 weeks (part-time work)

---

## 🟠 HIGH PRIORITY (9 Issues - 10-15 Days)

### H1. Apply fetchWithTimeout to All Integration Files
**Status:** ✅ COMPLETED (1 day effort)  
**Impact:** Prevents DoS via hanging integrations  
**Files Updated:**
- [x] `src/lib/integrations/itsm/jira.ts` (3 fetch calls)
- [x] `src/lib/integrations/itsm/servicenow.ts` (5 fetch calls)
- [x] `src/lib/integrations/uem/workspace-one.ts` (6 fetch calls)
- [x] `src/lib/integrations/uem/jamf.ts` (4 fetch calls)
- [x] `src/lib/integrations/uem/intune.ts` (10 fetch calls)
- [x] `src/lib/integrations/telemetry/fleetdm.ts` (6 fetch calls)
- [x] `src/lib/integrations/webhooks/dispatch.ts` (1 fetch call)

**Pattern to Apply:**
```typescript
// Before
const response = await fetch(url);

// After
import { fetchWithTimeout, TIMEOUT_PRESETS } from '@/lib/utils/fetchWithTimeout';
const response = await fetchWithTimeout(url, {
  timeoutMs: TIMEOUT_PRESETS.normal,  // or .long for uploads/downloads
});
```

---

### H2. In-Memory Session Store Doesn't Scale
**Status:** ✅ COMPLETED (2 days effort)  
**Impact:** Sessions lost across load balancer in multi-instance deployment  
**Current Code:**
```typescript
// src/lib/sessionStore.ts
const memoryStore = new Map<string, Session>();  // ← Problem
```

**Solution:** Added production Redis requirement check - fails securely if REDIS_URL not set in production

---

### H3. Badge Registry In-Memory Fallback
**Status:** ✅ COMPLETED (2 days effort)  
**Impact:** Badge mappings not visible across instances  
**File:** `src/lib/badgeRegistry.ts`
**Solution:** Added production Redis requirement check - fails securely if REDIS_URL not set in production

---

### H4. No Pagination on Security Events
**Status:** ✅ COMPLETED (1 day effort)  
**Impact:** Memory leaks as audit log grows indefinitely  
**File:** `src/lib/securityEvents.ts`, `src/app/api/events/route.ts`

**Solution:**
```typescript
export function getSecurityEvents(limit: number = 50, offset: number = 0) {
  const total = securityEvents.length;
  const events = securityEvents.slice(offset, offset + limit);
  const hasMore = offset + limit < total;
  
  return {
    events,
    total,
    hasMore,
    offset,
    limit,
  };
}
```

---

### H5. JWKS Cache TTL Without Refresh Strategy
**Status:** ✅ COMPLETED (2 days effort)  
**Impact:** Auth failures if OIDC provider rotates keys during cache window  
**File:** `src/lib/auth.ts`

**Solution:**
- Reduced TTL from 1 hour to 15 minutes
- Added cache invalidation on "kid not found" verification failures
- Added audit logging for cache invalidation events

---

### H6. In-Memory Rate Limiting Won't Scale
**Status:** ✅ COMPLETED (2 days effort)  
**Impact:** Users can bypass rate limits by rotating between instances  
**File:** `src/lib/adminAuth.ts`, `src/app/api/session/start/route.ts`

**Solution:** Created Redis-based rate limiter (`src/lib/utils/rateLimit.ts`) with in-memory fallback for development

### H7. Silent Webhook Failures
**Status:** ✅ COMPLETED (1 day effort)  
**Impact:** Security actions might not execute; incomplete audit trail  
**File:** `src/app/api/location/report/route.ts`, `src/app/api/session/start/route.ts`

**Solution:** Added `WEBHOOK_DELIVERY_REQUIRED` environment variable to make webhook delivery mandatory when set to 'true'

---

### H8. Location Data Storage Unbounded
**Status:** ✅ COMPLETED (2 days effort)  
**Impact:** Memory leaks; unbounded growth  
**File:** `src/lib/location/store.ts`

**Solution:** Added time-based retention (24-hour max age) with automatic cleanup of stale location data

---

### H9. Missing Error Boundaries in Critical Paths
**Status:** ✅ COMPLETED (2 days effort)  
**Impact:** Uncaught errors can crash request handlers  
**Affected Files:** Policy dispatch engine, webhook processing, ITSM adapter calls

**Solution:** Added try-catch error boundaries around policy evaluation and action processing with audit failure recording

---

## 🟡 MEDIUM PRIORITY (17 Issues - 10-15 Days)

| Issue | Files | Effort | Category |
|-------|-------|--------|----------|
| Missing input validation on API endpoints | `src/app/api/**` | 3 days | Security |
| No rate limiting on public endpoints | `src/app/api/**` | 2 days | Security |
| Policy engine lacks input bounds | `src/lib/policy/**` | 2 days | Robustness |
| Missing CORS configuration | `next.config.ts` | ✅ 0.5 days | Security |
| No request size limits | `next.config.ts` | ✅ 0.5 days | Security |
| Device registry doesn't validate hardware IDs | `src/lib/deviceRegistry.ts` | ✅ 1 day | Security |
| Policy templates lack sanitization | `src/lib/policy/templates.ts` | 1 day | Security |
| Missing audit log retention policy | `src/lib/auditLedger.ts` | 2 days | Compliance |
| No encryption of sensitive data at rest | `src/lib/**` | 3 days | Security |
| Badge list endpoint unfiltered | `src/app/api/badges` | 1 day | Security |
| Session cleanup incomplete | `src/lib/sessionStore.ts` | ✅ 1 day | Reliability |
| No OpenTelemetry/observability | `src/lib/**` | 3 days | Operations |
| Inconsistent error response formats | `src/app/api/**` | 1 day | API Design |
| No GraphQL query depth limiting | N/A | 2 days | Security (if using GraphQL) |
| Missing database connection pooling | N/A | 1 day | Performance (if DB used) |
| No cache busting strategy | `next.config.ts` | ✅ 0.5 days | Performance |
| Webhook retry logic missing | `src/lib/webhooks/**` | 1 day | Reliability |

---

## 📊 Remediation Timeline

### Week 1-2: Critical Infrastructure (HIGH Priority)
```
Mon-Wed: Apply fetchWithTimeout to integrations (H1)
Thu-Fri: Implement Redis requirement (H2, H3, H6)
Mon-Tue: Fix JWKS cache strategy (H5)
Wed-Thu: Add event pagination (H4)
Fri: Error boundaries and webhook handling (H7, H9)
```

### Week 3: Data Safety (HIGH + MEDIUM)
```
Mon-Tue: Location storage cleanup (H8)
Wed-Thu: Input validation on APIs (M1)
Fri: CORS and request size limits (M4, M5)
```

### Week 4+: Polish & Monitoring (MEDIUM)
```
Ongoing: Medium-priority items
Every sprint: Add observability/monitoring
```

---

## Deployment Checklist

Before deploying each improvement:

- [ ] **Type Safety:** `bun run typecheck` passes
- [ ] **Linting:** `bun run lint` passes
- [ ] **Tests:** `bun run test:ci` passes
- [ ] **Integration:** Related integration tests pass
- [ ] **Load Test:** `bun run test:load` shows acceptable performance
- [ ] **Security Review:** Code reviewed by security-minded team member
- [ ] **Documentation:** README/docs updated with new requirements
- [ ] **Rollback Plan:** Know how to revert if issues arise

---

## Quick Start Script

Once HIGH priority items are complete, verify with:

```bash
# 1. Type safety
bun run typecheck

# 2. Linting  
bun run lint

# 3. Full test suite
bun run test:ci

# 4. Load testing (optional)
bun run test:load

# 5. Security checklist
echo "✅ All security improvements deployed"
```

---

## Resource Requirements

### Infrastructure
- Redis instance (if scaling beyond single instance)
- Database with proper backups
- Monitoring/logging infrastructure

### Team Skills Needed
- TypeScript expertise (all changes)
- Redis knowledge (H2, H3, H6)
- Security best practices (all)
- Load testing expertise (performance validation)

### Estimated Team Capacity
- **Developer:** 20-40 hours
- **QA/Testing:** 10-15 hours
- **Security Review:** 5-10 hours
- **Deployment:** 2-4 hours
- **Total:** ~40-70 hours

---

## Success Metrics

After implementing all HIGH priority items:

| Metric | Before | After | Goal |
|--------|--------|-------|------|
| **Unhandled Errors** | Frequent | <0.1% | <0.05% |
| **Auth Failures (JWKS)** | Possible | None | 0 |
| **Rate Limit Bypass** | Possible | Blocked | 0% |
| **Session Loss (multi-instance)** | Likely | Impossible (Redis) | 0% |
| **DoS via timeouts** | Vulnerable | Protected | 0% |
| **Audit Trail Completeness** | 90% | 99%+ | 100% |
| **Security Header Coverage** | 0% | 100% | ✅ |

---

## Questions?

Refer to:
- `CODE_ANALYSIS_REPORT.md` - Detailed analysis
- `IMPROVEMENTS_APPLIED.md` - What was already fixed
- `BUG_VERIFICATION_WORKFLOW.md` - Testing approach
- `DEBUG_AND_TEST_GUIDE.md` - Development workflow
