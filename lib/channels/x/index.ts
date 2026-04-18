import type { ChannelAdapter } from '../types';
import { xMock } from './mock';
import { xReal } from './real';

// Factory reads ZEITGEIST_X_MODE at call time so flipping the env var
// requires zero code changes elsewhere. Default = mock.
export function getXAdapter(): ChannelAdapter {
  return process.env.ZEITGEIST_X_MODE === 'real' ? xReal : xMock;
}

