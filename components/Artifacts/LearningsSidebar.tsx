'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/store/session';
import { useLearnings } from './_hooks/useLearnings';
import { Sparkles } from 'lucide-react';

export function LearningsSidebar() {
  const { session } = useSession();
  const history = session.performanceHistory ?? [];
  const { learnings, loading } = useLearnings(history);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Learnings
        </h3>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : learnings.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          No learnings yet. Keep posting and we&rsquo;ll spot patterns.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {learnings.map((l, i) => (
            <div
              key={`l-${i}`}
              className="flex flex-col gap-1 rounded-md border border-border bg-card p-3 transition-all duration-200"
            >
              <p className="text-sm text-foreground">{l.insight}</p>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Based on {l.evidence.length} post{l.evidence.length === 1 ? '' : 's'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
