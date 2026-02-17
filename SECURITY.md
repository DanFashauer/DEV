# Security Policy

## Security Baseline

This document outlines the security requirements and assumptions for the EnterpriseShell kiosk application.

### No Secrets in Repository

- **Never commit** API keys, tokens, certificates, or credentials to this repository
- Use environment variables for all sensitive configuration
- Store secrets in the iOS Keychain with `kSecAttrAccessibleThisDeviceOnly`
- Backend service URLs should be configurable via `ProviderConfigurationService`

### HTTPS Required

- All network communication MUST use TLS 1.2 or higher
- Certificate pinning should be implemented for production deployments
- HTTP Strict Transport Security (HSTS) headers should be enforced by the backend

### Logging Policy

- **Never log** raw badge identifiers, user IDs, or PII in production
- Audit logs should use masked/hashed identifiers
- Session tokens should never appear in logs
- Log levels should be configurable (debug, info, warning, error)

Example (mask badge ID):
```swift
// Instead of: logger.info("Badge scanned: \(badgeId)")
logger.info("Badge scanned: ***\(String(badgeId.suffix(4)))")
```

### Threat Model Assumptions

This application is designed for the following deployment scenario:

1. **Supervised Device**: iOS devices are in Single App Mode or Guided Access
2. **Kiosk Environment**: Devices are in public-facing or controlled-access locations
3. **Physical Security**: Devices are physically secured (locked enclosure, tamper detection)
4. **Network Security**: Devices operate on trusted networks behind corporate firewalls
5. **User Intent**: Users are authorized employees badge-in for work sessions

### Security Requirements

- [ ] Certificate pinning implemented in `BackendService`
- [ ] Device binding to prevent token hijacking
- [ ] Rate limiting on authentication attempts (5 attempts/minute, 5-minute lockout)
- [ ] Session timeout enforcement (configurable, default 8 hours)
- [ ] Audit logging for all security events
- [ ] Jailbreak detection (optional, with graceful degradation)
- [ ] Ephemeral URLSession for authentication flows

### Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. Do NOT create a public GitHub issue
2. Contact the security team directly
3. Provide details but no PoC code
4. Allow time for remediation before disclosure

### Security Checklist (Pre-Deployment)

- [ ] All secrets removed from source code
- [ ] HTTPS enforced in production
- [ ] Certificate pinning configured
- [ ] Audit logging enabled and tested
- [ ] Session timeout configured appropriately
- [ ] Rate limiting enabled
- [ ] Keychain configured with `ThisDeviceOnly`
- [ ] Single App Mode / Guided Access enabled
- [ ] MDM profiles deployed
- [ ] Physical security in place

### Data Classification

| Data Type | Classification | Handling |
|-----------|---------------|----------|
| Badge ID (raw) | PII | Never log or store |
| Badge ID (masked) | Internal | Hash before audit |
| User ID | PII | Hash before audit |
| Session Token | Secret | Keychain only |
| Persona Data | Internal | Encrypted at rest |
| Audit Logs | Internal | Retained 90 days |

### Dependency Security

- Regularly run `npm audit` or `bun audit`
- Keep dependencies up to date
- Review dependency changes before updating
- Use Dependabot for automated updates

### Mobile Device Management (MDM)

- MDM payload should enforce:
  - Password policies
  - App allow-listing
  - Network restrictions
  - Remote wipe capability

---

*Last Updated: 2026-02-17*
