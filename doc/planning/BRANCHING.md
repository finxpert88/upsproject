# Branching Policy

Effective date: 2026-09-15, Asia/Singapore.

This repository uses Git Flow from this date onward. Branch creation, branch
starting points, merge timing, branch deletion, and worktree branch creation are
assigned by the Team Leader only. Team members must not create branches
unilaterally, commit directly to `main` or `develop`, force push, or rewrite
shared history.

## Long-Lived Branches

| Branch | Purpose | Rule |
| --- | --- | --- |
| `main` | Production branch | Keep the existing `main`; do not create `master`. Release and verified hotfix changes merge here only after approval. |
| `develop` | Long-lived development branch | Current and future development tasks run here when assigned by the Team Leader. Members must not create temporary branches unless the user or Team Leader explicitly authorizes that exception. |

## Working Branches

| Pattern | Starting point | Merge target | Rule |
| --- | --- | --- | --- |
| `feature/<name>` | `develop` | `develop` | Do not create by default. Use only when explicitly assigned by the user or Team Leader. |
| `release/<version>` | `develop` | `main`, then back to `develop` | Use only for bug fixes and release preparation after test acceptance. The release merge into `main` receives the release tag. |
| `hotfix/<name>` | `main` | `main`, then `develop` | Use for urgent production fixes. If a release branch exists, synchronize the necessary fix there too. |
| `test/qa` | Optional | Optional | Not established at this time. |

## Merge And Review Rules

- Each requirement, design, code, and test commit must reference the relevant RTM
  requirement and acceptance IDs when applicable.
- Existing approved FSD, documentation, and static DEMO review does not equal FIN
  production acceptance.
- A reviewed documentation or DEMO snapshot may be integrated to `develop`
  without becoming a production release.
- `main` receives only release or hotfix merges approved by the Team Leader.
- No force push, destructive reset, or shared-history rewrite is allowed without
  explicit Team Leader approval.
- Shared checkouts must not be switched or repointed except inside the branch
  action assigned by the Team Leader.

## Current Branch Ledger

| Branch | Purpose | Starting point | Owner | Status | Merge target | Authorization source | Related requirement / acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `main` | Long-lived production branch | Initial repository history | Team Leader | Active, unchanged in this initialization | N/A | Existing repository default branch | Production acceptance only; current FSD/DEMO review is not production certification |
| `develop` | Long-lived development branch | `origin/main` at `bccdc4f9f97c7591ac7aa8db0729ff7be629c213` | Team Leader | Active current development branch; integrates reviewed revision 9 baseline, branch governance, and DEV-01-r1 POD delivery | Future `release/<version>` branches | User and Team Leader delegation, 2026-09-15 | RTM baseline plus DEV-01-r1 FT-01 / AC-02 / SF-02 minimum slice |
| `feature/fsd-r4-static-demo` | Reviewed FSD/documentation/static DEMO work through revision 9 | Historical feature branch from `main` lineage | Team Leader / assigned implementation work | Integrated into `develop`; eligible for cleanup after ancestor and worktree-use verification | Already integrated into `develop` by normal merge | User review approval and Team Leader delegation | PRD/FSD v0.1 revision 9, RTM and validation records under `doc/validation/` |
| `feature/ups-pod-implementation` | DEV-01-r1 single-POD implementation | `origin/develop` at `3cdc8f5675a0cd32856597d97932f5d5d38ae71a` | Team Leader / assigned implementation work | To be merged into `develop` then cleaned after ancestor and worktree-use verification | `develop` | Leader delegation, 2026-09-15 | FT-01 / AC-02 / SF-02 minimum slice; evidence in `docs/development/DEV-01-r1/` and `docs/development/DEV-01-independent/` |

## Tag Ledger

| Tag | Commit | Meaning | Production release? |
| --- | --- | --- | --- |
| `20260915005529` | `0f7af8b3eba31da027799d5cb98bf9883801cd9f` | Reviewed FSD, documentation, and static DEMO snapshot as of 2026-09-15 00:55:29 Asia/Singapore | No |
| `26091422` | `457cfc8419cdad65b07b35c011fb1d43d486ecde` | Historical baseline before FSD revision 4 static demo work | No |

## Current Branch Graph

```mermaid
gitGraph
  commit id: "73ff01a"
  commit id: "bccdc4f main"
  branch feature/fsd-r4-static-demo
  checkout feature/fsd-r4-static-demo
  commit id: "457cfc tag 26091422"
  commit id: "..."
  commit id: "07456ff"
  commit id: "0f7af8b tag 20260915005529"
  checkout main
  branch develop
  checkout develop
  merge feature/fsd-r4-static-demo id: "develop integrates r9"
  commit id: "branch governance"
  merge feature/ups-pod-implementation id: "DEV-01-r1"
```

