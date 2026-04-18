'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContentBoard } from './ContentBoardContext';

export function LearningsSidebar() {
  const {
    learnings,
    learningsLoading,
    selectedLearningIdx,
    setSelectedLearningIdx,
    getEvidenceRecords
  } = useContentBoard();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Learnings
        </h3>
      </div>

      {learningsLoading ? (
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
          {learnings.map((l, i) => {
            const selected = selectedLearningIdx === i;
            const evidence = getEvidenceRecords(i);
            return (
              <button
                key={`l-${i}`}
                type="button"
                onClick={() => setSelectedLearningIdx(selected ? null : i)}
                className={cn(
                  'flex flex-col gap-1 rounded-md border p-3 text-left transition-all duration-200',
                  selected
                    ? 'border-accent bg-accent/10 ring-1 ring-accent'
                    : 'border-border bg-card hover:border-accent/60 hover:bg-accent/5'
                )}
              >
                <p className="text-sm text-foreground">{l.insight}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Based on {l.evidence.length} post{l.evidence.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-accent-foreground">
                    {selected ? 'highlighting' : 'click to trace'}
                  </span>
                </div>
                {selected && evidence.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
                    {evidence.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-col gap-0.5 text-[11px] text-muted-foreground"
                      >
                        <div className="line-clamp-2">{r.body.split('\n')[0]}</div>
                        <div className="flex gap-2 tabular-nums">
                          <span>{r.metrics.impressions.toLocaleString()} imp</span>
                          <span>· {r.metrics.likes.toLocaleString()} likes</span>
                          <span>· {r.metrics.reposts} rp</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
