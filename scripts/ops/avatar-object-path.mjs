/**
 * A copy of `avatarObjectPath` from `src/lib/avatar-url.ts`, for scripts.
 *
 * A `.mjs` cannot import the TS module, so this is a second source — the same
 * shape as `CONSENT_THRESHOLD_AGE` and the seed's consent wording. Two sources
 * of one rule drift, so `src/lib/__tests__/avatar-object-path-mirror.test.ts`
 * runs both implementations over the same inputs and fails if they disagree.
 * It catches the TS side changing as well as this one, which is the half that
 * is easy to omit and the half that will actually happen.
 *
 * Getting this wrong in an operational script is not a broken image: it is
 * deleting the wrong object, or reporting an object as unreferenced because
 * the stored shape was not recognised. Hence the mirror rather than a re-read.
 */

export const AVATAR_BUCKET = 'avatars'

/** Pull the storage object key out of whatever is stored in `profiles.avatar_url`. */
export function avatarObjectPath(stored) {
  if (typeof stored !== 'string') return null
  const trimmed = stored.trim()
  if (!trimmed) return null

  let withoutQuery = trimmed
  let isUrl = false
  try {
    const url = new URL(trimmed)
    isUrl = url.protocol === 'http:' || url.protocol === 'https:'
    withoutQuery = isUrl ? url.pathname : trimmed
  } catch {
    const q = trimmed.indexOf('?')
    withoutQuery = q === -1 ? trimmed : trimmed.slice(0, q)
  }

  if (isUrl) {
    const marker = new RegExp(`/object/(?:public|sign|authenticated)/${AVATAR_BUCKET}/`)
    const match = withoutQuery.split(marker)
    if (match.length < 2) return null
    const key = decodeURIComponent(match[1]).replace(/^\/+/, '')
    return key || null
  }

  const key = withoutQuery.replace(/^\/+/, '').replace(new RegExp(`^${AVATAR_BUCKET}/`), '')
  return key || null
}
