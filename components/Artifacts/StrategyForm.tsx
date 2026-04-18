'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/store/session';
import { Lock, Unlock, Twitter, Linkedin } from 'lucide-react';

export function StrategyForm() {
  const { session } = useSession();
  const strategy = session.strategy;

  if (!strategy) {
    return (
      <div className="h-full overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Set your strategy in the chat.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const channels = strategy.channels ?? [];
  const targets = strategy.targetReplyAccounts ?? [];

  return (
    <div className="h-full overflow-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Strategy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Channels
            </div>
            <div className="flex flex-wrap gap-1.5">
              {channels.length === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                channels.map((c) => (
                  <Badge key={c} variant="secondary" className="gap-1">
                    {c === 'x' ? (
                      <Twitter className="h-3 w-3" />
                    ) : (
                      <Linkedin className="h-3 w-3" />
                    )}
                    {c === 'x' ? 'X' : 'LinkedIn'}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cadence
            </div>
            <div className="inline-flex w-fit items-center rounded-full border border-border bg-muted px-3 py-1 text-sm text-foreground">
              {strategy.cadence || '—'}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Target reply accounts
            </div>
            <div className="flex flex-wrap gap-1.5">
              {targets.length === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                targets.map((t, i) => (
                  <span
                    key={`t-${i}`}
                    className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                  >
                    {t}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Auto-post to X
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm">
              {strategy.autoPostX ? (
                <>
                  <Unlock className="h-3.5 w-3.5 text-warning" />
                  <span className="text-foreground">Unlocked</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Locked (draft-only)</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
