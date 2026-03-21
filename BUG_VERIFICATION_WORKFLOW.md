# Bug Verification Workflow

This guide helps you systematically verify that bugs are fixed and prevent regressions.

## Quick Verification (5-15 mins)

Use this for minor bug fixes or hotfixes:

1. **Typecheck & Lint**
   - Run: `🛠️ DEBUG: Typecheck Only`
   - Run: `🛠️ DEBUG: Lint Check`
   - ✅ Verify no type errors or linting issues

2. **Targeted Tests**
   - Run: `🐛 BUG FIX: Verify After Fix (Quick)`
   - ✅ All tests pass
   - ✅ Demo tests pass (most realistic user scenario)

3. **Manual Verification**
   - Run: `🛠️ DEBUG: Start Dev Server`
   - Open http://localhost:3000
   - Test the bug scenario manually
   - ✅ Bug is fixed and no side effects observed

## Standard Verification (20-30 mins)

Use this for typical bug fixes:

1. **Code Quality Checks**
   - Run: `🐛 BUG FIX: Full Verification (Comprehensive)`
   - ✅ Check typecheck output
   - ✅ Check lint output
   - ✅ Check build output
   - ✅ All unit/API tests pass

2. **Full Test Suite**
   - Run: `🧪 TEST: All Tests (with local server)`
   - ✅ No regressions elsewhere
   - ✅ All test suites pass

3. **Integration Testing**
   - Run relevant integration tests:
     - `🌐 INTEGRATION: Webhooks Test` (if webhook-related)
     - `🌐 INTEGRATION: WebAuthn Smoke Test` (if auth-related)
     - `🌐 INTEGRATION: FleetDM Smoke Test` (if device-related)
   - ✅ External integrations still working

4. **Manual Testing**
   - Run: `🛠️ DEBUG: Start Dev Server`
   - Test the bug scenario and related features
   - Test on different browsers/devices if applicable
   - ✅ No new issues introduced

## Comprehensive Verification (45-60 mins)

Use this for critical bugs or before releases:

1. **Full Validation Suite**
   - Run: `🐛 BUG FIX: Validation Suite`
   - ✅ All unit tests pass
   - ✅ All E2E tests pass
   - ✅ No regressions

2. **Security & Performance**
   - Run: `🔒 TEST: Security Tests` (if security-related)
   - Run: `⚡ TEST: Load Tests` (if performance-related)
   - Run: `🔍 TEST: Static Analysis (Semgrep)`
   - ✅ No security vulnerabilities introduced
   - ✅ Performance acceptable

3. **Demo & Validation**
   - Run: `✅ DEMO: Validate Features`
   - ✅ All demo features work correctly
   - ✅ Bug doesn't affect demo flow

4. **Final Review**
   - Run: `🚀 CI: Full Test Suite (Pre-merge)`
   - ✅ Everything passes
   - Ready for merge

## Debugging During Fix

When initially debugging a bug:

1. **Explore the Issue**
   - Run: `🛠️ DEBUG: Start Dev Server`
   - Reproduce the bug manually
   - Check browser console for errors
   - Check server logs for issues

2. **Run Targeted Tests**
   - Run: `🧪 TEST: Demo Tests` (for user-facing bugs)
   - Run: `🧪 TEST: API Tests` (for API bugs)
   - Run: `🔒 TEST: Security Tests` (for security issues)
   - Look at test output for clues

3. **Check Code Quality**
   - Run: `🛠️ DEBUG: Typecheck Only`
   - Run: `🛠️ DEBUG: Lint Check`
   - Fix any type/lint warnings related to your change

## Simulation Tools for Testing

Use these to test specific scenarios:

- **`📱 SIM: Badge Simulation`** - Test badge-based features
- **`📱 SIM: Location Simulation`** - Test location-based features  
- **`📱 SIM: Posture Simulation`** - Test device posture features

Run these after fixing posture/location/badge-related bugs.

## Bug Verification Checklist Template

Copy this for tracking each bug fix:

```
## Bug: [Bug Title/Number]

### Fix Applied
- [ ] Problem identified and understood
- [ ] Code changes made
- [ ] Changes committed to branch

### Quick Verification (Done First)
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Demo tests pass
- [ ] Manual testing confirms fix

### Standard Verification (If approved for merge)
- [ ] Full build succeeds
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests pass
- [ ] Related simulation tests pass (if applicable)
- [ ] No side effects observed

### Final Sign-off
- [ ] Code review approved
- [ ] All verification tasks completed
- [ ] Ready for production
```

## Common Bug Categories & Recommended Verification

| Category | Command | Notes |
|----------|---------|-------|
| **Type/Lint Error** | `🛠️ Typecheck` + `🛠️ Lint` | Quick fix |
| **API/Backend Bug** | `🧪 TEST: API Tests` | Focus on API logic |
| **Demo/UI Bug** | `🧪 TEST: Demo Tests` | Demo tests cover user flows |
| **E2E/Integration** | `🧪 TEST: E2E Tests` | Browser automation |
| **Security Issue** | `🔒 TEST: Security Tests` | Security-scoped testing |
| **Performance Issue** | `⚡ TEST: Load Tests` | Load & stress testing |
| **Auth-Related** | `🌐 INTEGRATION: WebAuthn Smoke Test` | WebAuthn specific |
| **Device Management** | `🌐 INTEGRATION: FleetDM Smoke Test` | Device integration |
| **Webhook Issue** | `🌐 INTEGRATION: Webhooks Test` | External triggers |

## Tips

- **Always start with quick verification** - catch obvious issues early
- **Use the dev server while debugging** - live reload is faster than running full test suite
- **Run affected test category** - if fixing a demo bug, run demo tests
- **Check test reports** - test failures often provide specific guidance
- **Test with simulation tools** - especially for device/location/badge features
- **Leave dev server running** - useful for iterating on fixes
