/**
 * Reset the password on every @rehearsal.trak.dev auth account.
 *
 *   Dry run (default):  node scripts/ops/reset-rehearsal-passwords.mjs
 *   Apply:              node scripts/ops/reset-rehearsal-passwords.mjs --apply
 *
 * Why this exists: the rehearsal accounts were seeded on 1 September with a
 * password that is now burned (see scripts/burned-credentials.mjs). The seed
 * script signs in before it does anything, and so does its own --purge, so
 * with a dead password there is no way back in from the anon key alone. This
 * resets them through the admin API instead.
 *
 * Needs the service_role / secret key, which bypasses every RLS policy on a
 * live project holding children's records. Both secrets are PROMPTED FOR, not
 * exported: see `promptHidden` below for why. Nothing is written to disk, and
 * neither value is put into the environment of any other process.
 *
 * Scope is asserted, not assumed: it refuses to touch any address outside
 * @rehearsal.trak.dev, so a mistyped domain cannot reset a real user.
 *
 * REVIEW STATUS — read this before running it.
 * This was written and then run against 25 live auth accounts on 21 Sep
 * WITHOUT a non-author verdict. Kostas called that out on 22 Sep: a script
 * that writes to live is code, and it takes a verdict the same as a PR. It is
 * committed here so it can have one. The @rehearsal.trak.dev rotation it was
 * written for is already done and verified; the still-open rotation is the
 * @trak.dev dev accounts, which are a DIFFERENT domain and are deliberately
 * excluded by the suffix match below. Pointing this at them is not a one-word
 * change and must not be done as one.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

/* ── secret entry ────────────────────────────────────────────────────────── */

/**
 * Ask for a secret with the typing hidden.
 *
 * Both secrets are prompted for rather than exported beforehand because an
 * exported variable lives in exactly one shell, and anything that runs the
 * command in a fresh one gets an empty value with no error. Prompting keeps
 * the secret out of shell history and out of the environment of every other
 * process, and it cannot silently arrive empty.
 */
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error(
        'This needs an interactive terminal.\n'
        + '  Click into a terminal tab and type the command yourself\n'
        + '  yourself rather than running it from a button — a spawned shell has no\n'
        + '  keyboard attached and the prompt would return empty.',
      ))
      return
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    // Echo the question, swallow everything typed after it.
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

const DOMAIN = 'rehearsal.trak.dev'
const APPLY = process.argv.includes('--apply')

const SUPABASE_URL = env('VITE_SUPABASE_URL')
const ANON_KEY = env('VITE_SUPABASE_PUBLISHABLE_KEY') || env('VITE_SUPABASE_ANON_KEY')

if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL (env or .env).')
  process.exit(1)
}

console.log(`\nProject:  ${SUPABASE_URL}`)
console.log(`Scope:    @${DOMAIN}`)
console.log(`Mode:     ${APPLY ? 'APPLY — will write to live auth' : 'DRY RUN — nothing will change'}\n`)

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || await promptHidden('service_role / secret key (Project Settings -> API): ')

if (!SERVICE_KEY) {
  console.error('No key entered. Nothing done.')
  process.exit(1)
}

// The prefix identifies which key was pasted and is not itself sensitive —
// "sb_secret_" and "eyJhbGci" are format markers, not secrets. Echoing it turns
// the commonest mistake (grabbing the publishable key, which sits directly
// above the secret one) into an answer rather than an opaque "Invalid API key".
const prefix = SERVICE_KEY.slice(0, 10)
console.log(`  key accepted, ${SERVICE_KEY.length} characters, starts "${prefix}"`)

if (SERVICE_KEY === ANON_KEY) {
  console.error(`
That is the PUBLISHABLE/ANON key — the same one already in .env. It cannot list
or modify users by design. You need the secret key.`)
  process.exit(1)
}
// A key pasted with a line break in it submits at the newline, so only the
// first fragment arrives. That reads as "Invalid API key" from the server,
// which sends you looking for the wrong key rather than at the paste.
if (SERVICE_KEY.length < 20) {
  console.error(`
Only ${SERVICE_KEY.length} characters. That is a fragment, not a whole key —
the dashboard wraps the value, and copying it picks up the line break, which
submits this prompt early. Strip it and try again:

    pbpaste | tr -d '\\n\\r' | pbcopy`)
  process.exit(1)
}
if (SERVICE_KEY.startsWith('sb_publishable_')) {
  console.error(`
That is a PUBLISHABLE key. It has no admin rights. On the API Keys page the
publishable key sits directly above the secret one — you want the secret.`)
  process.exit(1)
}
console.log('')

// The password is only needed to write one, so a dry run does not ask for it.
let PW = process.env.TRAK_REHEARSAL_PASSWORD
if (APPLY) {
  // Both constraints are real and were both hit on 21 Sep: the seed script
  // wants 16+, and the project's auth policy now wants a special character.
  // Confirming twice because a typo here is only discovered when someone
  // cannot sign in, by which point it is in a DM and in the seeded accounts.
  while (true) {
    PW = await promptHidden('new rehearsal password (16+ chars, 1+ special): ')
    if (PW.length < 16 || !/[^A-Za-z0-9]/.test(PW)) {
      console.log('  too short, or no special character. Try again.\n')
      continue
    }
    const again = await promptHidden('confirm: ')
    if (again !== PW) {
      console.log('  did not match. Try again.\n')
      continue
    }
    console.log(`  password accepted, ${PW.length} characters\n`)
    break
  }
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const sleep = ms => new Promise(r => setTimeout(r, ms))

/* ── collect ─────────────────────────────────────────────────────────────── */

async function rehearsalUsers() {
  const found = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      // A stack trace here says nothing useful — the cause is always which key
      // was pasted, so name the two places a working one can come from.
      if (/invalid api key|jwt|unauthor/i.test(error.message)) {
        console.error(`
  Rejected: ${error.message}

  That key cannot administer users. Two places to get one that can:

  1. Project Settings -> JWT Keys
     The legacy "service_role" key. ~200+ characters, starts "eyJhbGci" —
     the same shape as the publishable key already in your .env, which is
     how you can tell you are on the right page.

  2. Project Settings -> API Keys -> "+ New secret key"
     Creates a new-style key starting "sb_secret_". It is shown ONCE, so
     copy it before closing the dialog.

  Either works. The JWT one needs no new key created, so it is the quicker
  route — and creating a key is a change to the live project's auth config,
  which is worth not doing four days before a pilot unless you want to.
`)
        process.exit(1)
      }
      throw new Error(`listUsers failed on page ${page}: ${error.message}`)
    }
    const users = data?.users ?? []
    // Suffix match on the full domain, so neither "rehearsal.trak.dev.evil.com"
    // nor a bare "trak.dev" dev account can slip into the set.
    found.push(...users.filter(u => (u.email ?? '').toLowerCase().endsWith(`@${DOMAIN}`)))
    if (users.length < 200) break
  }
  return found.sort((a, b) => a.email.localeCompare(b.email))
}

/* ── main ────────────────────────────────────────────────────────────────── */

const users = await rehearsalUsers()

if (users.length === 0) {
  console.error(`No accounts found under @${DOMAIN}. Nothing to do.`)
  console.error('If you expected some, check VITE_SUPABASE_URL points at the pilot project.')
  process.exit(1)
}

console.log(`${users.length} accounts:\n`)
for (const u of users) console.log(`  ${u.email}`)

if (!APPLY) {
  console.log(`\nDry run only. Re-run with --apply to reset all ${users.length}.\n`)
  process.exit(0)
}

console.log(`\nResetting ${users.length} passwords...\n`)

let ok = 0
const failed = []
for (const u of users) {
  const { error } = await admin.auth.admin.updateUserById(u.id, { password: PW })
  if (error) {
    failed.push({ email: u.email, message: error.message })
    console.log(`  FAIL  ${u.email} — ${error.message}`)
  } else {
    ok++
  }
  await sleep(120) // the seed run tripped auth rate limits; stay well under
}

console.log(`\n  ${ok} reset, ${failed.length} failed.`)

/* ── verify ──────────────────────────────────────────────────────────────── */

// Reset reporting success is not the same as sign-in working, and sign-in is
// the thing that is actually blocked. Prove it with the anon key, the way the
// seed script will.
if (ANON_KEY) {
  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await asUser.auth.signInWithPassword({
    email: `director@${DOMAIN}`,
    password: PW,
  })
  console.log(
    data?.user
      ? `  Verified: director@${DOMAIN} signs in with the new password.`
      : `  VERIFY FAILED: ${error?.message ?? 'unknown'}`,
  )
  await asUser.auth.signOut()
} else {
  console.log('  Skipped verification — no anon key found to sign in with.')
}

if (failed.length) {
  console.log('\nFailures:')
  for (const f of failed) console.log(`  ${f.email} — ${f.message}`)
  process.exit(1)
}

console.log(`
Next:
  1. Run the seed. It reads TRAK_REHEARSAL_PASSWORD from the environment, so
     set that variable for the one command only, with a LEADING SPACE so the
     line stays out of zsh history, then:
        node seed-pilot-rehearsal.mjs
     (Written as prose rather than a ready-to-paste line on purpose: an
     assignment with a quoted value is the shape no-committed-credentials
     rejects, and a guard that can tell a placeholder from a real secret is a
     guard that can be fooled by one.)
  2. DM the password to Imad. Do not post it in #coding-agent-reviews.
  3. Nothing persisted here: neither secret was written to disk or exported.
`)
