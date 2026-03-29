# Pass 2 Cleanup Classification

## Scope
Conservative classification of remaining workflow residue and demo-only assets.

## 1) `.kilocode/**`
- Classification: **safe to delete**
- Reason: workflow metadata/instructions only; not referenced by runtime code.
- Action in this pass: **removed**.

## 2) Demo-only routes/scripts/tests

### Keep in core (currently active workflow)
- `src/app/api/demo/verify/route.ts`
- `scripts/demo-control.ts`
- `scripts/demo-executive.ts`
- `scripts/demo-flow.ts`
- `scripts/demo-seed.ts`
- `scripts/demo-validate.ts`
- `tests/demo/**`

Reason: these are still part of current package scripts and demo validation workflow.

### Isolate as demo-only
- No file moves performed in this pass to avoid script breakage.
- Recommended future step: move to `demo/` namespace with script path updates in same change.

### Safe to delete
- None in this pass (conservative).

## 3) Platform/process residue (including Replit)
- Replit-specific files detected: **none**.
- Additional low-risk residue to remove in this pass: **none**.

## 4) Remaining follow-up after pass 2
- If demo workflows are no longer active, do a dedicated move/rename pass that updates `package.json` scripts atomically.
- Then re-evaluate deletion candidates after one full CI run.
