/**
 * X OAuth 2.0 PKCE flow — STUB.
 *
 * Expected env vars (see .env.example):
 *   X_CLIENT_ID
 *   X_CLIENT_SECRET
 *   X_REDIRECT_URI
 *
 * Flow:
 *   1. buildAuthorizeUrl(state, codeChallenge)
 *      → https://twitter.com/i/oauth2/authorize?response_type=code&client_id=...&code_challenge_method=S256
 *   2. exchangeCode(code, codeVerifier) → access_token + refresh_token
 *   3. refresh(refreshToken) → new access_token
 *
 * Store tokens server-side only. Never ship to client.
 */

export type XTokens = { accessToken: string; refreshToken: string; expiresAt: number };

export function buildAuthorizeUrl(state: string, codeChallenge: string): string {
  const clientId = process.env.X_CLIENT_ID ?? '';
  const redirectUri = process.env.X_REDIRECT_URI ?? '';
  const u = new URL('https://twitter.com/i/oauth2/authorize');
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access');
  u.searchParams.set('state', state);
  u.searchParams.set('code_challenge', codeChallenge);
  u.searchParams.set('code_challenge_method', 'S256');
  return u.toString();
}

// TODO(x-oauth): POST https://api.twitter.com/2/oauth2/token with grant_type=authorization_code.
export async function exchangeCode(_code: string, _codeVerifier: string): Promise<XTokens> {
  throw new Error('exchangeCode not implemented');
}

// TODO(x-oauth): POST https://api.twitter.com/2/oauth2/token with grant_type=refresh_token.
export async function refresh(_refreshToken: string): Promise<XTokens> {
  throw new Error('refresh not implemented');
}
