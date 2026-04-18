import type { BrandBrief, Draft } from '@/types';
import type { ToolEnvelope, ToolSchema } from './types';
import { runAgent } from '@/lib/agent/loop';
import { CRITIQUE_SYSTEM } from '@/lib/agent/prompts';

function extractJson(text: string): { score?: unknown; reason?: unknown } | null {
  const stripped = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const objMatch = stripped.match(/\{[\s\S]*\}/);
  const raw = objMatch ? objMatch[0] : stripped;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function checkBrandFit(
  brief: BrandBrief,
  draft: Draft
): Promise<ToolEnvelope<{ score: number; reason: string }>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'missing ANTHROPIC_API_KEY' };
  }
  try {
    const userContent = `BRIEF:\n${JSON.stringify(brief, null, 2)}\n\nDRAFT:\n${JSON.stringify(
      draft,
      null,
      2
    )}\n\nReturn ONLY the JSON {"score": number, "reason": string}.`;
    const message = await runAgent({
      system: CRITIQUE_SYSTEM,
      messages: [{ role: 'user', content: userContent }],
      stream: false,
      maxTokens: 512
    });
    const textBlock = message.content.find(
      (b): b is { type: 'text'; text: string } => b.type === 'text'
    );
    const parsed = textBlock ? extractJson(textBlock.text) : null;
    if (!parsed || typeof parsed.score !== 'number' || typeof parsed.reason !== 'string') {
      return { ok: false, error: 'critique returned malformed JSON' };
    }
    return { ok: true, data: { score: parsed.score, reason: parsed.reason } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `critique failed: ${msg}` };
  }
}

export const schema: ToolSchema = {
  name: 'checkBrandFit',
  description:
    'Score a draft against a BrandBrief using the CRITIQUE_SYSTEM prompt. Returns { score 0-1, reason }.',
  input_schema: {
    type: 'object',
    properties: {
      brief: { type: 'object', description: 'The full BrandBrief object' },
      draft: { type: 'object', description: 'The Draft to critique' }
    },
    required: ['brief', 'draft']
  }
};

