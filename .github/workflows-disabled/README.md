# Disabled Workflow Archive

These workflows are intentionally disabled during the controlled-demo/manual-review phase:
- `auto-approve.yml`
- `auto-merge.yml`

Do not restore these workflows until branch protection, labels, app permissions, and merge policy are reviewed.

If these workflows are restored later, they must be updated to use valid `pull_request` context or explicit `workflow_dispatch` inputs.
