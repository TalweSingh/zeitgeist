'use client';

import * as React from 'react';
import type { ChatMessage } from '@/types';
import { MessageBubble } from './MessageBubble';

export function MessageList({
  messages,
  emptyState
}: {
  messages: ChatMessage[];
  emptyState?: React.ReactNode;
}) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Derive a signal string that changes whenever any message changes length/content
  const signal = React.useMemo(
    () => messages.map((m) => `${m.role}:${m.content.length}`).join('|'),
    [messages]
  );

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [signal]);

  if (messages.length === 0 && emptyState) {
    return <div className="min-h-0 flex-1 overflow-auto p-4">{emptyState}</div>;
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-2 p-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
      </div>
    </div>
  );
}
