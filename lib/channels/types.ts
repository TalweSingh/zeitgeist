import type { Draft } from '@/types';

export interface ChannelAdapter {
  name: 'x' | 'linkedin';
  canPublish: boolean;
  publish(draft: Draft): Promise<{ ok: boolean; url?: string; error?: string }>;
  // Future (present as commented stubs in real.ts):
  // fetchMetrics(postId: string): Promise<PostMetrics>;
  // fetchRecentPosts(handle: string, limit: number): Promise<string[]>;
  // reply(toPostId: string, body: string): Promise<...>;
}
