/**
 * Audit the `avatars` bucket, and purge a named account's avatar object.
 *
 *   Audit only (default):  node scripts/ops/purge-avatar-object.mjs
 *   Purge:                 node scripts/ops/purge-avatar-object.mjs --allow=<email> --apply
 *
 * WHY THIS EXISTS
 * Tarek found on 21 Sep that a rehearsal coach's profile photo on the live
 * project is a screenshot of a spreadsheet of account credentials. It has to
 * come out of the bucket, and the profile row has to stop pointing at it.
 *
 * THAT PARTICULAR JOB IS DONE — DO NOT RE-RUN THE PURGE FOR IT
 * Imad removed both credential images on 22 Sep with his own approval and
 * cleared and verified their profile references, and asked in
 * #coding-agent-reviews that nobody purge those exact objects again. Tarek
 * agreed and stood down. So `--apply` has no outstanding target: it is kept for
 * the next one, and it refuses to run without a named `--allow=<email>`
 * precisely so that "the next one" has to be named out loud.
 *
 * The AUDIT path is the part that still earns its place. It is the only thing
 * that joins the bucket to `profiles` on the DERIVED key, so it answers two
 * questions nothing else does: which objects nobody's profile points at, and
 * which profiles point at an object that is not there.
 *
 * WHY IT NEEDS service_role
 * Not for convenience. `20260526000006_storage_policies.sql` intended to let a
 * user delete their own avatar, but its predicate is
 * `(storage.foldername(name))[1] = auth.uid()::text` while the uploader writes
 * a FLAT key (`Settings.tsx:248`, matching the INSERT policy at
 * `20260424000003:16-18`). `storage.foldername()` on a key with no `/` returns
 * an empty array, so `[1]` is NULL and that policy can never be true. No
 * client can delete any avatar, its own included. The forward fix is
 * `20260922143046_restrict_avatar_reads_to_owner.sql`, on the branch
 * `shared/avatar-read-policy`; this script only ever dealt with objects already
 * sitting in the bucket, and closes nothing.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * It never downloads or renders an object. The one we are removing contains
 * credentials; it has already been identified and does not need looking at
 * again. Size and content-type are read from the listing, which is metadata.
 *
 * REVIEW STATUS
 * This is code that writes to the live project, so it takes a non-author
 * verdict before it runs, the same as a PR.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { avatarObjectPath, AVATAR_BUCKET } from './avatar-object-path.mjs'

/* ── secret entry ────────────────────────────────────────────────────────── */

/**
 * Prompt for a secret with the typing hidden.
 *
 * Prompted rather than exported because an exported variable lives in exactly
 * one shell, and anything running the command in a fresh one gets an empty
 * value with no error. This also keeps the key out of shell history and out of
 * every child process's environment.
 */
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error(
        'This needs an interactive terminal.\n'
        + '  Type `node scripts/ops/purge-avatar-object.mjs` into a terminal yourself\n'
        + '  rather than running it from a button — a spawned shell has no keyboard\n'
        + '  attached and the prompt would return empty.',
      ))
      return
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = str => {
      if (str.startsWith(question) || !str.trim()) process.stdout.write(str)
    }
    rl.question(question, answer => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer.trim())
    })
  })
}

/* ── config ──────────────────────────────────────────────────────────────── */

function env(key, fallback) {
  if (process.env[key]) return process.env[key]
  try {
    const line = readFileSync('.env', 'utf8')
      .split('\n')
      .find(l => l.startsWith(`${key}=`))
    if (line) return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '')
  } catch { /* no .env — fall through */ }
  return fallback
}

const APPLY = process.argv.includes('--apply')

/* Scope is asserted, not assumed. Nothing is purged unless its owner's address
   was named on the command line, so a mistyped argument removes nothing rather
   than removing something else. The same reason the rehearsal reset filtered
   on an exact domain suffix instead of trusting its own query. */
const ALLOW = process.argv
  .filter(a => a.startsWith('--allow='))
  .map(a => a.slice('--allow='.length).trim().toLowerCase())
  .filter(Boolean)

const SUPABASE_URL = env('VITE_SUPABASE_URL')
if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL (env or .env).')
  process.exit(1)
}

if (APPLY && ALLOW.length === 0) {
  console.error('--apply requires at least one --allow=<email>. Refusing to purge an unnamed target.')
  process.exit(1)
}

console.log(`\nProject:  ${SUPABASE_URL}`)
console.log(`Bucket:   ${AVATAR_BUCKET}`)
console.log(`Allowed:  ${ALLOW.length ? ALLOW.join(', ') : '(none — audit only)'}`)
console.log(`Mode:     ${APPLY ? 'APPLY — will delete from live storage' : 'AUDIT — nothing will change'}\n`)

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || await promptHidden('service_role / secret key (Project Settings -> API): ')

if (!SERVICE_KEY) {
  console.error('No key entered. Nothing done.')
  process.exit(1)
}

/* The prefix is a format marker, not a secret, and echoing it turns the two
   commonest mistakes — the publishable key, and a paste truncated at the
   dashboard's line wrap — into an answer rather than an opaque API error. */
console.log(`  key accepted, ${SERVICE_KEY.length} characters, starts "${SERVICE_KEY.slice(0, 10)}"`)

const ANON_KEY = env('VITE_SUPABASE_PUBLISHABLE_KEY') || env('VITE_SUPABASE_ANON_KEY')
if (SERVICE_KEY === ANON_KEY) {
  console.error('\nThat is the publishable/anon key already in .env. It cannot list or delete objects.')
  process.exit(1)
}
if (SERVICE_KEY.startsWith('sb_publishable_')) {
  console.error('\nThat is a PUBLISHABLE key. On the API Keys page it sits directly above the secret one.')
  process.exit(1)
}
if (SERVICE_KEY.length < 20) {
  console.error(`\nOnly ${SERVICE_KEY.length} characters — a fragment, not a whole key. The dashboard wraps`)
  console.error("the value and copying it picks up the line break, which submits this prompt early.")
  console.error("Strip it with:  pbpaste | tr -d '\\n\\r' | pbcopy")
  process.exit(1)
}
console.log('')

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/* ── collect ─────────────────────────────────────────────────────────────── */

function fail(what, error) {
  console.error(`\n${what}: ${error.message ?? error}`)
  if (/invalid api key|jwt|unauthor/i.test(String(error.message ?? error))) {
    console.error('That key cannot administer this project. Project Settings -> JWT Keys ->')
    console.error('service_role (~200+ chars, starts "eyJhbGci"), or API Keys -> a secret key.')
  }
  process.exit(1)
}

/** user_id -> email. `profiles` carries no address, so this comes from Auth. */
async function emailsByUserId() {
  const map = new Map()
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) fail('listUsers failed', error)
    const users = data?.users ?? []
    for (const u of users) map.set(u.id, (u.email ?? '').toLowerCase())
    if (users.length < 200) break
  }
  return map
}

/** Every object actually in the bucket, with metadata only — never content. */
async function bucketObjects() {
  const found = []
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await admin.storage.from(AVATAR_BUCKET)
      .list('', { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) fail('storage list failed', error)
    const batch = data ?? []
    found.push(...batch.filter(o => o.name && o.id !== null))
    if (batch.length < 100) break
  }
  return found
}

const [emails, objects] = await Promise.all([emailsByUserId(), bucketObjects()])

const { data: profileRows, error: profileError } = await admin
  .from('profiles').select('user_id, full_name, role, avatar_url').not('avatar_url', 'is', null)
if (profileError) fail('profiles read failed', profileError)

/* Join on the DERIVED key, not the raw column, so a legacy `/object/public/`
   URL and a bare key that name the same object are recognised as the same
   object. That is the whole reason this shares the resolver. */
const profilesByKey = new Map()
for (const p of profileRows ?? []) {
  const key = avatarObjectPath(p.avatar_url)
  if (key) profilesByKey.set(key, p)
}

/* ── report ──────────────────────────────────────────────────────────────── */

const kb = n => (typeof n === 'number' ? `${Math.round(n / 1024)}kb` : '?')

console.log(`${objects.length} object(s) in the bucket, ${profileRows?.length ?? 0} profile row(s) with an avatar_url:\n`)
console.log('  OWNER                                          SIZE    TYPE            REFERENCED')
for (const o of objects) {
  const p = profilesByKey.get(o.name)
  const who = emails.get(o.name) || emails.get(p?.user_id) || `(no account for ${o.name})`
  console.log(
    `  ${who.padEnd(44)} ${kb(o.metadata?.size).padEnd(7)} `
    + `${String(o.metadata?.mimetype ?? '?').padEnd(15)} ${p ? 'yes' : 'NO — orphan'}`,
  )
}

/* An avatar_url pointing at an object that is not in the bucket is its own
   defect: the screen shows a broken image and no error. Name it rather than
   letting the two counts silently disagree. */
const dangling = (profileRows ?? []).filter(p => {
  const key = avatarObjectPath(p.avatar_url)
  return key && !objects.some(o => o.name === key)
})
if (dangling.length) {
  console.log(`\n  ${dangling.length} profile(s) point at an object that is not in the bucket:`)
  for (const p of dangling) console.log(`    ${emails.get(p.user_id) ?? p.user_id} -> ${p.avatar_url}`)
}

/* ── targets ─────────────────────────────────────────────────────────────── */

const targets = (profileRows ?? [])
  .map(p => ({ profile: p, email: emails.get(p.user_id) ?? '', key: avatarObjectPath(p.avatar_url) }))
  .filter(t => t.key && ALLOW.includes(t.email))

const unmatched = ALLOW.filter(a => !targets.some(t => t.email === a))
if (unmatched.length) {
  console.log(`\n  Named but not found with an avatar: ${unmatched.join(', ')}`)
}

if (!ALLOW.length) {
  console.log('\nAudit only. Re-run with --allow=<email> --apply to purge a named account.\n')
  process.exit(0)
}

console.log(`\n${targets.length} target(s):`)
for (const t of targets) {
  const present = objects.some(o => o.name === t.key)
  console.log(`  ${t.email}  key=${t.key}  object ${present ? 'present' : 'ALREADY GONE'}`)
}

if (!APPLY) {
  console.log('\nAudit only. Add --apply to delete these objects and clear their avatar_url.\n')
  process.exit(0)
}

if (!targets.length) {
  console.error('\nNothing matched. Refusing to proceed.')
  process.exit(1)
}

/* ── purge ───────────────────────────────────────────────────────────────── */

console.log('\nPurging...\n')
const failed = []
for (const t of targets) {
  const { error: rmError } = await admin.storage.from(AVATAR_BUCKET).remove([t.key])
  if (rmError) { failed.push(`${t.email} storage: ${rmError.message}`); console.log(`  FAIL  ${t.email} — ${rmError.message}`); continue }

  /* Clear the column too. Leaving it set would point at nothing: a broken
     image with no error, which is the dangling case reported above. */
  const { error: upError } = await admin
    .from('profiles').update({ avatar_url: null }).eq('user_id', t.profile.user_id)
  if (upError) { failed.push(`${t.email} profile: ${upError.message}`); console.log(`  FAIL  ${t.email} — ${upError.message}`); continue }

  console.log(`  done  ${t.email}`)
}

/* ── verify ──────────────────────────────────────────────────────────────── */

/* A write reporting success is not evidence that it happened. Re-read both
   sides. This is the step that would have caught a silent no-op. */
console.log('\nVerifying by re-reading...\n')
const after = await bucketObjects()
const { data: afterProfiles, error: afterError } = await admin
  .from('profiles').select('user_id, avatar_url').in('user_id', targets.map(t => t.profile.user_id))
if (afterError) fail('post-check profiles read failed', afterError)

let clean = true
for (const t of targets) {
  const objectGone = !after.some(o => o.name === t.key)
  const row = (afterProfiles ?? []).find(p => p.user_id === t.profile.user_id)
  const columnCleared = row ? row.avatar_url === null : false
  if (!objectGone || !columnCleared) clean = false
  console.log(
    `  ${t.email}\n`
    + `    object removed from bucket   ${objectGone ? 'yes' : 'NO — still present'}\n`
    + `    profiles.avatar_url cleared  ${columnCleared ? 'yes' : `NO — still ${row?.avatar_url ?? '(row missing)'}`}`,
  )
}

console.log(`\n  ${objects.length - after.length} object(s) removed, ${failed.length} failure(s).`)
if (failed.length) for (const f of failed) console.log(`    ${f}`)

console.log(`
Next:
  1. Log this in #coding-agent-reviews and docs/reviews/, with the pre-state
     above — the Pyramids FC delete is the format.
  2. The policy hole is NOT closed by this. The migration on
     shared/avatar-read-policy does that.
  3. Rotate whatever credential the removed object exposed. Removing the object
     does not un-expose what it showed.
`)

process.exit(clean && !failed.length ? 0 : 1)
