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
- [x] **Admin API security hardening**:
  - Centralized auth module (`src/lib/adminAuth.ts`) with timing-safe comparison
  - Rate limiting (30 req/min per IP)
  - Production-fail-closed (no default API key)
  - Comprehensive cache prevention headers
  - Audit logging for auth attempts

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
| `src/lib/adminAuth.ts` | Admin auth module with timing-safe comparison | ✅ New |
| `src/app/api/admin/stats/route.ts` | Admin stats API with hardened auth | ✅ New |

## Current Focus

The project includes an iOS EnterpriseShell application for enterprise kiosk management. The app features:

1. Badge-based authentication flow
2. OIDC integration with Microsoft Entra ID
3. Session state management
4. Audit logging
5. Enterprise app launching

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
| 2026-02-19 | Admin API: Add timing-safe auth, rate limiting, and audit logging |
