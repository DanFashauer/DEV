# Auto-Approve System Setup

This document explains how to set up the GitHub App for automatic PR approval.

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

---

## How It Works

### Policy Rules

The policy gate enforces:

1. **Label Requirement**: PR must have `automerge` label
2. **Author Allowlist**: Only `DanFashauer` and `kilo-code-bot[bot]` can trigger auto-approve
3. **Base Branch**: Only merges to `main` or `release` branches
4. **High-Risk Paths**: Changes to sensitive paths require justification in PR body:
   - `.github/workflows/**`
   - `src/app/api/**`
   - `src/lib/backend/validation.ts`
   - Security-related files

### Workflow Flow

```
PR opened/updated
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

### Justifying High-Risk Changes

If your PR touches high-risk paths, include this in your PR description:

```markdown
Policy: Updated .github/workflows to fix path filter deadlock by including
workflow files in the paths configuration. This enables CI to run on workflow-only PRs.
```

---

## Testing the System

1. Create a test PR with:
   - The `automerge` label
   - Changes to non-high-risk files
   - Author: DanFashauer

2. Watch the "Auto-Approve" workflow run

3. If it passes, you should see:
   - An approval comment
   - Auto-merge enabled
   - PR auto-merged

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
