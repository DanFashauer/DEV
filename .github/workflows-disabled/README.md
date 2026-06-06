# Archived automation workflows

The workflows in this directory are intentionally archived during the controlled-demo and manual-review phase.
They are preserved for future reference, but they are not active GitHub Actions workflows while they remain outside `.github/workflows/`.

Do not restore these workflows until the repository's branch protection, required labels, GitHub App permissions, and merge policy have been reviewed together.

If an archived workflow is restored, it must use a valid `pull_request` context or explicit `workflow_dispatch` inputs, such as `pr_number`, before it attempts to approve, merge, or otherwise act on a pull request.
