// Central agent loop. One place that touches the Anthropic SDK.
// Supports tool use (max 8 iterations) and optional streaming.
import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam, Tool, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';

const MODEL = process.env.ZEITGEIST_MODEL ?? 'claude-opus-4-7';
const MAX_ITERATIONS = 8;
// Brand-brief and content-generation turns emit long structured JSON; 4096
// was truncating mid-object, which broke downstream JSON parsing.
const MAX_TOKENS = 8192;

export type ToolUseEvent = {
  name: string;
  input: Record<string, unknown>;
  output: unknown;
};

export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export type RunAgentTool = {
  schema: Tool;
  handler: ToolHandler;
};

export type RunAgentArgs = {
  system: string;
  messages: MessageParam[];
  tools?: Record<string, RunAgentTool>;
  onToolUse?: (event: ToolUseEvent) => void | Promise<void>;
  stream?: boolean;
  maxTokens?: number;
};

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

function toolSchemaList(tools?: Record<string, RunAgentTool>): Tool[] | undefined {
  if (!tools) return undefined;
  const list = Object.values(tools).map((t) => t.schema);
  return list.length ? list : undefined;
}

async function runTool(
  name: string,
  input: Record<string, unknown>,
  tools: Record<string, RunAgentTool>,
  onToolUse?: (e: ToolUseEvent) => void | Promise<void>
): Promise<unknown> {
  const entry = tools[name];
  let output: unknown;
  if (!entry) {
    output = { ok: false, error: `unknown tool: ${name}` };
  } else {
    try {
      output = await entry.handler(input);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      output = { ok: false, error: `tool ${name} threw: ${msg}` };
    }
  }
  if (onToolUse) await onToolUse({ name, input, output });
  return output;
}

/**
 * Non-streaming run: full tool-use loop, returns the final Message.
 */
export async function runAgent(args: RunAgentArgs & { stream?: false }): Promise<Message>;
/**
 * Streaming run: yields text deltas (strings). Tool use happens between turns;
 * while a tool is running no text is produced. The generator completes when
 * Claude emits end_turn (or max iterations is reached).
 */
export async function runAgent(
  args: RunAgentArgs & { stream: true }
): Promise<AsyncGenerator<string, Message, void>>;
export async function runAgent(
  args: RunAgentArgs
): Promise<Message | AsyncGenerator<string, Message, void>> {
  const { system, tools, onToolUse, stream, maxTokens } = args;
  const toolList = toolSchemaList(tools);
  const messages: MessageParam[] = [...args.messages];

  if (stream) {
    return streamingRun(system, messages, tools ?? {}, toolList, onToolUse, maxTokens);
  }
  return oneShotRun(system, messages, tools ?? {}, toolList, onToolUse, maxTokens);
}

async function oneShotRun(
  system: string,
  messages: MessageParam[],
  tools: Record<string, RunAgentTool>,
  toolList: Tool[] | undefined,
  onToolUse: RunAgentArgs['onToolUse'],
  maxTokens?: number
): Promise<Message> {
  let last: Message | null = null;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const resp = await client().messages.create({
      model: MODEL,
      max_tokens: maxTokens ?? MAX_TOKENS,
      system,
      messages,
      ...(toolList ? { tools: toolList } : {})
    });
    last = resp;
    if (resp.stop_reason !== 'tool_use') return resp;
    const toolUses = resp.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
    messages.push({ role: 'assistant', content: resp.content });
    const results = await Promise.all(
      toolUses.map(async (tu) => ({
        type: 'tool_result' as const,
        tool_use_id: tu.id,
        content: JSON.stringify(
          await runTool(tu.name, (tu.input as Record<string, unknown>) ?? {}, tools, onToolUse)
        )
      }))
    );
    messages.push({ role: 'user', content: results });
  }
  return last as Message;
}

async function* streamingRun(
  system: string,
  messages: MessageParam[],
  tools: Record<string, RunAgentTool>,
  toolList: Tool[] | undefined,
  onToolUse: RunAgentArgs['onToolUse'],
  maxTokens?: number
): AsyncGenerator<string, Message, void> {
  let last: Message | null = null;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const s = client().messages.stream({
      model: MODEL,
      max_tokens: maxTokens ?? MAX_TOKENS,
      system,
      messages,
      ...(toolList ? { tools: toolList } : {})
    });
    s.on('text', (delta) => {
      // handled by async iterator below; noop here to satisfy the SDK
      void delta;
    });
    for await (const event of s) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta' &&
        event.delta.text
      ) {
        yield event.delta.text;
      }
    }
    const final = await s.finalMessage();
    last = final;
    if (final.stop_reason !== 'tool_use') return final;
    const toolUses = final.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
    messages.push({ role: 'assistant', content: final.content });
    const results = await Promise.all(
      toolUses.map(async (tu) => ({
        type: 'tool_result' as const,
        tool_use_id: tu.id,
        content: JSON.stringify(
          await runTool(tu.name, (tu.input as Record<string, unknown>) ?? {}, tools, onToolUse)
        )
      }))
    );
    messages.push({ role: 'user', content: results });
  }
  return last as Message;
}

