# Codex Complete → Manual-Only Cutover Checklist

Date: 2026-04-07  
Repository: `DanFashauer/DEV`

## Current assessment

Codex-side launch assets are in place for MVP launch motion:
- MVP contract
- one-page landing page direction
- launch checklist
- founder one-pager
- outreach template(s)
- about/company copy
- early-access response template
- sales/discovery script

The remaining work is primarily repository hygiene and founder-led manual execution.

## Immediate cleanup step (GitHub)

### 1) Close PR #72

PR #72 (`Tighten homepage CTA and Intune/Entra positioning`) should be closed to remove a competing homepage variant and keep one launch direction on `main`.

Suggested close comment:

> This PR is being closed because the homepage/CTA direction has already been covered by merged work on main, including the one-page landing page and the lighter early-access CTA/contact path.
>
> This branch now represents an alternate homepage variant rather than a remaining required launch change, so closing it keeps the repo state clean and avoids duplicate homepage directions.

## Codex complete criteria

Mark Codex work complete when all are true:

- [ ] PR #72 is closed.
- [ ] No other open PRs are required for launch-critical homepage behavior.
- [ ] Launch docs exist and are internally consistent on MVP scope.
- [ ] CTA/contact path on production homepage is the single intended path.

## Manual-only execution checklist (founder)

### Business setup
- [ ] Domain purchase completed.
- [ ] Company email provisioned on domain.
- [ ] LLC formation path selected and filed.
- [ ] Business bank account opened (or in final onboarding).

### Launch distribution
- [ ] LinkedIn teaser published.
- [ ] First design-partner outreach batch sent.
- [ ] Outreach follow-ups scheduled.

### Pipeline operations
- [ ] Discovery calls booked from first outreach cohort.
- [ ] Discovery notes captured using the sales/discovery template.
- [ ] Pilot candidate accounts identified with clear success metrics.

## 7-day operating cadence after cutover

- **Daily**: review inbound leads, respond, and schedule next calls.
- **Twice weekly**: run discovery calls and score opportunities.
- **Weekly**: summarize funnel metrics (responses, meetings, pilot candidates, blockers).
- **End of week**: adjust messaging based on objections and conversion points.

## Definition of done for this phase

You are in true manual-only mode when:
- all launch-critical Codex tasks are done,
- repo PR noise is cleared (including PR #72), and
- execution depends on founder outreach/sales follow-through rather than new code/doc generation.
