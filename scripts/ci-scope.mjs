// Decides whether a PR's `test` job needs its database steps (about five of
// its eleven minutes). Those steps read only the paths below: migrations,
// SQL tests, their runner scripts and the pinned dependencies. A PR touching
// none of them can't change their result. Anything uncertain runs them.
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const DATABASE_INPUTS = ['supabase/', 'scripts/', '.github/workflows/', 'package.json', 'package-lock.json']

export function needsDatabase(paths) {
  if (paths.length === 0) return true
  return paths.some(path => DATABASE_INPUTS.some(input => input.endsWith('/') ? path.startsWith(input) : path === input))
}

// On a pull_request run HEAD is GitHub's merge ref, whose first parent is the
// current base: the diff is exactly what merging this PR would change.
// --no-renames lists a moved migration under both its names.
export function changedPaths(cwd = process.cwd()) {
  try {
    const out = execFileSync('git', ['diff', '--name-only', '--no-renames', 'HEAD^1', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return out.split('\n').filter(Boolean)
  } catch {
    return null
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const paths = changedPaths() ?? []
  const database = needsDatabase(paths)
  const trigger = paths.find(path => needsDatabase([path]))
  console.log(database
    ? `Database steps run: ${trigger ?? 'the changed files could not be listed'}.`
    : `Database steps skipped: none of the ${paths.length} changed files is a database input.`)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `database=${database}\n`)
}
