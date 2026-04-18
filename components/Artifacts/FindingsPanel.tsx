'use client';

import * as React from 'react';
import { Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContentBoard } from './ContentBoardContext';

export function FindingsPanel() {
  const { simulatedWeek, findings } = useContentBoard();
  if (simulatedWeek === 0 || !findings) return null;

  const {
    appliedCount,
    unappliedCount,
    week1AppliedAvg,
    week1UnappliedAvg,
    week2AppliedAvg,
    week2UnappliedAvg,
    topInsight
  } = findings;

  const appliedLift = week1AppliedAvg > 0 && week1UnappliedAvg > 0
    ? week1AppliedAvg / week1UnappliedAvg
    : null;
  const w2vs1Applied = simulatedWeek === 2 && week1AppliedAvg > 0
    ? week2AppliedAvg / week1AppliedAvg
    : null;
  const w2vs1Unapplied = simulatedWeek === 2 && week1UnappliedAvg > 0
    ? week2UnappliedAvg / week1UnappliedAvg
    : null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-accent/40 bg-accent/5 p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent-foreground" />
        <div className="text-sm font-semibold uppercase tracking-wide text-accent-foreground">
          {simulatedWeek === 2 ? 'Two-week findings' : 'Week 1 findings'}
        </div>
      </div>

      <ul className="flex flex-col gap-2 text-xs">
        {topInsight ? (
          <Finding>
            <span className="text-muted-foreground">Most-applied learning:</span>{' '}
            <span className="text-foreground">“{topInsight}”</span> — applied to{' '}
            <strong className="tabular-nums">{appliedCount}</strong> of{' '}
            <strong className="tabular-nums">{appliedCount + unappliedCount}</strong> drafts.
          </Finding>
        ) : null}

        {appliedLift !== null ? (
          <Finding positive={appliedLift >= 1}>
            Drafts that apply a learning forecast{' '}
            <strong className={cn('tabular-nums', appliedLift >= 1 ? 'text-success' : 'text-warning')}>
              {appliedLift.toFixed(2)}×
            </strong>{' '}
            the engagement of drafts that don’t (W1 avg:{' '}
            <span className="tabular-nums">{week1AppliedAvg.toFixed(2)}×</span> vs{' '}
            <span className="tabular-nums">{week1UnappliedAvg.toFixed(2)}×</span>).
          </Finding>
        ) : null}

        {simulatedWeek === 2 && w2vs1Applied !== null ? (
          <Finding positive={w2vs1Applied >= 1}>
            Week 2 re-weights applied drafts{' '}
            <strong className={cn('tabular-nums', w2vs1Applied >= 1 ? 'text-success' : 'text-warning')}>
              {w2vs1Applied >= 1 ? '+' : ''}{((w2vs1Applied - 1) * 100).toFixed(0)}%
            </strong>{' '}
            vs W1. Unapplied drafts regress{' '}
            <strong className={cn('tabular-nums', (w2vs1Unapplied ?? 1) >= 1 ? 'text-success' : 'text-warning')}>
              {w2vs1Unapplied !== null && w2vs1Unapplied >= 1 ? '+' : ''}
              {w2vs1Unapplied !== null ? ((w2vs1Unapplied - 1) * 100).toFixed(0) : '0'}%
            </strong>.
          </Finding>
        ) : null}

        {simulatedWeek === 2 ? (
          <Finding>
            <span className="text-muted-foreground">Loop closing:</span>{' '}
            this week’s W2 results become next run’s <em>history</em>; the brain keeps the rules that lifted and drops the ones that didn’t.
          </Finding>
        ) : (
          <Finding>
            <span className="text-muted-foreground">Next:</span>{' '}
            click <strong>Simulate week 2</strong> to see how the brain re-weights applied learnings.
          </Finding>
        )}
      </ul>
    </div>
  );
}

function Finding({ children, positive }: { children: React.ReactNode; positive?: boolean }) {
  return (
    <li className="flex items-start gap-2 rounded-md border border-border bg-background/60 p-2">
      {positive === true ? (
        <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
      ) : positive === false ? (
        <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
      ) : (
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
      )}
      <div className="text-foreground">{children}</div>
    </li>
  );
}
