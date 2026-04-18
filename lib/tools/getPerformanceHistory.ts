import type { PerformanceRecord } from '@/types';
import type { ToolEnvelope, ToolSchema } from './types';

// Server-side: reads /data/history.json directly (bypasses the client store).
export async function getPerformanceHistory(): Promise<
  ToolEnvelope<{ records: PerformanceRecord[] }>
> {
  try {
    const mod = (await import('@/data/history.json')) as
      | { default: PerformanceRecord[] }
      | PerformanceRecord[];
    const records = Array.isArray(mod) ? mod : mod.default;
    return { ok: true, data: { records } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `history read failed: ${msg}` };
  }
}

export const schema: ToolSchema = {
  name: 'getPerformanceHistory',
  description:
    'Return the seeded performance history (12 records across X and LinkedIn) so the generator can extract learnings.',
  input_schema: {
    type: 'object',
    properties: {}
  }
};

