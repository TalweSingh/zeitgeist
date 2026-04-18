'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, ArrowRight, Repeat, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContentBoard } from './ContentBoardContext';
import { useSession } from '@/lib/store/session';

export function LoopHeader() {
  const { session } = useSession();
  const {
    learnings,
    simulatedWeek,
    simulate,
    forecastMultiplier,
    weeksSpan,
    history,
    findings
  } = useContentBoard();

  const drafts = session.drafts ?? [];
  const rejected = drafts.filter((d) => d.rejected).length;
  const simulated = simulatedWeek > 0;
  const buttonLabel =
    simulatedWeek === 0
      ? 'Simulate week 1'
      : simulatedWeek === 1
      ? 'Simulate week 2'
      : 'Simulated';
  const forecastLabel = (() => {
    if (simulatedWeek === 2 && findings) {
      const combined = (findings.week2AppliedAvg + findings.week2UnappliedAvg) / 2 || forecastMultiplier;
      return `${combined.toFixed(2)}\u00d7 W2`;
    }
    if (simulatedWeek === 1 && findings) {
      const combined = (findings.week1AppliedAvg + findings.week1UnappliedAvg) / 2 || forecastMultiplier;
      return `${combined.toFixed(2)}\u00d7 W1`;
    }
    return forecastMultiplier >= 1
      ? `+${forecastMultiplier.toFixed(1)}\u00d7 avg`
      : `${forecastMultiplier.toFixed(1)}\u00d7 avg`;
  })();

  return (
    <div className="relative mb-4 overflow-hidden rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-accent-foreground" />
          <div className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Closed loop
          </div>
          <div className="text-xs text-muted-foreground">
            posted → learned → drafted → forecast → next week
          </div>
        </div>
        <Button
          size="sm"
          variant={simulatedWeek >= 2 ? 'secondary' : 'default'}
          onClick={simulate}
          disabled={simulatedWeek >= 2 || drafts.length === 0}
          className="gap-1.5"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          {buttonLabel}
        </Button>
      </div>

      <div className="flex items-stretch gap-2">
        <Stage label="Posted" value={String(history.length)} sub={`${weeksSpan} weeks`} />
        <Chevron />
        <Stage label="Learned" value={String(learnings.length)} sub="insights" />
        <Chevron />
        <Stage
          label="Drafted"
          value={String(drafts.length)}
          sub={rejected > 0 ? `${rejected} rejected` : 'all clean'}
        />
        <Chevron />
        <Stage
          label="Forecast"
          value={forecastLabel}
          sub="engagement"
          highlight={simulated}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <Repeat className="h-3 w-3" />
        <span>becomes next week&rsquo;s history — loop sharpens each run</span>
      </div>

      {simulated ? (
        <div className="pointer-events-none absolute inset-0 animate-pulse rounded-lg ring-1 ring-accent/40" />
      ) : null}
    </div>
  );
}

function Stage({
  label,
  value,
  sub,
  highlight,
  icon
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-0.5 rounded-md border bg-background px-3 py-2 transition-all duration-300',
        highlight
          ? 'border-accent bg-accent/10 text-accent-foreground shadow-[0_0_0_1px_hsl(var(--accent))]'
          : 'border-border'
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="truncate text-xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function Chevron() {
  return (
    <div className="flex items-center">
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
