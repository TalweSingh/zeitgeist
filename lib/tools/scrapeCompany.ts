import type { ScrapedData, ToolEnvelope, ToolSchema } from './types';

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v1/scrape';
const TIMEOUT_MS = 10_000;

export async function scrapeCompany(
  url: string
): Promise<ToolEnvelope<{ companyPages: ScrapedData['companyPages'] }>> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return { ok: false, error: 'missing FIRECRAWL_API_KEY' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(FIRECRAWL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
      signal: ctrl.signal
    });
    if (!res.ok) {
      return { ok: false, error: `firecrawl ${res.status}` };
    }
    const json = (await res.json()) as {
      data?: { markdown?: string; metadata?: { sourceURL?: string; url?: string } };
    };
    const text = json.data?.markdown ?? '';
    const sourceURL = json.data?.metadata?.sourceURL ?? json.data?.metadata?.url ?? url;
    return { ok: true, data: { companyPages: [{ url: sourceURL, text }] } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `firecrawl failed: ${msg}` };
  } finally {
    clearTimeout(timer);
  }
}

export const schema: ToolSchema = {
  name: 'scrapeCompany',
  description: 'Scrape a company website (Firecrawl) and return markdown text keyed by URL.',
  input_schema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Company URL (e.g., https://lumen.dev)' }
    },
    required: ['url']
  }
};

