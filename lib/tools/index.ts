// Tool registry. Each entry = { handler, schema }.
// Schemas are Anthropic tool-use JSON shapes. Handlers return ToolEnvelope<T>.
import { scrapeCompany, schema as scrapeCompanySchema } from './scrapeCompany';
import { scrapeProfile, schema as scrapeProfileSchema } from './scrapeProfile';
import { findJobs, schema as findJobsSchema } from './findJobs';
import { searchWeb, schema as searchWebSchema } from './searchWeb';
import { getPerformanceHistory, schema as historySchema } from './getPerformanceHistory';
import { checkBrandFit, schema as checkBrandFitSchema } from './checkBrandFit';
import type { BrandBrief, Draft } from '@/types';
import type { ToolSchema } from './types';

export type { ToolEnvelope, ToolSchema } from './types';

type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export const TOOLS: Record<string, { handler: ToolHandler; schema: ToolSchema }> = {
  scrapeCompany: {
    schema: scrapeCompanySchema,
    handler: (input) => scrapeCompany(String(input.url ?? ''))
  },
  scrapeProfile: {
    schema: scrapeProfileSchema,
    handler: (input) =>
      scrapeProfile(
        String(input.handle ?? ''),
        (input.channel === 'linkedin' ? 'linkedin' : 'x') as 'x' | 'linkedin'
      )
  },
  findJobs: {
    schema: findJobsSchema,
    handler: (input) => findJobs(String(input.companyUrl ?? ''))
  },
  searchWeb: {
    schema: searchWebSchema,
    handler: (input) => searchWeb(String(input.query ?? ''))
  },
  getPerformanceHistory: {
    schema: historySchema,
    handler: () => getPerformanceHistory()
  },
  checkBrandFit: {
    schema: checkBrandFitSchema,
    handler: (input) =>
      checkBrandFit(input.brief as BrandBrief, input.draft as Draft)
  }
};

export function getAllowedTools(
  names: string[]
): Record<string, { handler: ToolHandler; schema: ToolSchema }> {
  const out: Record<string, { handler: ToolHandler; schema: ToolSchema }> = {};
  for (const n of names) {
    if (TOOLS[n]) out[n] = TOOLS[n];
  }
  return out;
}

// Convenience: direct named re-exports for server routes that need to call tools
// directly (e.g., /api/research calls findJobs without going through Claude).
export { scrapeCompany, scrapeProfile, findJobs, searchWeb, getPerformanceHistory, checkBrandFit };

