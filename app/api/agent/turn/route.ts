import { NextRequest } from 'next/server';
import { runAgent, type RunAgentTool } from '@/lib/agent/loop';
import { PHASES, NEXT_PHASE } from '@/lib/agent/phases';
import { getAllowedTools } from '@/lib/tools';
import type {
  BrandBrief,
  ChatMessage,
  Draft,
  Intake,
  Phase,
  Session,
  Strategy
} from '@/types';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TurnBody = { session: Session; userMessage: string };

function sseEvent(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function mapRole(role: ChatMessage['role']): 'user' | 'assistant' | null {
  if (role === 'user') return 'user';
  if (role === 'assistant') return 'assistant';
  return null; // skip system/log messages
}

function buildPhaseContext(phase: Phase, session: Session): string | null {
  // Inject structured state into the user message so the agent can operate on
  // it without relying on free-form chat history.
  switch (phase) {
    case 'research': {
      if (!session.scrapedData) return null;
      const summary = {
        intake: session.intake,
        scrapedData: {
          companyPages: session.scrapedData.companyPages.slice(0, 5),
          inspirationProfiles: session.scrapedData.inspirationProfiles,
          searchResults: session.scrapedData.searchResults
        },
        jobs: session.jobs.map((j) => ({ id: j.id, title: j.title, location: j.location, team: j.team }))
      };
      return `---CONTEXT---\n${JSON.stringify(summary, null, 2)}\n---END CONTEXT---`;
    }
    case 'jobs_review': {
      if (!session.jobs.length) return null;
      const company = deriveCompanyName(session.intake?.companyUrl ?? '');
      const summary = {
        company,
        jobs: session.jobs.map((j) => ({
          id: j.id,
          title: j.title,
          location: j.location,
          team: j.team
        }))
      };
      return `---CONTEXT---\n${JSON.stringify(summary, null, 2)}\n---END CONTEXT---`;
    }
    case 'brand_identity': {
      const selectedJobs = session.jobs.filter((j) => j.selected);
      const summary = {
        intake: session.intake,
        scrapedData: session.scrapedData
          ? {
              companyPages: session.scrapedData.companyPages.slice(0, 5),
              inspirationProfiles: session.scrapedData.inspirationProfiles,
              searchResults: session.scrapedData.searchResults.slice(0, 3)
            }
          : null,
        selectedJobs
      };
      return `---CONTEXT---\n${JSON.stringify(summary, null, 2)}\n---END CONTEXT---`;
    }
    case 'content': {
      if (!session.brandBrief) return null;
      const selectedJobs = session.jobs.filter((j) => j.selected);
      const summary = {
        brandBrief: session.brandBrief,
        strategy: session.strategy,
        performanceHistory: session.performanceHistory,
        selectedJobs
      };
      return `---CONTEXT---\n${JSON.stringify(summary, null, 2)}\n---END CONTEXT---`;
    }
    default:
      return null;
  }
}

function deriveCompanyName(url: string): string {
  try {
    if (!url) return 'the company';
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, '');
    const root = host.split('.')[0] ?? host;
    return root.charAt(0).toUpperCase() + root.slice(1);
  } catch {
    return 'the company';
  }
}

function buildMessageHistory(session: Session, userMessage: string, phase: Phase): MessageParam[] {
  const hist: MessageParam[] = [];
  for (const m of session.chatMessages) {
    const role = mapRole(m.role);
    if (!role) continue;
    if (!m.content?.trim()) continue;
    hist.push({ role, content: m.content });
  }
  const context = buildPhaseContext(phase, session);
  const finalUser = context ? `${context}\n\n${userMessage}` : userMessage;
  hist.push({ role: 'user', content: finalUser });
  return hist;
}

/**
 * Extract a trailing JSON object or array from the assistant text.
 *
 * Strategy: walk the text and find every position where a top-level JSON
 * value could start (`{` or `[`), then attempt a balanced-bracket parse from
 * that position. Return the LAST successful parse. This handles nested
 * structures correctly — `lastIndexOf('{')` would pick an inner `{` and fail.
 */
function extractTrailingJson(text: string): unknown {
  const trimmed = text.trim().replace(/```json\s*/gi, '').replace(/```/g, '').trim();

  const tryParseBalanced = (src: string, start: number): unknown | undefined => {
    const open = src[start];
    const close = open === '{' ? '}' : open === '[' ? ']' : null;
    if (!close) return undefined;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < src.length; i++) {
      const c = src[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(src.slice(start, i + 1));
          } catch {
            return undefined;
          }
        }
      }
    }
    return undefined;
  };

  let lastParsed: unknown = null;
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (c !== '{' && c !== '[') continue;
    const parsed = tryParseBalanced(trimmed, i);
    if (parsed !== undefined) lastParsed = parsed;
  }
  return lastParsed;
}

function computePatch(
  phase: Phase,
  assistantText: string,
  currentSession: Session
): Partial<Session> {
  const parsed = extractTrailingJson(assistantText);
  if (!parsed || typeof parsed !== 'object') return {};
  const obj = parsed as Record<string, unknown>;

  switch (phase) {
    case 'intake': {
      if (obj.intake && typeof obj.intake === 'object') {
        const merged: Partial<Intake> = {
          ...(currentSession.intake ?? {}),
          ...(obj.intake as Partial<Intake>)
        };
        return { intake: merged };
      }
      return {};
    }
    case 'jobs_review': {
      if (obj.done && Array.isArray(obj.selectedJobIds)) {
        const ids = new Set(obj.selectedJobIds as string[]);
        return {
          jobs: currentSession.jobs.map((j) => ({ ...j, selected: ids.has(j.id) }))
        };
      }
      return {};
    }
    case 'brand_identity': {
      // Expect a BrandBrief-shaped object (no 'done' wrapper per prompt).
      if ('positioning' in obj && 'noGoList' in obj) {
        return { brandBrief: obj as unknown as BrandBrief };
      }
      return {};
    }
    case 'strategy': {
      if (obj.done && obj.strategy) {
        return { strategy: obj.strategy as Strategy };
      }
      return {};
    }
    case 'content': {
      if (Array.isArray(parsed)) {
        return { drafts: parsed as Draft[] };
      }
      return {};
    }
    default:
      return {};
  }
}

export async function POST(req: NextRequest) {
  let body: TurnBody;
  try {
    body = (await req.json()) as TurnBody;
  } catch {
    return new Response('invalid JSON body', { status: 400 });
  }
  if (!body?.session || typeof body.userMessage !== 'string') {
    return new Response('missing session or userMessage', { status: 400 });
  }

  const phase = body.session.phase;
  const spec = PHASES[phase];
  if (!spec) return new Response(`unknown phase: ${phase}`, { status: 400 });

  const allowedToolMap = getAllowedTools(spec.allowedTools);
  const tools: Record<string, RunAgentTool> = {};
  for (const [name, entry] of Object.entries(allowedToolMap)) {
    tools[name] = {
      schema: entry.schema as unknown as RunAgentTool['schema'],
      handler: entry.handler
    };
  }

  const systemPrompt = spec.systemPrompt;
  const messages = buildMessageHistory(body.session, body.userMessage, phase);

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let accumulated = '';
      try {
        const gen = await runAgent({
          system: systemPrompt,
          messages,
          tools: Object.keys(tools).length ? tools : undefined,
          stream: true,
          onToolUse: (e) => {
            controller.enqueue(
              enc.encode(sseEvent({ type: 'tool_use', name: e.name, input: e.input }))
            );
          }
        });
        for await (const delta of gen) {
          accumulated += delta;
          controller.enqueue(enc.encode(sseEvent({ type: 'text', delta })));
        }

        // Build the new-message session snapshot we want to evaluate
        // advance criteria against (includes the patch we extracted).
        const patch = computePatch(phase, accumulated, body.session);
        const projected: Session = { ...body.session, ...patch };
        const shouldAdvance = spec.advanceCriterion(projected);
        const nextPhase = shouldAdvance ? NEXT_PHASE[phase] ?? undefined : undefined;

        controller.enqueue(
          enc.encode(
            sseEvent({
              type: 'result',
              advance: shouldAdvance,
              nextPhase,
              patch
            })
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(enc.encode(sseEvent({ type: 'error', error: msg })));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}

