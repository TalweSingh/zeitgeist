// Shared tool return envelope + re-exports so tool files stay tight.
export type ToolEnvelope<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type { Job, ScrapedData, BrandBrief, Draft, PerformanceRecord } from '@/types';

export type ToolSchema = {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
};
