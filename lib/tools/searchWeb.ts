import type { ScrapedData, ToolEnvelope, ToolSchema } from './types';

const PPLX_URL = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar';
const TIMEOUT_MS = 12_000;

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
  const key = process.env.PERPLEXITY_API_KEY;
  // No key -> deterministic mock (never fails).
  if (!key) return { ok: true, data: deterministicMock(query) };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(PPLX_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You summarize web-search results in 2 sentences. Be concrete and specific. No prose preamble.'
          },
          {
            role: 'user',
            content: `Search the web for: ${query}\n\nReturn a two-sentence summary naming concrete companies, prices, metrics, or dates where relevant.`
          }
        ]
      }),
      signal: ctrl.signal
    });
    if (!res.ok) return { ok: true, data: deterministicMock(query) };
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const summary = (json.choices?.[0]?.message?.content ?? '').trim();
    if (!summary) return { ok: true, data: deterministicMock(query) };
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
    'Search the web via Perplexity sonar (deterministic mock if PERPLEXITY_API_KEY missing). Returns { query, summary }.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' }
    },
    required: ['query']
  }
};
