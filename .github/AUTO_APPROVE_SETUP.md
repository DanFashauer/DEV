# Auto-Approve System Setup - HARDENED VERSION

This document explains how to set up the GitHub App for automatic PR approval with security hardening.

## ⚠️ SECURITY CONSTRAINTS

The hardened system NEVER auto-approves:
- Changes to `.github/**` (workflows, policies, scripts)
- Changes to the policy-gate script itself
- Changes to this setup document

These **always require human approval** to prevent repo takeover via workflow manipulation.

---

## Overview

The auto-approve system consists of:

1. **Policy Gate** (`.github/scripts/policy-gate.ts`) - Validates PRs against defined rules
2. **Auto-Approve Workflow** (`.github/workflows/auto-approve.yml`) - Submits approval reviews

## Prerequisites

- Admin access to the repository
- Ability to create a GitHub App

---

## Step 1: Create GitHub App

1. Go to: https://github.com/settings/apps/new

2. Fill in the form:

| Field | Value |
|-------|-------|
| **GitHub App name** | `dev-autoreviewer` (or similar unique name) |
| **Homepage URL** | `https://github.com/DanFashauer/DEV` |
| **Webhook URL** | Leave empty (not needed) |
| **Webhook active** | Unchecked |

3. **Permissions** (minimum required):

| Permission | Access |
|------------|--------|
| Pull Requests | Read and write |
| Checks | Read |
| Contents | Read |
| Metadata | Read |

4. Click **Create GitHub App**

---

## Step 2: Install the App

1. On your new GitHub App page, click **Install**
2. Select "Only select repositories"
3. Choose the `DEV` repository
4. Click **Install**

---

## Step 3: Get Credentials

After installation, you'll need these values:

1. **App ID** - Found on the app's main page
2. **Installation ID** - Found in the URL when you install the app (or via API)
3. **Private Key** - Click **Generate a private key** on the app page

---

## Step 4: Configure Repository Secrets

Add these to your repository (Repository Settings → Secrets and variables → Actions):

### Secrets

| Secret Name | Value |
|-------------|-------|
| `APP_PRIVATE_KEY` | The private key you generated (PEM format) |

### Variables

| Variable Name | Value |
|---------------|-------|
| `APP_ID` | The App ID from step 3 |
| `APP_INSTALLATION_ID` | The installation ID from step 3 |

---

## Step 5: Add Automerge Label

1. Go to: https://github.com/DanFashauer/DEV/labels
2. Click **New label**
3. Create:
   - **Name**: `automerge`
   - **Description**: "Auto-approved when policy passes"
   - **Color**: `0e8a16` (green)

---

## Step 6: Update Branch Protection

1. Go to: https://github.com/DanFashauer/DEV/settings/branches
2. Edit the `main` branch rule (or create one)
3. Ensure:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging
   - ✅ Allow auto-merge (important!)

**IMPORTANT - Branch Protection Settings:**
- If your ruleset requires "approvals from CODEOWNERS" or specific users, the GitHub App must be added to CODEOWNERS or the ruleset must allow "the actor" (the App) to approve.
- The auto-approve will only work if the App's approval satisfies the ruleset's approval requirement.

---

## What Gets Auto-Approved

### ✅ ALLOWED (auto-approve when policy passes):
- Code changes in `src/` (except api routes)
- iOS app changes (except security services)
- Documentation changes
- Configuration changes (non-.github)

### ❌ NEVER AUTO-APPROVED (always require human):
- Anything in `.github/` directory
- Workflow files
- Policy gate script
- This setup document

---

## Policy Rules

The policy gate enforces:

1. **Label Requirement**: PR must have `automerge` label
2. **Author Allowlist**: Only `DanFashauer` and `kilo-code-bot[bot]` can trigger auto-approve
3. **Base Branch**: Only merges to `main` or `release` branches
4. **Forbidden Paths**: Changes to `.github/**` or policy-gate ALWAYS require human approval
5. **Security Justification**: Changes to security-related paths must include "Justification:" in PR body:
   - `src/app/api/**`
   - `src/lib/backend/**`
   - `ios/EnterpriseShell/Services/Security*.swift`
   - `ios/EnterpriseShell/Services/OIDCAuthService.swift`
   - `ios/EnterpriseShell/Services/KeychainService.swift`

### PR Body Format for Security Changes

If your PR touches security-related paths, include:

```markdown
## Security Review

Justification: [Explain why this change is safe - what threat does it address? How did you verify it?]

Example:
Justification: Adding input validation to prevent SQL injection in the session API endpoint.
```

---

## Workflow Flow

```
PR opened/updated
       ↓
   ┌─────────────┐
   │ Ignore list │───If .github/** changed───→ HUMAN REVIEW REQUIRED
   └─────────────┘
       ↓
Policy Gate runs
       ↓
    ┌───┴───┐
    │ Pass? │───No───→ Skip (comment explaining why)
    └───┬───┘
        │Yes
        ↓
Wait for CI checks
       ↓
    ┌───┴───┐
    │ Pass? │───No───→ Wait more
    └───┬───┘
        │Yes
        ↓
GitHub App submits APPROVE review
       ↓
Enable auto-merge
       ↓
PR auto-merges when all checks pass
```

---

## Testing the System

1. Create a test PR with:
   - The `automerge` label
   - Changes to non-.github files (e.g., src/app/page.tsx)
   - Author: DanFashauer or kilo-code-bot[bot]

2. Watch the "Auto-Approve" workflow run

3. If it passes, you should see:
   - An approval comment
   - Auto-merge enabled
   - PR auto-merged

**Test .github protection separately:**
1. Create a PR that modifies `.github/workflows/` - it should be SKIPPED
2. The workflow should comment explaining human approval is required

---

## Troubleshooting

### "App not found" error
- Verify `APP_ID` is correct in repository variables

### "Installation not found" error
- Verify `APP_INSTALLATION_ID` is correct
- Re-install the app if needed

### "Private key invalid" error
- Regenerate the private key
- Ensure `APP_PRIVATE_KEY` secret is set correctly (must include `-----BEGIN RSA PRIVATE KEY-----`)

### Workflow not triggering
- Check that the branch protection rules include the workflow
- Verify the PR has the `automerge` label

### Auto-approve not working despite policy passing
- **Check branch protection rules**: If rules require "approvals from CODEOWNERS" or specific users, the GitHub App must be authorized to approve
- Add the GitHub App to CODEOWNERS file: `@app/dev-autoreviewer` (replace with your app name)
- Or update ruleset to allow "the actor" to approve

---

## Security Model

| Threat | Protection |
|--------|------------|
| Workflow self-approval | `paths-ignore: .github/**` in workflow trigger |
| Policy gate bypass | Script in `FORBIDDEN_PATHS` - never auto-approves .github |
| Token theft | GitHub App with minimal permissions |
| Privilege escalation | Least-privilege permissions in workflow |
| Blind approval | All checks must pass; explicit decision log emitted |

---

## What to Click Checklist

### GitHub App Setup:
- [ ] Create GitHub App at github.com/settings/apps/new
- [ ] Set permissions: PRs (read/write), Checks (read), Contents (read), Metadata (read)
- [ ] Install app to DEV repository
- [ ] Copy App ID → repo variable `APP_ID`
- [ ] Copy Installation ID → repo variable `APP_INSTALLATION_ID`
- [ ] Generate private key → repo secret `APP_PRIVATE_KEY`

### Repository Settings:
- [ ] Create `automerge` label
- [ ] Update main branch protection:
  - [ ] Require PR reviews
  - [ ] Require status checks to pass
  - [ ] Allow auto-merge
  - [ ] **IMPORTANT**: Allow App to satisfy approval requirement (add to CODEOWNERS or update ruleset)

### Test:
- [ ] Create test PR with automerge label
- [ ] Verify auto-approve triggers
- [ ] Verify .github changes are blocked
