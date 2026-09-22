/**
 * `scripts/ops/avatar-object-path.mjs` copies `avatarObjectPath` because a
 * `.mjs` operational script cannot import the TS module. Two sources of one
 * rule drift, so this runs both over the same inputs and fails if they differ.
 *
 * It matters more here than for a display helper. The purge script uses the
 * copy to decide WHICH storage object to delete from the live project. A
 * divergence is a wrong deletion, or an object reported as unreferenced
 * because its stored shape was not recognised.
 *
 * Falsified both directions while writing: dropping the `avatars/` prefix
 * strip from the script copy fails 2, and making the same change to the TS
 * source instead fails 3. Catching the TS side is the half that is easy to
 * omit and the half that will actually happen, since nobody editing `src/lib`
 * is thinking about a script under `scripts/ops`.
 *
 * Deviating from the house pattern on purpose: `seed-consent-mirror.test.ts`
 * asserts on the .mjs's source TEXT, which is right for a string constant.
 * For a function it is the wrong assertion — a text match passes when the
 * behaviour changes but the literals do not, and fails on a rename that
 * changes nothing. Comparing outputs is what matches the actual failure mode,
 * which is this script deleting the wrong object. Hence the `.d.mts` beside
 * the copy, so this can call it rather than read it.
 */
import { describe, it, expect } from 'vitest'
import { avatarObjectPath as fromSource, AVATAR_BUCKET as BUCKET_SOURCE } from '@/lib/avatar-url'
import {
  avatarObjectPath as fromScript,
  AVATAR_BUCKET as BUCKET_SCRIPT,
} from '../../../scripts/ops/avatar-object-path.mjs'

/* Every shape the module's own header says it handles, plus the ones that
   decide a deletion: empty, junk, and a URL pointing at a different bucket. */
const CASES: Array<string | null | undefined> = [
  // the forward-looking shape
  '22222222-2222-2222-2222-222222222222',
  // legacy public URL — what all four live rows held on 21 Sep
  'https://xbykbqolvqyqmipikuae.supabase.co/storage/v1/object/public/avatars/22222222-2222-2222-2222-222222222222',
  // legacy signed and authenticated URLs
  'https://xbykbqolvqyqmipikuae.supabase.co/storage/v1/object/sign/avatars/abc-def?token=xyz',
  'https://xbykbqolvqyqmipikuae.supabase.co/storage/v1/object/authenticated/avatars/abc-def',
  // the cache-buster Settings used to append
  '22222222-2222-2222-2222-222222222222?t=1726900000000',
  'https://example.com/storage/v1/object/public/avatars/key?t=99',
  // a tolerated prefix
  'avatars/22222222-2222-2222-2222-222222222222',
  '/avatars/22222222-2222-2222-2222-222222222222',
  // percent-encoding
  'https://example.com/storage/v1/object/public/avatars/a%20b',
  // nothing usable — these must agree on null, or the script skips a real row
  null,
  undefined,
  '',
  '   ',
  '?t=1',
  // a URL that is not an avatar object at all
  'https://example.com/storage/v1/object/public/other-bucket/key',
  'https://example.com/nothing/here',
  // not a URL, not empty: treated as a key by both
  'not a url',
]

describe('the script copy of avatarObjectPath matches src/lib/avatar-url.ts', () => {
  it('agrees on the bucket name', () => {
    expect(BUCKET_SCRIPT).toBe(BUCKET_SOURCE)
  })

  it.each(CASES.map(input => [JSON.stringify(input), input] as const))(
    'agrees on %s',
    (_label, input) => {
      expect(fromScript(input)).toBe(fromSource(input))
    },
  )

  /* A control. If both implementations were replaced by `() => null` every
     assertion above would still pass, so assert that the cases actually
     exercise the parsing rather than all collapsing to null. */
  it('the cases are not all null, so agreement means something', () => {
    const resolved = CASES.map(fromSource).filter(Boolean)
    expect(resolved.length).toBeGreaterThan(8)
    expect(fromSource('avatars/key')).toBe('key')
  })
})
