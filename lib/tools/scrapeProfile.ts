import type { ScrapedData, ToolEnvelope, ToolSchema } from './types';

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v1/scrape';
const TIMEOUT_MS = 10_000;

function urlForHandle(handle: string, channel: 'x' | 'linkedin'): string {
  if (/^https?:\/\//.test(handle)) return handle;
  const h = handle.replace(/^@/, '');
  return channel === 'x' ? `https://x.com/${h}` : `https://www.linkedin.com/in/${h}`;
}

export async function scrapeProfile(
  handle: string,
  channel: 'x' | 'linkedin'
): Promise<ToolEnvelope<ScrapedData['inspirationProfiles'][number]>> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return { ok: false, error: 'needs_paste' };
  const url = urlForHandle(handle, channel);
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
    if (!res.ok) return { ok: false, error: 'needs_paste' };
    const json = (await res.json()) as { data?: { markdown?: string } };
    const markdown = json.data?.markdown ?? '';
    if (!markdown.trim()) return { ok: false, error: 'needs_paste' };
    // Naive chunking: paragraphs ≥ 40 chars, dedupe, cap at 8.
    const posts = Array.from(
      new Set(
        markdown
          .split(/\n{2,}/)
          .map((p) => p.replace(/^[#>*\-\s]+/, '').trim())
          .filter((p) => p.length >= 40 && p.length <= 500)
      )
    ).slice(0, 8);
    if (!posts.length) return { ok: false, error: 'needs_paste' };
    return { ok: true, data: { handle, channel, posts } };
  } catch {
    return { ok: false, error: 'needs_paste' };
  } finally {
    clearTimeout(timer);
  }
}

export const schema: ToolSchema = {
  name: 'scrapeProfile',
  description:
    'Scrape an X or LinkedIn profile (Firecrawl) for recent posts. Returns needs_paste on failure so the chat can ask the user to paste posts instead.',
  input_schema: {
    type: 'object',
    properties: {
      handle: {
        type: 'string',
        description: 'Profile handle (e.g., @dhh) or full URL'
      },
      channel: { type: 'string', enum: ['x', 'linkedin'] }
    },
    required: ['handle', 'channel']
  }
};

