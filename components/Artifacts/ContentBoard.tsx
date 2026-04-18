'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from '@/lib/store/session';
import { DraftCard } from './DraftCard';
import { LearningsSidebar } from './LearningsSidebar';
import { ContentBoardProvider } from './ContentBoardContext';
import { LoopHeader } from './LoopHeader';
import { FindingsPanel } from './FindingsPanel';
import { BrandBriefCard } from './BrandBriefCard';
import { AnalyticsPanel } from './AnalyticsPanel';
import { RepliesPanel } from './RepliesPanel';
import { ActivityLog } from '@/components/shared/ActivityLog';
import type { Draft, Strategy } from '@/types';
import { LayoutDashboard, Sparkles, Briefcase, BarChart3, MessagesSquare } from 'lucide-react';

function stepDaysFor(cadence: Strategy['cadence'] | undefined): number {
  if (cadence === 'daily') return 1;
  if (cadence === 'weekly') return 7;
  return 2; // 3x-weekly approximated as every other day
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function weekLabel(d: Date): string {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  return `Week of ${start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })}`;
}

type ScheduledDraft = { draft: Draft; date: Date };

function buildSchedule(
  drafts: Draft[],
  cadence: Strategy['cadence'] | undefined
): ScheduledDraft[] {
  const step = stepDaysFor(cadence);
  const today = new Date();
  today.setHours(9, 0, 0, 0);
  return drafts.map((d, i) => ({ draft: d, date: addDays(today, i * step) }));
}

export function ContentBoard() {
  const { session } = useSession();
  const drafts = session.drafts ?? [];
  const mountedAtRef = React.useRef<number>(Date.now());
  const recentLogs = (session.logEvents ?? []).filter(
    (e) => e.t >= mountedAtRef.current - 1000
  );
  const hiringCount = drafts.filter((d) => d.kind === 'hiring').length;

  const schedule = React.useMemo(
    () => buildSchedule(drafts, session.strategy?.cadence),
    [drafts, session.strategy?.cadence]
  );
  const scheduledX = schedule.filter((s) => s.draft.channel === 'x');
  const scheduledLI = schedule.filter((s) => s.draft.channel === 'linkedin');

  return (
    <ContentBoardProvider>
      <div className="h-full overflow-auto p-6">
        <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="replies" className="gap-1.5">
              <MessagesSquare className="h-3.5 w-3.5" />
              Replies
            </TabsTrigger>
            <TabsTrigger value="brand" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Brand identity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="flex flex-col gap-4">
            <LoopHeader />
            <FindingsPanel />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <section className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Schedule
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {drafts.length}
                  </Badge>
                  {hiringCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                      <Briefcase className="h-3 w-3" />
                      {hiringCount} hiring
                    </span>
                  ) : null}
                  {session.strategy?.cadence ? (
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      cadence: {session.strategy.cadence}
                    </span>
                  ) : null}
                </div>
                {drafts.length === 0 ? (
                  <ActivityLog
                    events={recentLogs}
                    emptyLabel="warming up post generation…"
                  />
                ) : (
                  <Tabs defaultValue="x">
                    <TabsList>
                      <TabsTrigger value="x">X ({scheduledX.length})</TabsTrigger>
                      <TabsTrigger value="linkedin">
                        LinkedIn ({scheduledLI.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="x">
                      <ScheduleList
                        items={scheduledX}
                        emptyLabel="No X posts scheduled."
                      />
                    </TabsContent>
                    <TabsContent value="linkedin">
                      <ScheduleList
                        items={scheduledLI}
                        emptyLabel="No LinkedIn posts scheduled."
                      />
                    </TabsContent>
                  </Tabs>
                )}
                <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm border border-border bg-muted" />
                    General
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm border border-accent/60 bg-accent/30" />
                    Hiring
                  </span>
                </div>
              </section>

              <aside className="flex flex-col gap-3">
                <LearningsSidebar />
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="flex flex-col gap-4">
            <AnalyticsPanel />
          </TabsContent>

          <TabsContent value="replies" className="flex flex-col gap-4">
            <RepliesPanel />
          </TabsContent>

          <TabsContent value="brand" className="flex flex-col gap-4">
            <BrandIdentityBanner />
            <BrandBriefCard />
          </TabsContent>
        </Tabs>
      </div>
    </ContentBoardProvider>
  );
}

function ScheduleList({
  items,
  emptyLabel
}: {
  items: ScheduledDraft[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <EmptyTab label={emptyLabel} />;
  }
  const groups: { week: string; entries: ScheduledDraft[] }[] = [];
  for (const entry of items) {
    const key = weekLabel(entry.date);
    const last = groups[groups.length - 1];
    if (last && last.week === key) last.entries.push(entry);
    else groups.push({ week: key, entries: [entry] });
  }
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.week} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {g.week}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex flex-col gap-3">
            {g.entries.map(({ draft, date }) => (
              <ScheduleRow key={draft.id} draft={draft} date={date} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleRow({ draft, date }: { draft: Draft; date: Date }) {
  const isHiring = draft.kind === 'hiring';
  return (
    <div className="flex gap-3">
      <div
        className={
          'flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-2 text-center text-[11px] ' +
          (isHiring
            ? 'border-accent/60 bg-accent/15 text-accent-foreground'
            : 'border-border bg-muted/40 text-muted-foreground')
        }
      >
        <span className="font-medium uppercase tracking-wide">
          {date.toLocaleDateString(undefined, { weekday: 'short' })}
        </span>
        <span className="text-base font-semibold leading-none text-foreground">
          {date.getDate()}
        </span>
        <span className="text-[10px]">
          {date.toLocaleDateString(undefined, { month: 'short' })}
        </span>
      </div>
      <div
        className={
          'relative min-w-0 flex-1 ' +
          (isHiring ? 'rounded-lg ring-1 ring-accent/30' : '')
        }
      >
        <DraftCard draft={draft} />
      </div>
    </div>
  );
}

function BrandIdentityBanner() {
  function requestRework() {
    window.dispatchEvent(new CustomEvent('brand:rework'));
  }
  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/50 bg-gradient-to-br from-accent/20 via-accent/5 to-background p-5">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="inline-flex w-fit items-center gap-1 rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
            <Sparkles className="h-3 w-3" />
            Living brand identity
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Your brand doesn’t stay still — <span className="text-accent-foreground">neither does this</span>.
          </h3>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Positioning, voice, pillars and no-go list are all editable. Rework
            them any time as your product, audience, or market shifts — every
            future draft and reply will respect the new brief automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={requestRework}
          className="inline-flex items-center gap-1.5 rounded-md border border-accent/60 bg-accent/20 px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/30"
        >
          <Sparkles className="h-4 w-4" />
          Rework brand identity
        </button>
      </div>
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}
