# AGENT_SECURITY_GUARDRAILS

Minimum security guardrails for any AI/agent/automation workflow in SignalGrid (MVP scope).

## 1) Threat model
Primary risks this policy addresses:
- Unsafe or unintended tool execution (destructive writes, privilege misuse).
- Secret leakage through prompts, logs, or tool arguments.
- Incorrect automated actions caused by incomplete/incorrect inputs.
- Cross-environment impact (dev actions affecting staging/prod).

Assumption: authentication context and upstream signals may be wrong, stale, or incomplete.

## 2) Core guardrail principles
- **Read-only by default:** agents/tools start with no write or destructive capability.
- **Least privilege:** use minimum-scoped identities/tokens for each workflow.
- **Explicit policy enforcement:** actions execute only when policy checks or approval gates pass.
- **Deterministic interfaces:** use structured tool schemas with strict argument validation.
- **Constrained execution:** allowlist commands, domains, repositories, and actions where feasible.
- **Defense in depth:** combine policy checks, isolation, and audit logging.

## 3) Secret handling rules
- **No raw secrets in prompts** (system, developer, or user messages).
- Secrets must come from approved secret stores/injected runtime mechanisms only.
- Redact secrets/tokens/credentials from logs, traces, and error payloads.
- Do not persist secrets in artifacts, chat transcripts, code comments, or docs.
- Rotate and revoke any credential suspected to be exposed.

## 4) Tool/action safety rules
- Tools must define structured input schemas, type checks, and required-field validation.
- Reject unexpected parameters and out-of-policy values.
- Enforce allowlists for executable commands, target domains, repos, and API routes where possible.
- High-risk capabilities (write/delete/execute external side effects) must be disabled by default.
- Block arbitrary shell execution and unconstrained remote calls in default agent modes.

## 5) Approval boundaries
- **Write/destructive actions are behind explicit approval** (human and/or policy engine gate).
- Approval records must include requester, scope, reason, and expiration.
- Time-bound approvals; no permanent blanket approvals for destructive operations.
- Emergency overrides require documented incident rationale and post-action review.

## 6) Execution isolation
- Run risky actions in sandboxed, ephemeral environments.
- Isolate filesystem, network, and credentials to least-required scope.
- Prevent direct production mutation from exploratory/analysis workflows.
- Clean up ephemeral environments and temporary credentials after each run.

## 7) Logging and audit requirements
- **Full logging of tool calls and outcomes**: timestamp, actor, inputs (redacted), decision, result.
- Log policy decisions (allow/deny), approvals, and execution context.
- Preserve immutable audit trails for security review and incident response.
- Monitor denied-action spikes, unusual tool usage, and repeated validation failures.

## 8) Environment separation (dev/staging/prod)
- Separate identities, credentials, and policy rules per environment.
- Default execution target is development; promotion to staging/prod requires explicit gating.
- No shared long-lived credentials across environments.
- Production actions require stricter approval and observability than dev/staging.

## 9) Incident response and credential rotation
- On suspected compromise: stop automation path, revoke affected credentials, and rotate tokens/keys.
- Scope and contain impact by environment and integration boundary.
- Re-run with reduced privileges after remediation and policy validation.
- Document incident timeline, root cause, and guardrail updates before re-enabling full workflow.

## 10) SignalGrid-specific application
- In MVP, LLMs may assist with **summarization, classification, and recommendation** only.
- A policy engine or explicit approval gates must decide whether recommended actions execute.
- SignalGrid must assume authentication context and upstream signals can be incorrect or incomplete; fail closed for uncertain or high-risk actions.

## 11) MVP boundary and future-compatible design
- **Current MVP decisioning**: trusted upstream signals at session start, with remediation/re-evaluation and audited allow/deny outcomes.
- **Out of current scope**: broad autonomous actions, deep telemetry ingestion, full observability replacement, or continuous cross-layer enforcement.
- Design future signal expansion as adapters into a normalized decision context (e.g., identity/device/session/runtime/policy), so V2 input growth does not require policy-engine rewrites.
- Any V2/V3 expansion remains subject to all guardrails in this document; capability growth must not bypass approval, isolation, or audit requirements.

---
This document defines the minimum baseline. New automation must meet or exceed these guardrails before gaining broader action permissions.
