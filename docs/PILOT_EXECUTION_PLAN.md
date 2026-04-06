# Pilot-First Execution Plan (Post-PR #58)

_Last updated: 2026-04-02_

## Current branch health snapshot

Validation was run from the available local branch (`work`). A local `main` branch is not present in this checkout, so the results below reflect the current working branch state.

- `npm run typecheck`: **failed** (TypeScript parse errors in multiple routes/pages).
- `npm run lint`: **failed** (same parsing failures as typecheck).
- `bun run build`: **failed** (module resolution failures plus existing compile errors).

## Build now (top 5)

1. **Recover TypeScript syntax integrity in priority API/page files.**
   - Fix parse breaks in:
     - `src/app/api/admin/integrations/uem/enrollment/route.ts`
     - `src/app/api/admin/integrations/uem/enrollment/schema.ts`
     - `src/app/api/session/start/route.ts`
     - `src/app/api/session/start/services/posture.ts`
     - `src/app/demo/page.tsx`
     - `src/app/investor-deck/page.tsx`
     - `src/app/page.tsx`
2. **Restore missing core libraries referenced by admin audit and badge routes.**
   - Resolve missing modules such as `@/lib/adminAuth`, `@/lib/auditLedger`, and `@/lib/badgeRegistry`.
3. **Re-establish clean baseline CI gates on branch with `typecheck`, `lint`, and `build`.**
   - Keep this as the minimum merge gate before pilot-facing feature work.
4. **Stabilize demo/session startup path.**
   - Prioritize `src/app/api/session/start/*` and `src/app/demo/page.tsx` to support pilot walkthrough reliability.
5. **Document branch sync prerequisite for all local validation tasks.**
   - Require local tracking branch for `main` (or documented equivalent) before issuing release-health claims.

## Validate now

After each Build-now item lands:

1. Run `npm run typecheck`.
2. Run `npm run lint`.
3. Run `bun run build`.
4. Smoke check key flows:
   - Landing page loads.
   - Demo page loads.
   - Session start endpoint basic request path.
   - Admin audit endpoints compile and respond.

## Harden next (top 5)

1. **Add regression tests for parser-sensitive TS files** that recently broke.
2. **Add import/path integrity checks** (e.g., lint rule or script) to catch missing `@/lib/*` modules pre-build.
3. **Add API contract tests** for admin audit export/verify and badge lookup routes.
4. **Add demo reliability checks** (scripted smoke path for demo + session start).
5. **Add branch health automation** to enforce pilot gating (`typecheck`, `lint`, `build`) prior to PR merge.

## Re-test loop

Use this loop continuously:

1. Build change.
2. Run validation gate (`typecheck`, `lint`, `build`).
3. If fail, patch immediately and rerun.
4. If pass, run targeted smoke/regression checks.
5. Merge only when all checks pass.

## Pilot exit criteria

Pilot is considered complete when all are true:

- Zero blocking errors in `typecheck`, `lint`, and `build` on the release branch.
- Core pilot flows are demonstrably stable (landing, demo, session start, admin audit routes).
- At least one full regression pass succeeds after hardening changes.
- Known issues list is explicitly triaged into:
  - must-fix pre-pilot-close,
  - post-pilot backlog,
  - intentionally deferred.

## Parked ideas (post-pilot only)

The website and broader marketing/final-phase polish remain **post-pilot/final-phase work**.

Examples to park until pilot exit:

- Major design system refreshes.
- Broad investor-deck narrative expansion beyond pilot proof points.
- Non-essential UX polish unrelated to pilot success metrics.
- New speculative integrations not required for pilot validation.
- Long-horizon platform enhancements without pilot impact.
