'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from '@/lib/store/session';
import { DraftCard } from './DraftCard';
import { LearningsSidebar } from './LearningsSidebar';
import { ContentBoardProvider } from './ContentBoardContext';
import { LoopHeader } from './LoopHeader';
import type { Draft } from '@/types';

function groupBy<T, K extends string>(arr: T[], key: (x: T) => K): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = key(item);
      (acc[k] ||= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

export function ContentBoard() {
  const { session } = useSession();
  const drafts = session.drafts ?? [];
  const jobs = session.jobs ?? [];

  const general = drafts.filter((d) => d.kind === 'general');
  const generalX = general.filter((d) => d.channel === 'x');
  const generalLI = general.filter((d) => d.channel === 'linkedin');

  const hiring = drafts.filter((d) => d.kind === 'hiring');
  const hiringByJob = groupBy(hiring, (d) => (d.jobId ?? 'unassigned') as string);

  const jobTitle = (jobId: string) => {
    const j = jobs.find((x) => x.id === jobId);
    return j?.title ?? jobId;
  };

  return (
    <ContentBoardProvider>
    <div className="h-full overflow-auto p-6">
      <LoopHeader />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_20rem]">
        {/* General drafts */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              General
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {general.length}
            </Badge>
          </div>
          {general.length === 0 ? (
            <EmptyDrafts />
          ) : (
            <Tabs defaultValue="x">
              <TabsList>
                <TabsTrigger value="x">X ({generalX.length})</TabsTrigger>
                <TabsTrigger value="linkedin">LinkedIn ({generalLI.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="x" className="flex flex-col gap-3">
                {generalX.length === 0 ? (
                  <EmptyTab label="No X drafts yet." />
                ) : (
                  generalX.map((d) => <DraftCard key={d.id} draft={d} />)
                )}
              </TabsContent>
              <TabsContent value="linkedin" className="flex flex-col gap-3">
                {generalLI.length === 0 ? (
                  <EmptyTab label="No LinkedIn drafts yet." />
                ) : (
                  generalLI.map((d) => <DraftCard key={d.id} draft={d} />)
                )}
              </TabsContent>
            </Tabs>
          )}
        </section>

        {/* Hiring drafts */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Hiring
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {hiring.length}
            </Badge>
          </div>
          {hiring.length === 0 ? (
            <EmptyDrafts />
          ) : (
            <div className="flex flex-col gap-5">
              {Object.entries(hiringByJob).map(([jobId, list]) => (
                <div key={jobId} className="flex flex-col gap-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-foreground">
                    {jobTitle(jobId)}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {(list as Draft[]).map((d) => (
                      <DraftCard key={d.id} draft={d} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Learnings */}
        <aside className="flex flex-col gap-3">
          <LearningsSidebar />
        </aside>
      </div>
    </div>
    </ContentBoardProvider>
  );
}

function EmptyDrafts() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
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
