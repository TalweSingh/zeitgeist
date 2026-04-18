'use client';

import * as React from 'react';
import Link from 'next/link';
import { Key, RotateCcw, Sparkles } from 'lucide-react';
import { useSession } from '@/lib/store/session';
import { useDemoMode } from '@/lib/store/demoMode';
import { IntakeBuilder } from '@/components/Artifacts/IntakeBuilder';
import { ResearchLog } from '@/components/Artifacts/ResearchLog';
import { JobsReview } from '@/components/Artifacts/JobsReview';
import { BrandBriefCard } from '@/components/Artifacts/BrandBriefCard';
import { StrategyForm } from '@/components/Artifacts/StrategyForm';
import { ContentBoard } from '@/components/Artifacts/ContentBoard';
import { ChatColumn } from '@/components/Chat/ChatColumn';
import type { Phase } from '@/types';

const STORAGE_KEY = 'zeitgeist.session';

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

function handleDemoReset() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.location.reload();
}

export default function HomePage() {
  const { session } = useSession();
  const { demoMode, setDemoMode } = useDemoMode();
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Zeitgeist" className="h-7 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            phase: {PHASE_LABEL[session.phase]}
          </div>
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            title={demoMode ? 'Demo mode on — auto-advancing through phases' : 'Demo mode off — manual steps'}
            className={
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ' +
              (demoMode
                ? 'border-accent/60 bg-accent/10 text-accent-foreground hover:bg-accent/20'
                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground')
            }
          >
            <Sparkles className="h-3.5 w-3.5" />
            Demo mode {demoMode ? 'on' : 'off'}
          </button>
          <button
            type="button"
            onClick={handleDemoReset}
            title="Reset demo — wipe session and return to intake"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <Link
            href="/settings"
            title="API keys"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Key className="h-3.5 w-3.5" />
            Settings
          </Link>
        </div>
      </header>
      <main className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[420px_1fr]">
        <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border bg-background">
          <ChatColumn />
        </aside>
        <section className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/30">
          <div className="min-h-0 flex-1 overflow-auto p-6">
            <ArtifactPanel />
          </div>
        </section>
      </main>
    </div>
  );
}
