import type { Job, ToolEnvelope, ToolSchema } from './types';

const PPLX_URL = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar';
const TIMEOUT_MS = 15_000;

function extractJson(text: string): unknown {
  // Strip markdown fences; find the first [...] or {...} block.
  const stripped = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const arrMatch = stripped.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch {
      /* ignore */
    }
  }
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

export async function findJobs(companyUrl: string): Promise<ToolEnvelope<Job[]>> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return { ok: false, error: 'missing PERPLEXITY_API_KEY' };
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
              'You extract open job listings. Return JSON array only, no prose, no markdown fences.'
          },
          {
            role: 'user',
            content: `List open roles at ${companyUrl} (check their careers/jobs page). For each role return: {"title": string, "location": string, "team": string, "applyUrl": string}. Return JSON array only.`
          }
        ]
      }),
      signal: ctrl.signal
    });
    if (!res.ok) {
      return { ok: false, error: `perplexity ${res.status}` };
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(content);
    if (!Array.isArray(parsed)) {
      return { ok: false, error: 'perplexity returned non-array' };
    }
    const jobs: Job[] = parsed
      .filter((r: unknown): r is Record<string, unknown> => typeof r === 'object' && r !== null)
      .map((r, idx) => ({
        id: `job-${idx}`,
        title: String(r.title ?? 'Untitled role'),
        location: String(r.location ?? 'Remote'),
        team: r.team ? String(r.team) : undefined,
        applyUrl: String(r.applyUrl ?? r.url ?? companyUrl),
        selected: false
      }));
    return { ok: true, data: jobs };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `perplexity failed: ${msg}` };
  } finally {
    clearTimeout(timer);
  }
}

export const schema: ToolSchema = {
  name: 'findJobs',
  description:
    'Find open job listings for a company via Perplexity one-shot. Returns Job[] with stable ids.',
  input_schema: {
    type: 'object',
    properties: {
      companyUrl: {
        type: 'string',
        description: 'Company homepage URL; Perplexity will follow to the careers page.'
      }
    },
    required: ['companyUrl']
  }
};

