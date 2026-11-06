import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

interface Step { id?: string; name?: string; uses?: string; run?: string; if?: string; with?: Record<string, unknown> }
const steps: Step[] = parse(readFileSync('.github/workflows/ci.yml', 'utf8')).jobs.test.steps
const SCOPED = "steps.scope.outputs.database == 'true'"

// The only steps a PR without database changes may skip (scripts/ci-scope.mjs).
// Everything else, including the merge-gate proof, always runs.
const DATABASE_STEPS = [
  'Database security regressions',
  'Parent migration after deployed reporting migration',
  'Academy access and account deletion regressions',
  'Academy repair after current main migrations',
  'Assessment index after current main and academy repair',
  'Academy history convergence and mutation controls',
  'Disposable database runner safeguards',
  'Install PostgreSQL 17 for concurrent database regressions',
  'Native PostgreSQL replay and concurrent player linking',
  'Native assessment query plan and result regressions',
  'Preserve synthetic query plans',
  'Native PostgreSQL academy upgrade after current main',
  'Migration histories converge',
]

describe('CI fast lane', () => {
  it('checks out the merge ref with its base as first parent', () => {
    const checkout = steps.find(step => step.uses?.startsWith('actions/checkout@'))
    expect(checkout?.with?.['fetch-depth']).toBe(2)
  })

  it('classifies the PR before the first database step', () => {
    const scope = steps.findIndex(step => step.id === 'scope')
    expect(steps[scope]?.run).toContain('node scripts/ci-scope.mjs')
    const first = steps.findIndex(step => step.name === DATABASE_STEPS[0])
    expect(scope).toBeGreaterThanOrEqual(0)
    expect(scope).toBeLessThan(first)
  })

  it.each(DATABASE_STEPS)('runs "%s" only when the PR changes a database input', name => {
    expect(steps.find(step => step.name === name)?.if).toContain(SCOPED)
  })

  it('still uploads query plans after a failure on database runs', () => {
    expect(steps.find(step => step.name === 'Preserve synthetic query plans')?.if).toContain('always()')
  })

  it('never skips any other step', () => {
    const scoped = steps.filter(step => step.if?.includes('steps.scope')).map(step => step.name)
    expect(scoped).toEqual(DATABASE_STEPS)
  })

  it('tests the classifier itself', () => {
    expect(steps.some(step => step.run?.includes('node --test scripts/ci-scope.test.mjs'))).toBe(true)
  })
})
