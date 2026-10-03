/** Converts a display name to a URL-safe slug. */
export const slugify = (s: string): string =>
  (s ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'user'

/** Builds a friendly profile URL: /u/faith-okorie~a1b2c3d4 */
export const profileUrl = (name: string, id: string): string =>
  `/u/${slugify(name)}~${id.slice(0, 8)}`

/** Builds a friendly channel URL: /c/tech-talk~a1b2c3d4 */
export const channelUrl = (name: string, id: string): string =>
  `/c/${slugify(name)}~${id.slice(0, 8)}`

/** Builds a friendly post URL: /p/a1b2c3d4 */
export const postUrl = (id: string): string => `/p/${id.slice(0, 8)}`

/**
 * Extracts the 8-char short ID from a friendly handle.
 * Handles both "faith-okorie~a1b2c3d4" and bare "a1b2c3d4".
 */
export const extractShortId = (handle: string): string =>
  handle.includes('~') ? handle.split('~').pop()! : handle
