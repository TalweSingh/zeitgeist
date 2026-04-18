'use client';

import * as React from 'react';
import { useSession } from '@/lib/store/session';
import { IntakeBuilder } from '@/components/Artifacts/IntakeBuilder';
import { ResearchLog } from '@/components/Artifacts/ResearchLog';
import { JobsReview } from '@/components/Artifacts/JobsReview';
import { BrandBriefCard } from '@/components/Artifacts/BrandBriefCard';
import { StrategyForm } from '@/components/Artifacts/StrategyForm';
import { ContentBoard } from '@/components/Artifacts/ContentBoard';
import { ChatColumn } from '@/components/Chat/ChatColumn';
import type { Phase } from '@/types';

const PHASE_LABEL: Record<Phase, string> = {
  intake: 'Intake',
  research: 'Research',
  jobs_review: 'Jobs review',
  brand_identity: 'Brand identity',
  strategy: 'Strategy',
  content: 'Content'
};

function ArtifactPanel() {
  const { session } = useSession();
  switch (session.phase) {
    case 'intake':
      return <IntakeBuilder />;
    case 'research':
      return <ResearchLog />;
    case 'jobs_review':
      return <JobsReview />;
    case 'brand_identity':
      return <BrandBriefCard />;
    case 'strategy':
      return <StrategyForm />;
    case 'content':
      return <ContentBoard />;
    default:
      return null;
  }
}

export default function HomePage() {
  const { session } = useSession();
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-tight text-foreground">Zeitgeist</span>
          <span className="text-xs text-muted-foreground">
            brand brain · chat → content
          </span>
        </div>
        <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          phase: {PHASE_LABEL[session.phase]}
        </div>
      </header>
      <main className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[420px_1fr]">
        <aside className="flex h-full flex-col border-r border-border bg-background">
          <ChatColumn />
        </aside>
        <section className="flex h-full flex-col overflow-hidden bg-muted/30">
          <div className="flex-1 overflow-auto p-6">
            <ArtifactPanel />
          </div>
        </section>
      </main>
    </div>
  );
}
