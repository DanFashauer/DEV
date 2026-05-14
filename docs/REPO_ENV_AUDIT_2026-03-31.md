# Repository + Environment Audit (2026-03-31)

## Historical status note

This audit is retained as dated environment evidence. Use `docs/READINESS_HYGIENE_STATUS.md` and `docs/ROADMAP.md` for current readiness priorities and re-check code before acting on historical findings.

## Scope
This audit covers:
- Local execution environment sanity.
- Dependency/bootstrap reliability.
- Build/test readiness.
- CI/workflow control posture.
- Repository hygiene issues that can block delivery.

## High-priority issues

### 1) Dependency bootstrap is currently blocked in this environment (P0)
**What was observed**
- `npm ci` failed with a `403 Forbidden` while fetching `eslint-config-next` from `registry.npmjs.org`.
- Because dependency install fails, `npm run lint` and `npm run typecheck` are not actionable as quality signals in this environment.

**Why this matters**
- No reliable local validation pipeline can run if package installation is blocked.
- This can hide regressions and slow incident response.

**Recommended actions**
1. Confirm whether outbound registry access is intentionally restricted.
2. If restricted, configure an internal npm mirror/proxy and document it in setup docs.
3. Add a bootstrap doctor check (`npm ping`/registry reachability) to fail fast with clear remediation.

---

### 2) Package-manager story is inconsistent across docs, scripts, and CI (P1)
**What was observed**
- README onboarding says `npm install` and `npm run ...`.
- CI workflows primarily use Bun (`bun install`, `bun run ...`).
- Repository includes both `package-lock.json` and `bun.lock`.

**Why this matters**
- Mixed package manager usage increases non-reproducibility risk.
- Different lockfiles can drift and produce environment-specific behavior.

**Recommended actions**
1. Choose one primary package manager for CI + local dev (Bun or npm).
2. Keep one canonical lockfile and remove the other.
3. Update README and test guides to match the canonical workflow.

---

### 3) Runtime/toolchain versions are not pinned for contributors (P1)
**What was observed**
- No `.nvmrc`, `.node-version`, or `.npmrc` was present.
- CI uses `bun-version: latest`, which can introduce moving-target behavior.

**Why this matters**
- Environment drift can create "works on my machine" failures.
- Using `latest` in CI can break pipelines unexpectedly when upstream releases change behavior.

**Recommended actions**
1. Add explicit Node and Bun version pinning for local + CI.
2. Replace `bun-version: latest` with a specific tested version in workflows.
3. Add a short compatibility matrix in docs.

---

### 4) Workflow automation has broad write-level behavior that should be revalidated (P1)
**What was observed**
- Auto-merge workflow has top-level `contents: write` and `pull-requests: write` permissions.
- Auto-approve flow can auto-approve and auto-merge labeled PRs after checks.

**Why this matters**
- Automation blast radius is higher when write permissions are broad.
- Mislabeling or policy gaps can increase accidental merge risk.

**Recommended actions**
1. Narrow permissions at job-level where possible.
2. Require branch/path/actor safeguards for auto-merge flows.
3. Ensure protected branch rules require human review for sensitive paths.

---

## Medium-priority issues

### 5) Minor environment warning indicates npm config drift (P2)
**What was observed**
- npm emits: `Unknown env config "http-proxy"`.

**Why this matters**
- Not currently blocking, but indicates stale or misnamed environment configuration that may break in a future npm major release.

**Recommended actions**
1. Identify where `http-proxy` is set (shell profile, CI env, container image).
2. Replace with supported npm config keys.

---

## Existing codebase risk items still worth tracking
The repo already has an explicit hardening backlog in `docs/REPO_REVIEW_NEXT_STEPS_2026-03-30.md` (default-key/default-secret fallback cleanup, unknown-posture gating, auth-policy consolidation). These should stay prioritized after environment bootstrap reliability is restored.

## Suggested execution order
1. Restore deterministic dependency bootstrap.
2. Unify package manager and lockfile strategy.
3. Pin toolchain versions.
4. Re-tighten automation permissions and merge policy safeguards.
5. Resume P0 security-hardening backlog work.
