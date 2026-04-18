'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LogEvent } from '@/types';

function formatTs(t: number): string {
  try {
    return new Date(t).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '';
  }
}

export function ActivityLog({
  events,
  emptyLabel = 'Waiting…',
  maxHeightClass = 'max-h-80',
  className
}: {
  events: LogEvent[];
  emptyLabel?: string;
  maxHeightClass?: string;
  className?: string;
}) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex flex-col gap-2 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-sm',
        maxHeightClass,
        className
      )}
    >
      {events.length === 0 ? (
        <span className="text-muted-foreground">{emptyLabel}</span>
      ) : (
        events.map((ev, i) => (
          <div key={`${ev.t}-${i}`} className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{formatTs(ev.t)}</span>
            <span
              className={cn(
                'whitespace-pre-wrap break-words leading-snug',
                ev.level === 'warn'
                  ? 'text-warning'
                  : ev.level === 'ok'
                    ? 'text-foreground'
                    : 'text-foreground/80'
              )}
            >
              {ev.message}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
