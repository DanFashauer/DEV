# Debug & Test Workflow Guide

Complete guide for debugging, testing, and verifying features across both the Next.js web app and iOS app.

## Quick Start

### First Time Setup
1. Read the relevant section below (Web or iOS)
2. Run setup commands
3. Start the dev environment
4. Run a simple test to verify setup

### Daily Development Loop
1. Make code changes
2. Run relevant tests (see Quick Verification in BUG_VERIFICATION_WORKFLOW.md)
3. Test manually with dev server or emulator
4. Commit when all checks pass

---

## Web App Debugging (Next.js)

### Setup
```shell
# One-time setup
bun install
bun run dev  # Start dev server at http://localhost:3000
```

### Development Server

**Start dev server:**
- VS Code Task: `🛠️ DEBUG: Start Dev Server`
- Manual: `bun run dev`
- Access: http://localhost:3000
- Hot reload enabled

**Features:**
- Live code reloading on file changes
- Browser DevTools available
- Server logs in terminal
- TypeScript errors displayed in browser

### Local Testing with Test Server

The test server is required for running tests locally (provides API endpoints).

**Start test environment:**
```shell
VS Code Tasks in order:
1. Run: 🛠️ DEBUG: Start Test Server  (if not already running)
2. Run your test task
3. Run: 🛠️ DEBUG: Stop Test Server   (when done)
```

**Or use combined tasks** (handles server start/stop automatically):
- `🧪 TEST: All Tests (with local server)` - All tests
- `🧪 TEST: Demo Tests` - User flow tests
- `🧪 TEST: API Tests` - API logic tests
- `🔒 TEST: Security Tests` - Security validations

### Manual Testing Workflow

1. Start dev server: `🛠️ DEBUG: Start Dev Server`
2. Open http://localhost:3000 in browser
3. Open DevTools (F12 or Cmd+Option+I)
4. Check Console tab for errors
5. Check Network tab for API issues
6. Make code changes - page auto-reloads

### Running Specific Tests

```shell
# All tests in watch mode
bun run test

# Specific test file
bun run test tests/demo/login.test.ts

# Tests matching pattern
bun run test --grep "badge"

# Single run (no watch)
bun run test:run
```

### Debugging Test Failures

When a test fails:

1. **Read the error message** - Vitest provides clear output
2. **Check test file** - Understand what the test expects
3. **Run test in isolation**:
   ```shell
   bun run test tests/path/to/test.ts
   ```
4. **Add debug output**:
   ```typescript
   // In test file
   console.log('Debug:', someValue);
   ```
5. **Check live server** - Run dev server and test manually
6. **Review test reports**:
   ```shell
   bun run test:summary  # Show test failure summary
   ```

### Common Test Commands

| Task | Command |
|------|---------|
| Run all tests (watch) | `🧪 TEST: All Tests` |
| API tests only | `🧪 TEST: API Tests` |
| Demo tests only | `🧪 TEST: Demo Tests` |
| E2E tests | `🧪 TEST: E2E Tests (Playwright)` |
| Security tests | `🔒 TEST: Security Tests` |
| Load tests | `⚡ TEST: Load Tests` |

### Code Quality Checks

```shell
# Type checking
bun run typecheck

# Linting
bun run lint

# Both (recommended before commit)
bun run test:ci
```

### Debugging Specific Features

#### Badge/Location/Posture Features
1. Start test server: `🛠️ DEBUG: Start Test Server`
2. Run simulation:
   - `📱 SIM: Badge Simulation`
   - `📱 SIM: Location Simulation`
   - `📱 SIM: Posture Simulation`
3. Check results in logs
4. Test related functionality with dev server

#### Webhook Integration
1. Start dev server: `🛠️ DEBUG: Start Dev Server`
2. Run: `🌐 INTEGRATION: Webhooks Test`
3. Check webhook test output
4. Monitor server logs for webhook calls

#### Authentication
1. Start dev server with test server: `🛠️ DEBUG: Start Test Server`
2. Test WebAuthn: `🌐 INTEGRATION: WebAuthn Smoke Test`
3. Manual test: Open http://localhost:3000/admin
4. Check auth flows in console

---

## iOS App Debugging

### Setup

**Prerequisites:**
- macOS with Xcode installed
- iOS 15.0+ or iPadOS 15.0+
- Device or simulator

**Install dependencies:**
```shell
cd ios
./setup.sh  # One-time setup
```

### Building & Running

**Using Xcode (Recommended for debugging):**
1. Open `ios/EnterpriseShell.xcodeproj`
2. Select target device/simulator
3. Press Run (⌘R)
4. Watch Xcode console for logs

**Using command line:**
```shell
cd ios
xcodebuild -scheme EnterpriseShell -configuration Debug -destination "platform=iOS Simulator,name=iPad Pro"
```

### Using Simulator

**Start iOS Simulator:**
```shell
open -a Simulator
```

**Available simulators:**
- iPad Pro (15-inch)
- iPad Pro (11-inch)
- iPad Air
- iPad mini
- iPhone (various models)

**Run app in simulator:**
1. Select iPad from Xcode scheme dropdown
2. Press Run (⌘R)
3. App launches in simulator

### Debugging in Xcode

**Set breakpoints:**
1. Click code line number in Xcode
2. Run app (⌘R)
3. Execution pauses at breakpoint
4. Step over/into variables in debugger

**View logs:**
- Xcode Console (⌘⇧C)
- Device logs in Xcode organizer

**Debug memory issues:**
- Xcode Debug Navigator → Memory
- Instruments (⌘I) → Leaks, Zombies

### Testing iOS Code

**Run unit tests:**
```shell
cd ios
xcodebuild test -scheme EnterpriseShell
```

**Test categories:**
- Session state machine tests
- Authentication flow tests
- Badge reader integration tests
- Keychain storage tests
- API integration tests

### Key Features to Test

| Feature | How to Test |
|---------|------------|
| **Badge Reading** | Use simulator with mock hardware events |
| **Session State** | Navigate through app states, verify transitions |
| **Authentication** | Test Microsoft Entra ID login flow |
| **Token Storage** | Check Keychain via Xcode |
| **App Launching** | Select persona, verify correct app launches |
| **Session Teardown** | End session, verify data cleanup |
| **Audit Logging** | Check app logs for event entries |

### Common iOS Debugging Issues

| Problem | Solution |
|---------|----------|
| App won't build | Run `./setup.sh` to install dependencies |
| Simulator won't start | Restart Simulator app, or reset content |
| Breakpoint not hit | Check build scheme and configuration |
| Memory leak suspected | Use Instruments → Leaks tool |
| Keychain access denied | Check entitlements in Xcode project |

---

## Web + iOS Integration Testing

### End-to-End Flow

1. **Start web backend:**
   - `🛠️ DEBUG: Start Test Server`

2. **Run iOS app:**
   - Xcode: Press ⌘R
   - Or simulator with `xcodebuild test`

3. **Test authentication flow:**
   - iOS app logs in with badge/credentials
   - Web backend receives authentication
   - Session created successfully

4. **Verify data sync:**
   - Change data in web app
   - iOS app reflects changes
   - Check audit logs

### Testing Specific Integration Points

**API Integration:**
1. Start test server: `🛠️ DEBUG: Start Test Server`
2. iOS app makes API calls
3. Check web server logs: `bun run test:server:start`
4. Monitor API responses

**Session Management:**
1. Start iOS app
2. Start web dev server: `🛠️ DEBUG: Start Dev Server`
3. View sessions dashboard at http://localhost:3000/admin
4. Start/end iOS session, watch web console update

**Audit Logging:**
1. Perform actions in iOS app
2. Check web app audit log: http://localhost:3000/admin/audit
3. Verify all actions logged

---

## Demo Workflows

### Full Demo (Web Only)

Run: `🚀 DEMO: Full Flow (with setup)`

This runs:
1. Starts test server
2. Runs complete demo flow
3. Stops test server
4. Generates report

### Executive Demo

Run: `🎬 DEMO: Executive Presentation`

Quick feature showcase with key scenarios.

### Feature Validation

Run: `✅ DEMO: Validate Features`

Validates all demo features work correctly.

### Combined Web + iOS Demo

1. Run: `🎬 DEMO: Executive Presentation`
2. Show web app in browser
3. Start iOS app in simulator
4. Walk through end-to-end scenarios

---

## Testing Matrix

Use this to guide which tests to run for different types of changes:

| Change Type | Tests to Run |
|-------------|------------|
| **UI Change** | Demo Tests, E2E Tests, Manual Testing |
| **API Endpoint** | API Tests, Integration Tests, Manual Testing |
| **Authentication** | Security Tests, Demo Tests, WebAuthn Test |
| **Badge/Location** | Simulation Tools, Demo Tests |
| **Backend Logic** | API Tests, Security Tests |
| **iOS Feature** | Xcode Unit Tests, Manual iOS Testing |
| **Integration** | All Integration Tests, Manual End-to-End |
| **Security** | Security Tests, Semgrep Analysis, Manual Review |

---

## Tips & Best Practices

### Development
- Keep dev server running while developing
- Use browser DevTools to debug frontend
- Check server logs when API calls fail
- Run typecheck/lint before committing

### Testing
- Start with quick tests during development
- Run full suite before submitting PR
- Focus on affected feature areas
- Review test output carefully

### iOS
- Test on real device for badge reader features
- Use simulator for most development
- Check memory usage regularly
- Monitor performance in Instruments

### Debugging
- Use test server for consistent environment
- Check browser console AND server logs
- Run tests in isolation if confused
- Look at test failures carefully - they're informative

### Performance
- Use load tests for new features (`⚡ TEST: Load Tests`)
- Profile with Xcode Instruments
- Monitor browser DevTools Network tab
- Check server response times in tests

---

## Getting Help

### When Tests Fail
1. Read error message carefully
2. Check test file to understand expectation
3. Run test in isolation
4. Check related server logs
5. Review code changes you made

### When Manual Testing Fails
1. Check browser console (F12)
2. Check server logs
3. Run unit tests to isolate issue
4. Restart dev server if needed
5. Clear browser cache if necessary

### When iOS Fails
1. Check Xcode console
2. Review build errors carefully
3. Run `./setup.sh` again
4. Reset simulator if needed
5. Check iOS code for crashes

