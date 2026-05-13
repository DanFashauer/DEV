# SignalGrid Security Policy

## Security baseline

This document outlines the security requirements and operating assumptions for SignalGrid, a runtime trust-decisioning and orchestration platform for shared and mobile work environments.

### No secrets in repository

- **Never commit** API keys, tokens, certificates, signing secrets, private keys, customer credentials, or production data to this repository.
- Use environment variables or an approved secrets manager for all sensitive runtime configuration.
- Treat `BACKEND_SIGNING_SECRET`, `INTEGRATION_SIGNING_SECRET`, `ADMIN_API_KEY`, OIDC configuration, Redis credentials, and customer integration credentials as production secrets.
- Use separate demo, staging, pilot, and production secrets; never reuse demo secrets for customer environments.
- Do not enter real customer secrets or regulated production data into demo flows.

### HTTPS and signed API paths

- All production network communication **must** use HTTPS with TLS 1.2 or higher.
- Production device, session, event, and integration ingestion paths must require HMAC signatures where supported by the runtime API contract.
- HMAC verification should include timestamp and nonce protections to reduce replay risk.
- Signing secrets must be rotated when exposure is suspected and should be rotated on a defined customer or operator cadence.
- HTTP Strict Transport Security (HSTS) headers should be enforced by the production edge or hosting layer.
- Certificate pinning may be required for future managed mobile clients or high-assurance customer deployments.

### Runtime decisioning and fail-closed behavior

- SignalGrid trust decisions should be explicit, deterministic, and auditable: `ALLOW`, `DENY`, or `STEP_UP`.
- Production policy evaluation must fail closed for missing required inputs, invalid signatures, expired timestamps, replayed nonces, unknown devices, malformed payloads, and unavailable critical trust dependencies.
- Demo and simulation paths may return representative decisions for validation, but they must be clearly separated from production mode.
- Destructive or enforcement-capable integrations must remain disabled unless explicitly configured and authorized for the target environment.

### Demo and simulated API safety

- Demo outputs, seeded personas, simulated device posture, badge events, location reports, and integration responses are simulated unless the environment is explicitly configured otherwise.
- Demo mode is for evaluation, validation, and storytelling only; it is not a production security boundary.
- Demo environments must not collect, store, or transmit real customer secrets, regulated production data, or live credentials.
- Production deployments must keep `DEMO_MODE=false`, `ENABLE_DEV_BYPASS=false`, and `ENABLE_DESTRUCTIVE_ACTIONS=false` unless a signed customer change request explicitly authorizes a different setting.

### Logging, auditability, and event traceability

- **Never log** raw secrets, signing keys, session tokens, customer credentials, raw badge identifiers, or unnecessary PII.
- Audit and event records should use masked, hashed, or opaque identifiers when possible.
- Security-relevant events should be traceable across request receipt, signature validation, policy evaluation, decision output, integration action, and operator/customer review.
- Audit trails should preserve decision inputs and outcomes at an appropriate level of detail without exposing secrets or sensitive payload contents.
- Log levels should be configurable and production logging should avoid debug-level sensitive context.

Example masking pattern:

```ts
// Instead of logging a full badge, token, or customer identifier:
logger.info({ badgeSuffix: badgeId.slice(-4) }, "Badge event received");
```

### Agent and operator guardrails

- Agents, scripts, and operators must not bypass production authentication, signing, or policy checks outside an explicitly approved break-glass procedure.
- Automation should prefer read-only or advisory operation unless enforcement has been reviewed, tested, and authorized.
- Generated reports, demo artifacts, and screenshots must be reviewed before sharing externally to avoid leaking internal paths, secrets, or customer-specific information.
- Use least-privilege access for admin APIs, CI jobs, deployment tokens, and integration credentials.

### Threat model assumptions

SignalGrid is designed for deployments where:

1. **Identity context exists**: Customer identity, role, or badge systems provide user/session signals.
2. **Device context exists**: Device posture, enrollment, or managed-state signals are available from customer systems or approved integrations.
3. **Runtime context matters**: Location, shift, risk, operational state, and workflow context can change the access decision.
4. **Enforcement is downstream**: SignalGrid orchestrates or advises connected systems rather than replacing IAM, UEM/MDM, NAC, SIEM, DEX, ITSM, or endpoint controls.
5. **Auditability is required**: Customers and operators need decision receipts, event traces, and integration evidence.
6. **Demo paths are isolated**: Simulated data and demo modes are not used as production controls.

### Security requirements

- [ ] No committed secrets, credentials, production customer data, or regulated sample data.
- [ ] HTTPS enforced for production traffic.
- [ ] HMAC request signing enabled and validated on production ingestion/API paths that require it.
- [ ] Timestamp, nonce, and replay protections enabled for signed requests.
- [ ] Fail-closed handling verified for invalid signatures, missing context, unknown devices, dependency failures, and malformed payloads.
- [ ] Audit/event traceability tested from request through decision and integration action.
- [ ] Rate limiting enabled for authentication, session, ingestion, and admin-sensitive paths.
- [ ] Admin access protected by OIDC or a documented temporary break-glass control.
- [ ] Demo bypasses and destructive actions disabled in production.
- [ ] Dependency vulnerability scanning and update review enabled.

### Security checklist before pilot or production deployment

- [ ] All environment variables and secrets provisioned through approved secure channels.
- [ ] Production `.env` files excluded from source control and artifact uploads.
- [ ] `DEMO_MODE=false`, `ENABLE_DEV_BYPASS=false`, and `ENABLE_DESTRUCTIVE_ACTIONS=false` confirmed.
- [ ] Signing secrets generated with sufficient entropy and documented rotation procedures.
- [ ] HMAC happy-path, invalid-signature, stale-timestamp, and replay tests passed.
- [ ] Audit logging enabled and reviewed for redaction quality.
- [ ] Customer-specific retention, export, and deletion expectations documented.
- [ ] Incident rollback and signing-secret rotation process rehearsed.
- [ ] Dependency updates reviewed and release gates passed.

### Data classification

| Data Type | Classification | Handling |
| --- | --- | --- |
| Signing secrets and API keys | Secret | Store only in approved secrets systems; never log. |
| Session tokens and admin JWTs | Secret | Never log; enforce expiration and least privilege. |
| Raw badge or user identifiers | Sensitive/PII | Avoid storing; mask or hash for audit where possible. |
| Device identifiers and posture | Customer internal | Minimize collection; retain only what supports decisions and audit. |
| Policy decisions and receipts | Customer internal | Preserve for audit; redact sensitive inputs. |
| Demo personas and simulated outputs | Demo data | Clearly label as simulated; do not mix with customer production data. |
| Audit/event logs | Customer internal | Protect at rest and in transit; retain according to customer/operator policy. |

### Dependency security

- Run `npm audit` or an equivalent dependency scanner before release when feasible.
- Keep dependencies current through reviewed update pull requests.
- Review lockfile changes and transitive dependency risk before merging updates.
- Use Dependabot or comparable automation for update visibility.
- Track security findings to remediation or documented risk acceptance.

### Future/mobile-client considerations

The repository may include iOS prototype or mobile-client artifacts. The following controls apply to future mobile-client work and high-assurance deployments, not necessarily to the current web/API MVP:

- Store mobile tokens and device-bound secrets in the platform keychain or secure enclave where supported.
- Use managed-device controls such as MDM/UEM profiles, app allow-listing, remote wipe, and supervised mode where customer policy requires them.
- Consider certificate pinning for managed production mobile clients.
- Consider jailbreak/root detection with graceful degradation and customer-approved user messaging.
- Consider Single App Mode, Guided Access, or equivalent kiosk controls for supervised shared-device deployments.

### Reporting security issues

If you discover a security vulnerability, please report it responsibly:

1. Do **not** create a public GitHub issue.
2. Contact the project maintainers or security owner directly through the approved private channel.
3. Provide enough detail to reproduce and assess the issue, but avoid sharing exploit code publicly.
4. Allow reasonable time for triage and remediation before disclosure.

---

*Last updated: 2026-05-12*
