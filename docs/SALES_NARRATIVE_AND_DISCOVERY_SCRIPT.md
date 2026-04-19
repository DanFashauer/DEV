# Sales Narrative and Discovery Script

## Purpose

This script helps founders, sellers, and technical buyers move from curiosity to an actionable pilot decision quickly.

Use it for:
- founder-led sales calls
- partner qualification calls
- pilot kickoff meetings

## Core Narrative (60–90 seconds)

Most IT and security teams are overloaded by access-risk operations that still require human follow-up. Every manual review creates delay, inconsistency, and ticket backlog.

SignalGrid is a shared-device access and runtime decision platform that sits between authentication and enforcement. At session start, we evaluate identity, device, and session risk, attempt remediation when possible, re-check trust, and return a final access decision with an audit trail before users hit disruption.

We are additive to existing controls: UEM tools show what’s configured, DEX tools show what’s failing, and SignalGrid decides what happens next. The practical outcome is faster decisions, less manual remediation work, and clearer accountability without rip-and-replace.
We launch with frontline shared-device workflows where manual recovery and access friction are highest, then expand into adjacent industries over time.
Today, trust troubleshooting (including certificate, Wi-Fi, or VPN-related access failures) is often manual and fragmented; SignalGrid helps move those operations toward runtime classification, remediation, and outcome control.
Runtime truth matters: we have seen environments that still appear healthy while silently losing the ability to establish new TCP connections after prolonged uptime, forcing manual recovery and disruption.
Authentication proves identity; SignalGrid ensures the system is actually capable of operating before access is granted.
SignalGrid ensures access decisions are based on runtime truth, not stale or incomplete signals.

## Strategic Reframe: Feature vs System

Most teams still implement access like a **feature**:

Access attempt → failure → ticket → troubleshooting → recovery.

SignalGrid treats access as a **runtime system**:

Access attempt → detect risk → decide → remediate → verify outcome.

This matters because real environments are stateful and failure-prone. Resolution has to be built into the flow, not bolted on after disruption.

## Positioning Statement

SignalGrid helps IT and security teams make shared-device runtime access decisions between authentication and enforcement by resolving identity, device, and session risk before access breaks.

## Board-Level Positioning Option

Most access systems are built like features. SignalGrid treats access as a runtime system, so issues are resolved before they become operational disruptions.

## One-Line Explanation (Buyer-Friendly)

SignalGrid treats access and security as a runtime system, not a static feature.

## Technical Conversation Bridge (Use with senior engineers)

- “Most organizations treat access control like a feature. In production, it behaves like a system problem with state, retries, and failure paths.”
- “SignalGrid adds runtime decision + remediation loops so outcome correctness is maintained when signals are stale, partial, or contradictory.”
- “The goal is not more alerts. The goal is correct access outcomes under real conditions.”

## Ideal Customer Profile (ICP)

### Primary ICP
- Mid-market and enterprise organizations with:
  - Microsoft Intune and Entra in active use
  - 500+ managed endpoints (or rapidly growing device estate)
  - constrained IT/SecOps staffing
  - recurring access, compliance, or remediation bottlenecks

### Strong Signal Triggers
- SLA misses on routine policy or access operations
- manual exception queues and recurring ticket escalations
- security initiatives blocked by operational capacity
- leadership pressure to demonstrate efficiency gains quickly

## Discovery Flow (20–30 minutes)

### 1) Context and Goals (3–5 min)
- “What prompted you to take this conversation now?”
- “If this works, what changes for your team in the next 90 days?”
- “Which metric matters most: cycle time, ticket volume, compliance consistency, or analyst time?”
- “Where does your process still depend on reactive support after users are already impacted?”

### 2) Current Workflow Reality (6–8 min)
- “Walk me through one recurring workflow from trigger to closure.”
- “Where does human intervention happen most often?”
- “How often do exceptions or retries happen?”
- “How do you currently audit who approved what and why?”
- “Where do authentication checks end and enforcement begin today?”
- “What parts of remediation are outside the access flow today?”
- “Where do failures happen because systems disagree in runtime, even though pre-checks looked fine?”

### 3) Risk and Constraints (4–6 min)
- “What is the failure mode you’re most worried about?”
- “What approval boundaries are non-negotiable?”
- “Any integration, change-management, or procurement blockers we should design around?”
- “If we treated this as a system reliability problem, what failure path would you fix first?”

### 4) Pilot Shape (5–8 min)
- “Which one workflow would be highest-value but low-risk for a pilot?”
- “What baseline metric should we compare against?”
- “Who needs to be involved for technical sign-off and business sign-off?”
- “What reduction in post-failure tickets would make this pilot a clear win?”

## Discovery Scorecard

Rate each item from 1 (weak) to 5 (strong):

1. Pain severity (business impact)  
2. Urgency (timeline pressure)  
3. Access to decision-makers  
4. Technical fit (stack + constraints)  
5. Pilot viability within 2–4 weeks  

Interpretation:
- **20–25**: prioritize immediately
- **14–19**: progress with scoped pilot hypothesis
- **<14**: nurture, do not force motion

## Objection Handling

### “We can script this ourselves.”
That can work for isolated tasks. The tradeoff is long-term maintainability, governance, and consistency when ownership changes. We focus on repeatable policy outcomes with clear operating guardrails, not one-off scripts.

### “We can’t risk automation mistakes.”
Agreed. Pilot scope should start with bounded workflows, explicit approvals where needed, and pre-agreed rollback paths. The objective is safe automation with evidence, not blind automation.

### “We already have too many tools.”
Understood. SignalGrid is not a replacement for IAM, UEM, or DEX. The goal is a runtime decision layer that uses your existing tools and minimizes additional operational surface area.

## Pilot Offer Template

A practical pilot should include:
- **Scope**: 1–2 workflows only
- **Duration**: 2–4 weeks
- **Baseline**: current cycle time, manual touches, exception count
- **Success Criteria**: agreed reduction target (for example, 30–50% manual touch reduction)
- **Governance**: named owner, approval model, rollback protocol

### Example Success Criteria
- 40% reduction in manual intervention steps
- 25% faster median turnaround on selected workflow
- full auditability for all pilot actions and approvals

## Call Close Options

Use one clear next step based on call quality:

1. **Technical Deep Dive** (best when technical fit is strong)  
   - include admin/operator stakeholders
2. **Pilot Design Session** (best when urgency is clear)  
   - lock workflow scope and success metrics
3. **Nurture Follow-Up** (best when timing is weak)  
   - send concise recap + re-engagement trigger

## Follow-Up Email Skeleton

Subject: Next step on [workflow] pilot

Hi [Name],

Thanks again for the conversation today. Based on what we discussed, the highest-leverage pilot candidate is **[workflow]** with success measured by **[metric baseline + target]**.

Proposed next step: **[Technical Deep Dive / Pilot Design Session]** with **[stakeholders]** to finalize scope, guardrails, and timeline.

If useful, we can share a draft pilot plan in advance so your team can react asynchronously.

Best,  
[Sender]

## Internal Handoff Notes (after each discovery call)

Capture in CRM:
- problem statement in customer language
- current workflow baseline metrics
- explicit risks and constraints
- pilot candidate and owner
- decision process + timeline
- next meeting objective and date

## Qualification Summary Template

- **Customer**:  
- **Primary Pain**:  
- **Workflow Candidate**:  
- **Baseline**:  
- **Target Outcome**:  
- **Risks/Constraints**:  
- **Decision Group**:  
- **Recommended Next Step**:  
- **Confidence (1–5)**:  

---

Use this document as a living script. Keep wording natural, but keep structure consistent so qualification quality remains high across every conversation.
