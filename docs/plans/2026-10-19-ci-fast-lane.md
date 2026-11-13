# CI fast lane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A PR that changes no database inputs skips the `test` job's database steps (about 5 of its 11 minutes) and still runs everything else.

**Architecture:** A pure classifier, `scripts/ci-scope.mjs`, reads the files the PR changes (`git diff HEAD^1 HEAD` on the pull-request merge ref) and writes `database=true|false` to `$GITHUB_OUTPUT`. Every database step in `ci.yml`'s `test` job runs only when that output is `true`. When in doubt, for example a failed diff, an empty list or a workflow change, it runs everything.

**Tech Stack:** Node 22 ESM scripts with `node --test`, GitHub Actions, Vitest (workflow structure test, as in `src/__tests__/release-workflow.test.ts`).

**Spec:** this conversation, decided 19 Oct 2026 (Dimos chose "Faster CI for fixes"). Step timings come from `test` job 118256875621: the database steps take about 290 s plus 13 s of PostgreSQL install, out of 646 s.

## Global Constraints

- The job stays named `test`, and its `Record tested contents` and `Preserve merge-gate proof` steps always run: branch protection and `Reuse tested merge` depend on both.
- Database inputs (the steps read exactly these): `supabase/`, `scripts/`, `package.json`, `package-lock.json`, `.github/workflows/`.
- Only the 13 database steps listed in Task 2 may be skipped. Lint, typecheck, unit tests, consent timezones, harness, use cases, build, bundle secrets and browser regressions always run.
- This changes the TRAK-205 gate, so the PR is opened as a **draft** for Imad's agreement.

## Review Focus

- The diff can't be computed (shallow history, no `HEAD^1`): expect the full suite. Tested in Task 1 (`changedPaths` returns `null`).
- The changed-file list is empty: expect the full suite. Tested in Task 1.
- A migration is renamed or deleted, not just edited: it must still count as a database change. Use `--no-renames` so both the old and new paths appear. Tested in Task 1.
- The workflow file itself changes: expect the full suite. Tested in Task 1 (`.github/workflows/ci.yml`).
- `Preserve synthetic query plans` uses `if: always()`, so it must become `always() && steps.scope.outputs.database == 'true'` or it uploads nothing on fast runs. Tested in Task 2.

---

### Task 1: Classifier

**Files:**
- Create: `scripts/ci-scope.mjs`
- Test: `scripts/ci-scope.test.mjs`

**Interfaces:**
- Produces: `needsDatabase(paths: string[]): boolean`; `changedPaths(cwd?: string): string[] | null`; a CLI (`node scripts/ci-scope.mjs`) that appends `database=true` or `database=false` to `$GITHUB_OUTPUT` and prints one line saying why.

- [ ] **Step 1: Write the failing tests** (`node:test`, synthetic temp repos as in `check-push-credentials.test.mjs`)
  - `needsDatabase(['src/pages/coach/CoachHome.tsx', 'docs/x.md'])` is `false`
  - `needsDatabase(['supabase/migrations/20261019_x.sql'])`, `(['supabase/tests/a.sql'])`, `(['scripts/test-db.mjs'])`, `(['package.json'])`, `(['package-lock.json'])`, `(['.github/workflows/ci.yml'])` are each `true`
  - `needsDatabase([])` is `true`
  - `changedPaths` in a repo whose HEAD is a merge of a branch that renamed `supabase/migrations/a.sql` to `b.sql` returns both paths
  - `changedPaths` in a repo with one commit returns `null`
- [ ] **Step 2: Run** `node --test scripts/ci-scope.test.mjs`. Expect: FAIL, module not found.
- [ ] **Step 3: Implement** `scripts/ci-scope.mjs`. `changedPaths` runs `git diff --name-only --no-renames HEAD^1 HEAD` and returns `null` on any error. The CLI treats `null` as `[]`. Use the `import.meta.url === pathToFileURL(process.argv[1]).href` entry guard from `merge-gate-evidence.mjs`.
- [ ] **Step 4: Run** `node --test scripts/ci-scope.test.mjs`. Expect: all pass.
- [ ] **Step 5: Commit**

### Task 2: Wire the `test` job

**Files:**
- Modify: `.github/workflows/ci.yml` (`test` job)
- Test: `src/__tests__/ci-fast-lane.test.ts`

**Interfaces:**
- Consumes: `node scripts/ci-scope.mjs` and its `database` output (Task 1).

- [ ] **Step 1: Write the failing test.** Parse `ci.yml` with `yaml`, then assert:
  - the `test` job's checkout has `with.fetch-depth: 2`
  - a step with `id: scope` runs `node scripts/ci-scope.mjs` and comes before the first database step
  - each of these 13 steps has an `if` containing `steps.scope.outputs.database == 'true'`: Database security regressions; Parent migration after deployed reporting migration; Academy access and account deletion regressions; Academy repair after current main migrations; Assessment index after current main and academy repair; Academy history convergence and mutation controls; Disposable database runner safeguards; Install PostgreSQL 17 for concurrent database regressions; Native PostgreSQL replay and concurrent player linking; Native assessment query plan and result regressions; Preserve synthetic query plans (also keeps `always()`); Native PostgreSQL academy upgrade after current main; Migration histories converge
  - no other step mentions `steps.scope`
  - a step runs `node --test scripts/ci-scope.test.mjs`
- [ ] **Step 2: Run** `npx vitest run src/__tests__/ci-fast-lane.test.ts`. Expect: FAIL.
- [ ] **Step 3: Edit `ci.yml`** to match. Add a comment above the scope step saying what it skips and why it is safe.
- [ ] **Step 4: Run** the test, `src/__tests__/release-workflow.test.ts` and `src/__tests__/ci-action-runtimes.test.ts`. Expect: pass, apart from the known Windows-only `/bin/bash` cases in release-workflow.
- [ ] **Step 5: Commit**

### Task 3: Document and propose

**Files:**
- Modify: `docs/release/merge-gate.md` (gate item 2), `AGENTS.md` (Local work and checks)

- [ ] **Step 1:** In merge-gate.md item 2, say that the database steps run only when the PR changes a database input (listed), and that everything else always runs. Add one matching sentence in AGENTS.md.
- [ ] **Step 2:** Run `node scripts/check-delivery-policy.mjs`, `npm run lint`, `npm run typecheck`, `npm run uc:check`. Expect: all pass.
- [ ] **Step 3:** Commit, push `shared/ci-fast-lane`, open a **draft** PR. Its description gives the timings and the trigger list and asks Imad to agree the gate change. CI on that PR runs the full suite, because it changes `.github/workflows/`. A later frontend-only PR will show the fast lane.
