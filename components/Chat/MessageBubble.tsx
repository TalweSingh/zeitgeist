'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Agent turns in some phases end with a raw JSON block (brand brief, drafts,
 * selection result). Strip it from the display so the user only sees the
 * human-facing prose; the structured data is already applied to session state
 * via the turn route's patch. Works on partial/streaming JSON too: any content
 * that starts with `{` or `[` (after a line break) is hidden.
 */
function stripTrailingJsonForDisplay(text: string): string {
  if (!text) return text;
  const leading = text.trimStart();
  // Pure JSON (streaming or finished) -> hide entirely.
  if (/^[{[]/.test(leading)) return '';
  // Find last standalone JSON block.
  const re = /\n+\s*[{[]/g;
  let lastIdx = -1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) lastIdx = m.index;
  if (lastIdx >= 0) return text.slice(0, lastIdx).trimEnd();
  // Strip `\`\`\`json` fences that some models add even when told not to.
  const fence = text.lastIndexOf('```');
  if (fence > 0) {
    const head = text.slice(0, fence);
    if (/```json\s*$/i.test(head)) {
      const prev = head.lastIndexOf('```json');
      return prev > 0 ? text.slice(0, prev).trimEnd() : '';
    }
  }
  return text;
}

function formatTime(t?: number) {
  if (!t) return '';
  const d = new Date(t);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isStreaming = !!message.meta?.streaming;
  const isInterrupted = !!message.meta?.interrupted;

  if (message.role === 'system') {
    return (
      <div className="flex justify-center py-1">
        <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === 'log') {
    return (
      <div className="flex items-start gap-2 py-0.5 font-mono text-xs text-muted-foreground">
        <span aria-hidden className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
        {message.meta?.t ? (
          <span className="shrink-0 tabular-nums text-muted-foreground/70">{formatTime(message.meta.t)}</span>
        ) : null}
        <span className="whitespace-pre-wrap break-words">{message.content}</span>
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>
      </div>
    );
  }

  // assistant
  const display = stripTrailingJsonForDisplay(message.content);
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          'max-w-[90%] rounded-lg rounded-tl-sm border border-border bg-card px-3 py-2 text-sm text-card-foreground',
          isInterrupted && 'border-warning/50'
        )}
      >
        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-pre:my-1 prose-headings:my-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {display || (isStreaming ? '…' : '')}
          </ReactMarkdown>
        </div>
        {isStreaming ? (
          <span className="ml-1 inline-block h-3 w-1.5 animate-pulse rounded-sm bg-muted-foreground align-middle" />
        ) : null}
        {isInterrupted ? (
          <div className="mt-1 text-[10px] uppercase tracking-wide text-warning">[interrupted]</div>
        ) : null}
      </div>
    </div>
  );
}
