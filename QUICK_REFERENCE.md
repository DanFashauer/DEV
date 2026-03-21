# Quick Reference: VS Code Task Shortcuts

Fast access to your most common workflows. Open VS Code Command Palette (Cmd/Ctrl+Shift+P) and type "Run Task" to access any of these.

---

## 🚀 DEMO TASKS

Launch demonstrations of the system:

```
Quick:      Press Cmd/Ctrl+Shift+P → "Run Task: DEMO: Validate Features"
Flow:       Press Cmd/Ctrl+Shift+P → "Run Task: DEMO: Full Flow"
Executive:  Press Cmd/Ctrl+Shift+P → "Run Task: DEMO: Executive Presentation"
Seed Data:  Press Cmd/Ctrl+Shift+P → "Run Task: DEMO: Seed Data"
```

---

## 🧪 TESTING TASKS

Run different test suites:

```
All Tests:      Press Cmd/Ctrl+Shift+P → "Run Task: TEST: All Tests (with local server)"
API Tests:      Press Cmd/Ctrl+Shift+P → "Run Task: TEST: API Tests"
Demo Tests:     Press Cmd/Ctrl+Shift+P → "Run Task: TEST: Demo Tests"
E2E Tests:      Press Cmd/Ctrl+Shift+P → "Run Task: TEST: E2E Tests (Playwright)"
Security Tests: Press Cmd/Ctrl+Shift+P → "Run Task: TEST: Security Tests"
Load Tests:     Press Cmd/Ctrl+Shift+P → "Run Task: TEST: Load Tests"
Summary:        Press Cmd/Ctrl+Shift+P → "Run Task: TEST: Summary of Failures"
```

---

## 🐛 BUG VERIFICATION TASKS

After fixing a bug, use these in order:

```
Quick Fix (5 min):
  1. Press Cmd/Ctrl+Shift+P → "Run Task: BUG FIX: Verify After Fix (Quick)"
  2. Manual test with dev server

Full Fix (20 min):
  1. Press Cmd/Ctrl+Shift+P → "Run Task: BUG FIX: Full Verification (Comprehensive)"
  2. Manual test with dev server
  3. Run relevant integration tests

Critical Bug (60 min):
  1. Press Cmd/Ctrl+Shift+P → "Run Task: BUG FIX: Validation Suite"
  2. Full manual testing
  3. Integration test verification
```

---

## 🛠️ DEBUGGING TASKS

Tools for debugging and development:

```
Start Dev:   Press Cmd/Ctrl+Shift+P → "Run Task: DEBUG: Start Dev Server"
             Open http://localhost:3000 (keep running in background)

Type Check:  Press Cmd/Ctrl+Shift+P → "Run Task: DEBUG: Typecheck Only"
Lint Check:  Press Cmd/Ctrl+Shift+P → "Run Task: DEBUG: Lint Check"

Test Server: 
  Start: Press Cmd/Ctrl+Shift+P → "Run Task: DEBUG: Start Test Server"
  Stop:  Press Cmd/Ctrl+Shift+P → "Run Task: DEBUG: Stop Test Server"
```

---

## 🌐 INTEGRATION TESTS

Test integrations with external services:

```
Webhooks:   Press Cmd/Ctrl+Shift+P → "Run Task: INTEGRATION: Webhooks Test"
WebAuthn:   Press Cmd/Ctrl+Shift+P → "Run Task: INTEGRATION: WebAuthn Smoke Test"
FleetDM:    Press Cmd/Ctrl+Shift+P → "Run Task: INTEGRATION: FleetDM Smoke Test"
Audit:      Press Cmd/Ctrl+Shift+P → "Run Task: INTEGRATION: Audit Verification"
```

---

## 📱 SIMULATIONS

Test features with simulations:

```
Badge:    Press Cmd/Ctrl+Shift+P → "Run Task: SIM: Badge Simulation"
Location: Press Cmd/Ctrl+Shift+P → "Run Task: SIM: Location Simulation"
Posture:  Press Cmd/Ctrl+Shift+P → "Run Task: SIM: Posture Simulation"
```

---

## 📦 BUILD & CI TASKS

Production and pre-merge checks:

```
Build:      Press Cmd/Ctrl+Shift+P → "Run Task: BUILD: Development Build"
Full CI:    Press Cmd/Ctrl+Shift+P → "Run Task: CI: Full Test Suite (Pre-merge)"
```

---

## MOST COMMON WORKFLOWS

### I'm Starting Development
```
1. Press Cmd/Ctrl+Shift+P → "Run Task: DEBUG: Start Dev Server"
2. Open http://localhost:3000 in browser
3. Start editing code (auto-reload)
```

### I Fixed a Bug and Need to Verify
```
1. Press Cmd/Ctrl+Shift+P → "Run Task: BUG FIX: Verify After Fix (Quick)"
2. Wait for tests to pass
3. Verify manually with dev server (keep running from step 1)
```

### I'm Ready to Submit Code
```
1. Press Cmd/Ctrl+Shift+P → "Run Task: CI: Full Test Suite (Pre-merge)"
2. Wait for all checks to pass
3. Submit code for review
```

### I Need to Debug a Failing Test
```
1. Press Cmd/Ctrl+Shift+P → "Run Task: TEST: [Relevant Test Type]"
2. Read the error message
3. Open the test file to understand it
4. Press Cmd/Ctrl+Shift+P → "Run Task: DEBUG: Start Dev Server"
5. Manual test in browser at http://localhost:3000
```

### I'm Doing a Demo
```
1. Press Cmd/Ctrl+Shift+P → "Run Task: DEMO: Full Flow (with setup)"
2. Wait for demo to complete
3. Check results and reports
```

---

## KEYBOARD SHORTCUTS

**VS Code**
- Open Command Palette: Cmd/Ctrl+Shift+P
- Quick File Open: Cmd/Ctrl+P
- Toggle Terminal: Ctrl+` (backtick)
- Find in Files: Cmd/Ctrl+Shift+F

**Browser (http://localhost:3000)**
- Open DevTools: F12 or Cmd/Ctrl+Option+I
- Console: Cmd/Ctrl+Option+J
- Network: Cmd/Ctrl+Option+E
- Reload: Cmd/Ctrl+R
- Hard Reload: Cmd/Ctrl+Shift+R

**Terminal**
- Stop running task: Ctrl+C
- Clear screen: Cmd/Ctrl+K or type `clear`

---

## TASK OUTPUT TIPS

### Understanding Test Output
```
✓ 125 passed (3.2s)
✗ 5 failed (1.2s)

Green ✓ = Tests passed
Red ✗  = Tests failed - read the error details
```

### Understanding Lint Output
```
src/component.tsx
  10:5  error  Unused variable 'x'  no-unused-vars
  15:8  warn   Line too long             line-too-long

Fix these before committing
```

### Understanding Build Output
```
✓ compiled
✓ server compiled

No errors = good to go
Errors = fix them before testing
```

---

## ENVIRONMENT VARIABLES

If needed, create a `.env.local` file:

```
# Example .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DATABASE_URL=postgresql://...
```

---

## COMMON ISSUES & FIXES

| Issue | Fix |
|-------|-----|
| Dev server won't start | Stop other servers first, check port 3000 |
| Tests timeout | Increase timeout in vitest config, or debug the test |
| Build fails | Run `bun run typecheck` to find type errors |
| Lint errors | Run `bun run lint` and fix them |
| Tests pass locally but fail in CI | Check `.ci` scripts, might need env vars |
| Dev server shows old code | Hard reload browser (Cmd/Ctrl+Shift+R) |

---

## COMMAND LINE ALTERNATIVES

Prefer VS Code tasks above, but can also run manually:

```bash
# Dev server
bun run dev

# Tests (watch mode)
bun run test

# Tests (single run)
bun run test:run

# Type check
bun run typecheck

# Lint
bun run lint

# Build
bun run build

# Specific test suite
bun run test:api
bun run test:demo
bun run test:e2e

# Start/stop test server
bun run test:server:start
bun run test:server:stop

# Full CI suite
bun run test:ci
```

---

## NEED HELP?

1. **Bug Verification**: Read [BUG_VERIFICATION_WORKFLOW.md](BUG_VERIFICATION_WORKFLOW.md)
2. **Full Guide**: Read [DEBUG_AND_TEST_GUIDE.md](DEBUG_AND_TEST_GUIDE.md)
3. **Test Output**: Check the problem matcher output in VS Code
4. **Manual Testing**: Use dev server at http://localhost:3000
5. **iOS Debugging**: Use Xcode (open `ios/EnterpriseShell.xcodeproj`)

