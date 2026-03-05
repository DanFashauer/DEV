# Active Context: Next.js Starter Template with iOS EnterpriseShell

## Current State

**Project Status**: ✅ Ready for development

The project includes a Next.js 16 frontend and an iOS EnterpriseShell kiosk application. Both are ready for deployment.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] iOS EnterpriseShell kiosk app with session management
- [x] Fixed Swift compilation errors (DeviceInfo.swift, OIDCAuthService.swift)
- [x] Verified Next.js build and type checking
- [x] Added enrollment flow for unenrolled badges (EnrollingViewController)
- [x] **Added comprehensive security enhancements**:
  - SecurityManager with rate limiting (5 attempts/min, 5-min lockout)
  - Badge format validation with injection attack detection
  - Request signing (HMAC-SHA256) for API integrity
  - Device binding to prevent token hijacking
  - Security audit events for threat detection
- [x] **Code review system setup**:
  - SwiftLint configuration (`.swiftlint.yml`)
  - GitHub Actions: `ios-code-quality.yml` (push/PR workflow)
  - GitHub Actions: `swift-code-review.yml` (detailed PR analysis)
  - Local analysis script: `ios/run-code-analysis.sh`
  - Documentation: `ios/CODE_REVIEW.md`
- [x] **Extensible provider system**:
  - BadgeReaderProvider protocol for any badge reader type
  - IdentityProvider protocol for any identity provider (OIDC, SAML, MDM, MFA)
  - ProviderConfigurationService for environment-based configuration
  - Documentation: `ios/PROVIDER_CONFIGURATION.md`
- [x] **Admin dashboard GUI**:
  - `/admin` route with comprehensive management interface
  - Dashboard with real-time statistics and activity feed
  - Visual authentication flow graph (8-step process)
  - MDM persona builder with attribute mapping
  - Provider configuration UI
  - Device management and audit log views
- [x] **Security baseline and CI**:
  - SECURITY.md with security checklist and threat model
  - GitHub Actions: `web.yml` (Next.js lint, typecheck, build, audit)
  - GitHub Actions: `ios-build.yml` (iOS build, test, analyze, swiftlint)
  - CODEOWNERS for code ownership
- [x] **BLE-First MVP**:
  - Frozen BadgeEvent schema (v1) with all required fields
  - Backend validation script with signature verification
  - BLEBadgeReaderProvider with CoreBluetooth integration
  - USBCBadgeReaderProvider for transport parity
  - ProviderConfigurationService BLE preset
  - Acceptance tests documentation
- [x] **OIDC/JWT RBAC**:
  - JWT verification with JWKS (jose library)
  - Role-based access control (admin/operator/viewer)
  - API key fallback for development
  - Environment-gated dev bypass
- [x] **Device Registry**:
  - Device enrollment and lookup
  - Allowlist mode support
  - Redis-backed for production, in-memory for dev
- [x] **Observability**:
  - Request ID tracking and propagation
  - Structured JSON logging
  - Latency tracking per request
  - Secret filtering in logs
- [x] **JWT Auth Integration**:
  - Integrated JWT auth into admin API routes
  - Fixed auth.ts to export getAuthConfig
  - Added authentication to /api/admin/devices route
- [x] **Badge Identity Mapping (#22)**:
  - badgeRegistry.ts for badgeUID -> userId mapping
  - Admin API: POST /api/admin/badges/enroll, GET /api/admin/badges, DELETE /api/admin/badges/:badgeUid
  - Redis-backed with in-memory fallback for dev
- [x] **Session Engine + App Launch (#23)**:
  - sessionStore.ts for session management (create, get, terminate)
  - Updated /api/session/start to validate badge, lookup user, create session
  - Added /api/session/:sessionId for polling and termination
  - Returns session directive with LAUNCH_APP action and bundleId
  - Rate limiting per deviceId + IP
- [x] **BLE Simulator/Test Harness (#25)**:
  - scripts/sim-badge.ts for simulating badge scan events
  - Generates signed BadgeEvent v1 payloads
  - Supports auto-enrollment with --enroll flag
  - Added bun run sim:badge npm script
- [x] **Tamper-Evident Audit Ledger (v0.2 Phase 2)**:
  - auditLedger.ts with SHA-256 hash chaining
  - GET /api/admin/audit/export (NDJSON format)
  - GET /api/admin/audit/verify (chain integrity check)
  - Integrated ledger writes into session routes (start/end)
  - Integrated ledger writes into admin badge routes (enroll/delete)
  - Auth failure tracking with error codes
  - Secret redaction to prevent logging credentials
  - scripts/audit-verify.ts for testing
  - npm scripts: test:audit, audit:verify
- [x] **Location Signals**:
  - LocationSignal types (presence/coarse/precise modes)
  - Location config with safe defaults (LOCATION_MODE=presence)
  - Location store (Redis/in-memory)
  - Location validation
  - Integration dispatcher scaffold
  - API endpoints: POST /api/location/report, GET /api/admin/location
  - ios/README.md documentation
- [x] **Integrations Webhooks v1**:
  - Admin CRUD for webhook endpoints
  - Per-endpoint HMAC-SHA256 signing secrets
  - Secret rotation support
  - Exponential backoff with jitter + retry (max 6 attempts)
  - Dead Letter Queue (DLQ) for failed deliveries
  - Delivery receipts and logs
  - HTTPS-only in production (blocks localhost)
  - Event emission: session.start, session.end, badge.enroll, badge.delete, auth.failure, asset.location.observed
  - API routes: POST/GET /api/admin/integrations/webhooks, PATCH/DELETE /api/admin/integrations/webhooks/:id
  - Test script: scripts/webhook-test.ts + npm script
  - ios/README.md quickstart
- [x] **Policy Engine v1**:
  - Rule-based policy evaluation engine
  - Policy types with conditions (eq, neq, in, gt, lt) and actions
  - Policy store with in-memory persistence
  - Admin API: GET/POST /api/admin/policies, PATCH/DELETE /api/admin/policies/:id
  - Integrated with session.start for dynamic session TTL
  - Supports actions: launch_app, set_session_ttl, send_itsm_ticket, emit_siem_event, quarantine_device, notify_admin

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |
| `ios/EnterpriseShell/` | iOS kiosk app | ✅ Ready |
| `.swiftlint.yml` | SwiftLint rules | ✅ New |
| `.github/workflows/` | CI workflows | ✅ New |
| `ios/CODE_REVIEW.md` | CI documentation | ✅ New |
| `ios/PROVIDER_CONFIGURATION.md` | Provider config docs | ✅ New |
| `ios/EnterpriseShell/Services/BadgeReaderProvider.swift` | Badge reader protocol | ✅ New |
| `ios/EnterpriseShell/Services/IdentityProvider.swift` | Identity provider protocol | ✅ New |
| `ios/EnterpriseShell/Services/ProviderConfigurationService.swift` | Provider config service | ✅ New |
| `src/app/admin/page.tsx` | Admin dashboard GUI | ✅ New |
| `ios/run-code-analysis.sh` | Local analysis | ✅ New |
| `SECURITY.md` | Security baseline policy | ✅ New |
| `.github/workflows/web.yml` | Next.js CI workflow | ✅ New |
| `.github/workflows/ios-build.yml` | iOS build workflow | ✅ New |
| `.github/CODEOWNERS` | Code ownership | ✅ New |
| `src/lib/types/badge-event.ts` | BadgeEvent TypeScript types | ✅ New |
| `src/lib/backend/validation.ts` | Backend validation script | ✅ New |
| `ios/EnterpriseShell/Services/BLEBadgeReaderProvider.swift` | BLE badge reader provider | ✅ New |
| `ios/EnterpriseShell/Services/USBCBadgeReaderProvider.swift` | USB-C badge reader provider | ✅ New |
| `ios/BLE_MVP_ACCEPTANCE_TESTS.md` | BLE MVP acceptance tests | ✅ New |
| `src/lib/auth.ts` | OIDC/JWT authentication | ✅ New |
| `src/lib/deviceRegistry.ts` | Device enrollment and lookup | ✅ New |
| `src/lib/observability.ts` | Request tracing and logging | ✅ New |
| `scripts/replay-test.ts` | Replay protection test | ✅ New |
| `src/lib/badgeRegistry.ts` | Badge UID -> userId mapping | ✅ New |
| `src/lib/sessionStore.ts` | Session management | ✅ New |
| `scripts/sim-badge.ts` | Badge scan simulator | ✅ New |
| `src/lib/auditLedger.ts` | Tamper-evident audit ledger | ✅ New |
| `src/app/api/admin/audit/export/route.ts` | Audit export API | ✅ New |
| `src/app/api/admin/audit/verify/route.ts` | Audit verify API | ✅ New |
| `src/lib/auth/stepUpStore.ts` | Step-up session store | ✅ New |
| `src/lib/adminAuth.ts` | Step-up auth middleware | ✅ New |

## Current Focus

The project now includes WebAuthn/FIDO2 step-up authentication for high-risk admin operations:

1. Badge-based authentication with BadgeEvent v1 schema
2. Badge identity mapping (badgeUID → userId)
3. Session management with LAUNCH_APP directives
4. Step-up authentication for high-risk admin ops:
   - webhook_secret_rotate, integration_credential_set/update
   - policy_edit, policy_enable
   - device_quarantine, allowlist_toggle
   - admin_delete, device_unenroll

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe
- [ ] **v0.2.0 - Tap-to-Login for Shared iOS Devices** (see GitHub milestone)

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-02-16 | Added iOS EnterpriseShell kiosk app |
| 2026-02-16 | Fixed Swift bugs (environ→environment, extra parenthesis) |
| 2026-02-16 | Verified all builds pass (TypeScript, ESLint, Next.js)
| 2026-02-17 | Code review: SwiftLint setup + GitHub Actions + local analysis script |
| 2026-02-17 | Admin GUI: Auth flow visualization + MDM persona builder + provider config |
| 2026-02-17 | Security: Add SECURITY.md and CI workflows for web and iOS |
| 2026-02-20 | BLE-First MVP: BadgeEvent schema + backend validation + BLE provider + USB-C parity |
| 2026-03-05 | OIDC/JWT RBAC skeleton + device registry + observability middleware |
| 2026-03-05 | Created v0.2.0 milestone with 7 issues (GitHub)
| 2026-03-05 | Implemented #22 Badge Identity Mapping + #23 Session Engine + #25 BLE Simulator
| 2026-03-05 | Implemented Tamper-Evident Audit Ledger (v0.2 Phase 2)
| 2026-03-05 | Implemented Integrations Webhooks v1 (admin CRUD, signed events, retries, DLQ)
| 2026-03-05 | Implemented Policy Engine v1 (rule evaluation, admin API, session integration)
| 2026-03-05 | Implemented Policy Actions + Integrations v1 (ITSM/SIEM adapters, dispatcher)
| 2026-03-05 | Implemented Step-Up Enforcement (webhook secret rotate, policy edit/enable, device quarantine, etc.)
