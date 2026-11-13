import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { changedPaths, needsDatabase } from './ci-scope.mjs'

function repo(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'trak-ci-scope-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const identity = ['-c', 'user.name=Synthetic', '-c', 'user.email=synthetic@example.invalid', '-c', 'core.hooksPath=/dev/null']
  git(['init', '-q', '-b', 'main'])
  const write = (name, text) => {
    mkdirSync(dirname(join(cwd, name)), { recursive: true })
    writeFileSync(join(cwd, name), text)
  }
  const commit = message => { git(['add', '-A']); git([...identity, 'commit', '-qm', message]) }
  const merge = branch => git([...identity, 'merge', '-q', '--no-ff', '-m', 'Synthetic merge ref', branch])
  return { cwd, git, write, commit, merge }
}

test('a frontend-only change needs no database steps', () => {
  assert.equal(needsDatabase(['src/pages/coach/CoachHome.tsx', 'docs/x.md']), false)
})

test('every database input runs the database steps', () => {
  for (const path of [
    'supabase/migrations/20261019_x.sql',
    'supabase/tests/a.sql',
    'scripts/test-db.mjs',
    'package.json',
    'package-lock.json',
    '.github/workflows/ci.yml',
  ]) assert.equal(needsDatabase([path]), true, path)
})

test('an empty or unknown change list runs everything', () => {
  assert.equal(needsDatabase([]), true)
})

test('a renamed migration lists both paths, so it still counts', t => {
  const { cwd, git, write, commit, merge } = repo(t)
  write('supabase/migrations/a.sql', 'select 1;\n')
  commit('base')
  git(['checkout', '-q', '-b', 'pr'])
  renameSync(join(cwd, 'supabase/migrations/a.sql'), join(cwd, 'supabase/migrations/b.sql'))
  commit('rename')
  git(['checkout', '-q', 'main'])
  merge('pr')
  assert.deepEqual(changedPaths(cwd).sort(), ['supabase/migrations/a.sql', 'supabase/migrations/b.sql'])
})

test('without a first parent the diff is unknown', t => {
  const { cwd, write, commit } = repo(t)
  write('src/a.ts', 'export {}\n')
  commit('only')
  assert.equal(changedPaths(cwd), null)
})
