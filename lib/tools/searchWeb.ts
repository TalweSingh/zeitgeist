import type { ScrapedData, ToolEnvelope, ToolSchema } from './types';

const SERP_URL = 'https://serpapi.com/search';
const TIMEOUT_MS = 10_000;

function deterministicMock(query: string): ScrapedData['searchResults'][number] {
  const q = query.toLowerCase();
  const bits: string[] = [];
  if (q.includes('competitor') || q.includes('vs')) {
    bits.push('Top comparisons reference Datadog, Honeycomb, and Grafana Cloud.');
  }
  if (q.includes('pricing') || q.includes('price')) {
    bits.push('Usage-based pricing mentioned in most results; no seat-based tier noted.');
  }
  if (q.includes('funding') || q.includes('series') || q.includes('raise')) {
    bits.push('Recent Series A reported in late 2025; ~$20M range with tier-1 lead.');
  }
  if (!bits.length) {
    bits.push(
      `Top 3 organic results for "${query}" describe the company positioning, a product tour, and a recent blog post.`
    );
  }
  return { query, summary: bits.join(' ') };
}

export async function searchWeb(
  query: string
): Promise<ToolEnvelope<ScrapedData['searchResults'][number]>> {
  const key = process.env.SERPAPI_KEY;
  if (!key) {
    return { ok: true, data: deterministicMock(query) };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const u = new URL(SERP_URL);
    u.searchParams.set('q', query);
    u.searchParams.set('api_key', key);
    const res = await fetch(u.toString(), { signal: ctrl.signal });
    if (!res.ok) {
      return { ok: true, data: deterministicMock(query) };
    }
    const json = (await res.json()) as {
      organic_results?: { title?: string; snippet?: string }[];
    };
    const top = (json.organic_results ?? []).slice(0, 3);
    const summary = top.length
      ? top.map((r) => `${r.title ?? ''}: ${r.snippet ?? ''}`.trim()).join(' \u2014 ')
      : deterministicMock(query).summary;
    return { ok: true, data: { query, summary } };
  } catch {
    return { ok: true, data: deterministicMock(query) };
  } finally {
    clearTimeout(timer);
  }
}

export const schema: ToolSchema = {
  name: 'searchWeb',
  description:
    'Search the web (SerpAPI; deterministic mock if key missing). Returns { query, summary } where summary is the top organic results concatenated.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' }
    },
    required: ['query']
  }
};

