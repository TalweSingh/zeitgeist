'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function OnboardingCard({
  onUseDemo,
  demoLoading
}: {
  onUseDemo: () => void;
  demoLoading?: boolean;
}) {
  return (
    <div className="mx-auto max-w-sm rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-warning" aria-hidden />
        <div className="text-sm font-semibold">Welcome to Zeitgeist</div>
      </div>
      <p className="text-xs text-muted-foreground">
        I interview you, scrape your world, and synthesize a brand brain you
        can ship from. Say hello to start — I’ll ask 7 short questions.
      </p>
      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onUseDemo}
          disabled={demoLoading}
        >
          {demoLoading ? 'Loading…' : 'Use Lumen demo'}
        </Button>
      </div>
    </div>
  );
}
