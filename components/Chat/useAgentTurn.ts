'use client';

import * as React from 'react';
import type { LogEvent, Phase, Session, ChatMessage } from '@/types';
import { useSession } from '@/lib/store/session';
import { parseSse } from '@/lib/sse';
import { describePhaseKickoff, describeToolCall } from '@/lib/agent/toolMessages';

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

      const silent = !!opts?.silent;
      const userMsg: ChatMessage = { role: 'user', content: userMessage };
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        meta: { streaming: true }
      };
      const assistantIdxRef: { current: number } = { current: -1 };

      // Append user message + empty assistant placeholder up front.
      // On silent turns, skip BOTH and emit a short system one-liner so the
      // chat column still reflects what's happening; the detailed activity
      // log lives in the artifact panel.
      setSession((prev) => {
        const kickoff = silent ? describePhaseKickoff(prev.phase) : null;
        const chatKickoff: ChatMessage | null = kickoff
          ? { role: 'system', content: kickoff }
          : null;
        const nextMessages = silent
          ? chatKickoff
            ? [...prev.chatMessages, chatKickoff]
            : prev.chatMessages
          : [...prev.chatMessages, userMsg, assistantMsg];
        assistantIdxRef.current = silent ? -1 : nextMessages.length - 1;
        const nextLogs = kickoff
          ? [
              ...(prev.logEvents ?? []),
              { t: Date.now(), level: 'info' as const, message: kickoff }
            ]
          : prev.logEvents;
        return { ...prev, chatMessages: nextMessages, logEvents: nextLogs };
      });

      const controller = new AbortController();
      abortRef.current = controller;

      let result: AgentTurnResult | null = null;

      try {
        const baseSession = opts?.sessionOverride
          ? ({ ...sessionRef.current, ...opts.sessionOverride } as Session)
          : sessionRef.current;
        // Strip preseeded messages before sending — they're UI-only context
        // and must not appear in the API history (Anthropic requires user-first turns).
        const sessionForTurn: Session = {
          ...baseSession,
          chatMessages: baseSession.chatMessages.filter((m) => !m.meta?.preseeded)
        };

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
          if (silent) return; // no visible message for silent turns
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
            } else if (evt.type === 'tool_use' && typeof evt.name === 'string') {
              const message = describeToolCall(
                evt.name,
                (evt.input as Record<string, unknown>) ?? {}
              );
              const log: LogEvent = { t: Date.now(), level: 'info', message };
              setSession((prev) => ({
                ...prev,
                logEvents: [...(prev.logEvents ?? []), log]
              }));
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
