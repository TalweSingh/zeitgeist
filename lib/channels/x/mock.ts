import type { Draft } from '@/types';
import type { ChannelAdapter } from '../types';

function randId(): string {
  return Math.floor(Math.random() * 1e18).toString(36);
}

export const xMock: ChannelAdapter = {
  name: 'x',
  canPublish: true,
  async publish(_draft: Draft) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, url: `https://x.com/demo/status/${randId()}` };
  }
};

