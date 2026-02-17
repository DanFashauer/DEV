# iOS Code Quality & Review

This document describes the automated code quality checks and review process for the EnterpriseShell iOS application.

## GitHub Actions Workflows

### 1. [`ios-code-quality.yml`](../.github/workflows/ios-code-quality.yml)
Main workflow that runs on every push and PR:

 Job | Description || Trigger |
|-----|-------------|---------|
| `swiftlint` | SwiftLint static analysis | Push to main/develop, PR changes |
| `security-analysis` | Security vulnerability scan | Push/PR |
| `code-review` | Custom code quality checks | Push/PR |
| `dependency-check` | SPM/CocoaPods verification | Push/PR |
| `test` | Test file discovery | Push/PR |
| `build` | Xcode build verification | After lint passes |

### 2. [`swift-code-review.yml`](../.github/workflows/swift-code-review.yml)
Detailed PR-focused analysis:

| Job | Checks |
|-----|--------|
| `analyze` | SwiftLint on changed files |
| `security-scan` | Credential scanning, crypto, URLs |
| `code-metrics` | LOC, file counts, complexity |
| `architecture-check` | Delegate patterns, memory, async |

## Running Locally

### SwiftLint

```bash
# Install
brew install swiftlint

# Run on entire project
cd ios
swiftlint

# Run on specific file
swiftlint --path EnterpriseShell/Services/SecurityManager.swift

# With custom config
swiftlint --config .swiftlint.yml
```

### Security Checks

```bash
# Check for hardcoded credentials
grep -rn "password\s*=" ios/EnterpriseShell --include="*.swift"

# Check for HTTP URLs
grep -rn "http://" ios/EnterpriseShell --include="*.swift" | grep -v localhost

# Check for print statements
grep -rn "print(" ios/EnterpriseShell --include="*.swift"
```

### Build Verification

```bash
# Generate Xcode project (if needed)
cd ios
xcodegen generate

# Build
xcodebuild -project EnterpriseShell.xcodeproj \
  -scheme EnterpriseShell \
  -configuration Debug \
  build
```

## SwiftLint Configuration

See [`.swiftlint.yml`](../.swiftlint.yml) for the full configuration.

### Custom Rules

| Rule | Purpose |
|------|---------|
| `hardcoded_credentials` | Detect hardcoded passwords/keys |
| `print_statement` | Ensure AuditLogger usage |
| `force_unwrap` | Avoid force unwrapping |
| `insecure_url` | Detect HTTP URLs |
| `todo_without_severity` | Require TODO severity |
| `weak_delegate` | Detect strong delegates |
| `device_encryption` | Check encryption |

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] No hardcoded credentials or API keys
- [ ] All URLs use HTTPS
- [ ] No `print()` statements (use AuditLogger)
- [ ] Delegates are declared as `weak`
- [ ] No force unwrapping (`!`)
- [ ] Error handling is present
- [ ] TODOs have severity levels (HIGH/MEDIUM/LOW)
- [ ] Code follows Swift style guidelines

## Security Considerations

This app handles sensitive data. Key security requirements:

1. **Token Storage**: Always use KeychainService
2. **No Logging**: Never log credentials/tokens
3. **HTTPS Only**: All network requests must use HTTPS
4. **Certificate Pinning**: Enable for production backend
5. **Device Binding**: Tokens bound to device ID
6. **Request Signing**: All API requests signed with HMAC

## CI Status Badges

Add to your README:

```markdown
[![SwiftLint](https://github.com/your-org/your-repo/actions/workflows/ios-code-quality.yml/badge.svg)](https://github.com/your-org/your-repo/actions/workflows/ios-code-quality.yml)
[![Code Review](https://github.com/your-org/your-repo/actions/workflows/swift-code-review.yml/badge.svg)](https://github.com/your-org/your-repo/actions/workflows/swift-code-review.yml)
```
