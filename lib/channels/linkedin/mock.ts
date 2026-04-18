import type { Draft } from '@/types';
import type { ChannelAdapter } from '../types';

// LinkedIn is draft-only for the hackathon. Returning ok:false forces the UI
// into the copy-to-clipboard path.
export const linkedinMock: ChannelAdapter = {
  name: 'linkedin',
  canPublish: false,
  async publish(_draft: Draft) {
    return {
      ok: false,
      error: 'linkedin publish not supported \u2014 copy to clipboard instead'
    };
  }
};

