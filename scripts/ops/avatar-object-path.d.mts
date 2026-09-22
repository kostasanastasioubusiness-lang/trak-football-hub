/**
 * Types for the script copy, so `avatar-object-path-mirror.test.ts` can import
 * and CALL it rather than reading it as text.
 *
 * The existing mirror (`seed-consent-mirror.test.ts`) asserts on the file's
 * source text, which is right for a string constant. It is not enough for a
 * function: a text match passes when the behaviour changes but the literals do
 * not, and fails on a rename that changes nothing. Comparing outputs is the
 * assertion that matches what can actually go wrong here — the script deleting
 * the wrong storage object.
 */

export declare const AVATAR_BUCKET: string

export declare function avatarObjectPath(
  stored: string | null | undefined,
): string | null
