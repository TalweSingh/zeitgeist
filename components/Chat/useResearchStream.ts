'use client';

import * as React from 'react';
import type { ChatMessage, LogEvent } from '@/types';
import { useSession } from '@/lib/store/session';
import { parseSse } from '@/lib/sse';

export type UseResearchStream = {
  running: boolean;
  error: string | null;
  start: (opts?: { demo?: boolean }) => Promise<void>;
  stop: () => void;
};


/**
 * useResearchStream opens an SSE to /api/research?demo=..., appends log
 * events into session.logEvents AND as role: 'log' chat messages, and on
 * the terminal `data` event patches scrapedData + jobs. On `done`, resolves.
 */
export function useResearchStream(opts?: { onDone?: () => void }): UseResearchStream {
  const { session, setSession } = useSession();
  const sessionRef = React.useRef(session);
  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const onDoneRef = React.useRef(opts?.onDone);
  React.useEffect(() => {
    onDoneRef.current = opts?.onDone;
  }, [opts?.onDone]);

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const start = React.useCallback<UseResearchStream['start']>(
    async (startOpts) => {
      if (running) return;
      setRunning(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const qs = startOpts?.demo ? '?demo=true' : '';
        const res = await fetch(`/api/research${qs}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          signal: controller.signal,
          body: JSON.stringify({ intake: sessionRef.current.intake ?? {} })
        });
        if (!res.ok) throw new Error(`Research stream failed: ${res.status}`);

        await parseSse(
          res,
          (evt) => {
            if (!evt || typeof evt !== 'object') return;
            if (evt.type === 'log' && evt.event) {
              const logEvent: LogEvent = {
                t: evt.event.t ?? Date.now(),
                level: evt.event.level ?? 'info',
                message: evt.event.message ?? ''
              };
              const chatMsg: ChatMessage = {
                role: 'log',
                content: logEvent.message,
                meta: { t: logEvent.t, level: logEvent.level }
              };
              setSession((prev) => ({
                ...prev,
                logEvents: [...prev.logEvents, logEvent],
                chatMessages: [...prev.chatMessages, chatMsg]
              }));
            } else if (evt.type === 'data') {
              setSession((prev) => ({
                ...prev,
                scrapedData: evt.scrapedData ?? prev.scrapedData,
                jobs: Array.isArray(evt.jobs) ? evt.jobs : prev.jobs
              }));
            } else if (evt.type === 'done') {
              onDoneRef.current?.();
            }
          },
          controller.signal
        );
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(e?.message ?? 'Research stream failed');
        }
      } finally {
        abortRef.current = null;
        setRunning(false);
      }
    },
    [running, setSession]
  );

  return { running, error, start, stop };
}
