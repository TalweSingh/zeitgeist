/**
 * Real X (Twitter) channel adapter — STUB.
 *
 * To go live:
 *   1. Get paid X API access (Basic tier at minimum for POST /2/tweets).
 *   2. Register an app at https://developer.x.com — record Client ID / Secret.
 *   3. Fill in ./oauth.ts: redirect URL, PKCE code exchange, refresh.
 *   4. Set ZEITGEIST_X_MODE=real and supply X_CLIENT_ID / X_CLIENT_SECRET /
 *      X_REDIRECT_URI in .env.
 *
 * API references:
 *   POST   /2/tweets                    (publish)
 *   GET    /2/tweets/:id                (fetchMetrics)
 *   GET    /2/users/by/username/:handle (resolve handle)
 *   GET    /2/users/:id/tweets          (fetchRecentPosts)
 *   POST   /2/tweets                    (reply, with in_reply_to_tweet_id)
 *
 * Rate-limit headers to honor on every response:
 *   x-rate-limit-remaining
 *   x-rate-limit-reset
 *
 * Error classes:
 *   401 → trigger reauth via ./oauth.ts
 *   403 → flagged account; surface to user, do not retry
 *   429 → back off until x-rate-limit-reset
 */

import type { Draft } from '@/types';
import type { ChannelAdapter } from '../types';

// TODO(x-real): implement POST /2/tweets with OAuth2 user access token.
// Read rate-limit headers (x-rate-limit-remaining, x-rate-limit-reset).
// 401 → trigger reauth via ./oauth.ts; 403 → surface (flagged account, no retry);
// 429 → backoff until x-rate-limit-reset.
async function publish(_draft: Draft): Promise<{ ok: boolean; url?: string; error?: string }> {
  return {
    ok: false,
    error:
      'x real adapter not implemented — switch ZEITGEIST_X_MODE to mock or complete real.ts'
  };
}

// TODO(x-real): GET /2/tweets/:id?tweet.fields=public_metrics
export async function fetchMetrics(_postId: string): Promise<never> {
  throw new Error('x.real.fetchMetrics not implemented');
}

// TODO(x-real): GET /2/users/by/username/:handle → id, then /2/users/:id/tweets
export async function fetchRecentPosts(_handle: string, _limit: number): Promise<string[]> {
  throw new Error('x.real.fetchRecentPosts not implemented');
}

// TODO(x-real): POST /2/tweets with in_reply_to_tweet_id
export async function reply(_toPostId: string, _body: string): Promise<never> {
  throw new Error('x.real.reply not implemented');
}

export const xReal: ChannelAdapter = {
  name: 'x',
  canPublish: false,
  publish
};
