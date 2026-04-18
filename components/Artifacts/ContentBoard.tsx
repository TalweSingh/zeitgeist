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
import { FindingsPanel } from './FindingsPanel';

export function ContentBoard() {
  const { session } = useSession();
  const drafts = session.drafts ?? [];

  const allX = drafts.filter((d) => d.channel === 'x');
  const allLI = drafts.filter((d) => d.channel === 'linkedin');
  const hiringCount = drafts.filter((d) => d.kind === 'hiring').length;

  return (
    <ContentBoardProvider>
      <div className="h-full overflow-auto p-6">
        <LoopHeader />
        <FindingsPanel />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Drafts
              </h2>
              <Badge variant="secondary" className="text-[10px]">
                {drafts.length}
              </Badge>
              {hiringCount > 0 ? (
                <Badge variant="outline" className="text-[10px] text-accent-foreground">
                  {hiringCount} hiring
                </Badge>
              ) : null}
            </div>
            {drafts.length === 0 ? (
              <EmptyDrafts />
            ) : (
              <Tabs defaultValue="x">
                <TabsList>
                  <TabsTrigger value="x">X ({allX.length})</TabsTrigger>
                  <TabsTrigger value="linkedin">LinkedIn ({allLI.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="x" className="flex flex-col gap-3">
                  {allX.length === 0 ? (
                    <EmptyTab label="No X drafts yet." />
                  ) : (
                    allX.map((d) => <DraftCard key={d.id} draft={d} />)
                  )}
                </TabsContent>
                <TabsContent value="linkedin" className="flex flex-col gap-3">
                  {allLI.length === 0 ? (
                    <EmptyTab label="No LinkedIn drafts yet." />
                  ) : (
                    allLI.map((d) => <DraftCard key={d.id} draft={d} />)
                  )}
                </TabsContent>
              </Tabs>
            )}
          </section>

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
