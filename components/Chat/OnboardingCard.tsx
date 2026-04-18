'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export function OnboardingCard({
  onUseClera,
  onUseLumen,
  demoLoading
}: {
  onUseClera: () => void;
  onUseLumen?: () => void;
  demoLoading?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        Welcome to Zeitgeist
      </div>
      <h2 className="mt-1.5 text-lg font-semibold leading-tight text-foreground">
        A brand brain from a 2-minute scrape.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Drop in your website. Zeitgeist reads it, infers your voice, picks
        inspiration heroes that fit, and ships a brief you can post from today.
      </p>

      <div className="mt-4 space-y-2">
        <Button
          className="w-full justify-between"
          onClick={onUseClera}
          disabled={demoLoading}
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {demoLoading ? 'Loading Clera demo…' : 'Try the Clera demo'}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
        {onUseLumen ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs text-muted-foreground"
            onClick={onUseLumen}
            disabled={demoLoading}
          >
            or run the Lumen example
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
        Or type your company URL to start a fresh interview.
      </p>
    </div>
  );
}
