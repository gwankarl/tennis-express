let accessToken: string | null = null

/** Stores the access token for authenticated API requests in this page session. */
export function setAccessToken(token: string): void {
  accessToken = token
}

/** Returns the current page session's access token, if one is set. */
export function getAccessToken(): string | null {
  return accessToken
}

/** Clears the current page session's access token. */
export function clearAccessToken(): void {
  accessToken = null
}
