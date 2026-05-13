# SignalGrid Integration Priorities

SignalGrid integrates by consuming identity/posture/context signals, making a decision, and coordinating downstream actions. Current integration language should distinguish demo simulation from validated customer integrations.

## Current simulated/demo integrations

The current repository can demonstrate integration behavior through deterministic demo flows and local payload previews for:

- Badge/session-start events.
- Device posture fixtures and telemetry-store reads.
- NAC-style quarantine/action records.
- SIEM-style security event records.
- ITSM-style ticket/action records.
- Demo media and storyboard outputs.

These are useful for explaining the control loop, but they should not be described as live production integrations unless connected and validated in a target environment.

## First real integration targets

Prioritize the smallest integration set needed to prove a pilot workflow:

1. **Identity / badge source** — confirm who is requesting access and map badge/session context to a user.
2. **UEM/MDM or endpoint posture source** — provide fresh compliant, non-compliant, or unknown posture signals.
3. **Audit/event sink** — preserve decision evidence in a customer-approved log destination.
4. **ITSM workflow** — create reviewable tickets or tasks for denied or remediated sessions.
5. **NAC or enforcement target** — only after policy, rollback, and safety boundaries are explicit.

## Later integration targets

After the first pilot workflow is stable, consider:

- Additional MDM/UEM providers.
- Endpoint security and DEX telemetry providers.
- SIEM/SOAR enrichment and correlation workflows.
- HRIS or workforce context sources where appropriate and approved.
- Location/RTLS systems for shared-device return or zone context.
- Multiple enforcement systems for complex frontline environments.

## Integration safety boundaries

- Do not use production credentials in demos.
- Do not call real webhooks from browser demo or media capture flows.
- Require explicit signing secrets and scoped credentials for shared/staging environments.
- Prefer read-only or audit-only pilot modes before write/enforcement actions.
- Use least-privilege service accounts and short rollback paths.
- Keep high-risk actions disabled until policy ownership and approval gates are clear.
- Record integration actions with enough detail for post-demo or post-pilot review.

## Pilot sequencing recommendation

Start with identity, posture, and audit evidence. Add ticketing next. Add enforcement only when customer stakeholders agree on policy, blast radius, rollback, and success metrics.
