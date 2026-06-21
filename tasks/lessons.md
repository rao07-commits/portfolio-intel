# Lessons

## 2026-06-20

- When adding new fields to persisted JSON content, make the UI visibly handle older records that do not have those fields. Otherwise a deployed change can be technically live while the user sees no difference on the current page.
- After deploying presentation changes that depend on newly generated data, either generate fresh data for verification or add an explicit "pending for archived briefing" state so the production UI proves the new framework is active.

## 2026-05-25

- Home-directory instructions like `/Users/sid/AGENTS.md` may not apply to remote/cloud agents because they run from a repository checkout. Put `AGENTS.md` in the repo root and commit/push it.
- When claiming a remote behavior is configured, verify the file is present in the target repo and tracked by git.
