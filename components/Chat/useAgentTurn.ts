'use client';

import * as React from 'react';
import type { Phase, Session, ChatMessage } from '@/types';
import { useSession } from '@/lib/store/session';
import { parseSse } from '@/lib/sse';

export type AgentTurnResult = {
  advance?: boolean;
  nextPhase?: Phase;
  patch?: Partial<Session>;
};

export type UseAgentTurn = {
  sending: boolean;
  error: string | null;
  send: (
    userMessage: string,
    opts?: { silent?: boolean; sessionOverride?: Partial<Session> }
  ) => Promise<AgentTurnResult | null>;
  abort: () => void;
};

/**
 * useAgentTurn posts to /api/agent/turn and streams tokens back into
 * `session.chatMessages`. The last assistant message grows in place as deltas
 * arrive. When a terminal `result` event is received, `patch` is applied
 * first; then, if `advance === true`, a system transition message is added
 * and `session.phase` advances to `nextPhase`.
 */
export function useAgentTurn(): UseAgentTurn {
  const { session, setSession } = useSession();
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  // Keep a ref to the freshest session for the SSE callback.
  const sessionRef = React.useRef(session);
  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const abort = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const send = React.useCallback<UseAgentTurn['send']>(
    async (userMessage, opts) => {
      if (sending) return null;
      setSending(true);
      setError(null);

      const userMsg: ChatMessage = { role: 'user', content: userMessage };
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        meta: { streaming: true }
      };
      const assistantIdxRef: { current: number } = { current: -1 };

      // Append user message + empty assistant placeholder up front.
      setSession((prev) => {
        const nextMessages = [
          ...prev.chatMessages,
          ...(opts?.silent ? [] : [userMsg]),
          assistantMsg
        ];
        assistantIdxRef.current = nextMessages.length - 1;
        return { ...prev, chatMessages: nextMessages };
      });

      const controller = new AbortController();
      abortRef.current = controller;

      let result: AgentTurnResult | null = null;

      try {
        const sessionForTurn: Session = opts?.sessionOverride
          ? ({ ...sessionRef.current, ...opts.sessionOverride } as Session)
          : sessionRef.current;

        const res = await fetch('/api/agent/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          signal: controller.signal,
          body: JSON.stringify({ session: sessionForTurn, userMessage })
        });

        if (!res.ok) {
          throw new Error(`Agent turn failed: ${res.status}`);
        }

        const appendDelta = (delta: string) => {
          setSession((prev) => {
            const next = prev.chatMessages.slice();
            const i = assistantIdxRef.current;
            if (i < 0 || i >= next.length) return prev;
            const m = next[i];
            if (!m || m.role !== 'assistant') return prev;
            next[i] = { ...m, content: (m.content ?? '') + delta };
            return { ...prev, chatMessages: next };
          });
        };

        await parseSse(
          res,
          (evt) => {
            if (!evt || typeof evt !== 'object') return;
            if (evt.type === 'text' && typeof evt.delta === 'string') {
              appendDelta(evt.delta);
            } else if (evt.type === 'result') {
              result = {
                advance: !!evt.advance,
                nextPhase: evt.nextPhase,
                patch: evt.patch
              };
            } else if (typeof evt.delta === 'string') {
              // Tolerate generic { delta: '...' } events.
              appendDelta(evt.delta);
            }
          },
          controller.signal
        );
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(e?.message ?? 'Agent turn failed');
        }
      } finally {
        abortRef.current = null;
        // Finalize assistant message: clear streaming flag.
        setSession((prev) => {
          const next = prev.chatMessages.slice();
          const i = assistantIdxRef.current;
          const m = i >= 0 && i < next.length ? next[i] : null;
          if (m && m.role === 'assistant' && m.meta?.streaming) {
            next[i] = { ...m, meta: { ...m.meta, streaming: false } };
          }
          // Apply patch + advance.
          let patched = { ...prev, chatMessages: next };
          if (result?.patch) patched = { ...patched, ...result.patch } as Session;
          if (result?.advance && result.nextPhase) {
            const pretty = result.nextPhase.replace(/_/g, ' ');
            patched = {
              ...patched,
              phase: result.nextPhase,
              chatMessages: [
                ...patched.chatMessages,
                { role: 'system', content: `→ ${pretty} starting` }
              ]
            };
          }
          return patched;
        });
        setSending(false);
      }

      return result;
    },
    [sending, setSession]
  );

  return { sending, error, send, abort };
}
