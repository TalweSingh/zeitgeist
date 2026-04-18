'use client';

import * as React from 'react';
import type { Strategy } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Lock } from 'lucide-react';

export function StrategyFormComposer({
  demoMode,
  disabled,
  onSubmit
}: {
  demoMode?: boolean;
  disabled?: boolean;
  onSubmit: (strategy: Strategy) => void;
}) {
  const [x, setX] = React.useState(true);
  const [linkedin, setLinkedin] = React.useState(true);
  const [cadence, setCadence] = React.useState<'daily' | '3x-weekly' | 'weekly'>('3x-weekly');
  const [accountsRaw, setAccountsRaw] = React.useState('');
  const [autoPostX, setAutoPostX] = React.useState(false);

  const channels: Strategy['channels'] = [
    ...(x ? (['x'] as const) : []),
    ...(linkedin ? (['linkedin'] as const) : [])
  ];

  const targetReplyAccounts = accountsRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const canSubmit = channels.length > 0 && !disabled;

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Channels
        </Label>
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={x} onCheckedChange={(v) => setX(!!v)} />
            X
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={linkedin}
              onCheckedChange={(v) => setLinkedin(!!v)}
            />
            LinkedIn
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Cadence
        </Label>
        <Select value={cadence} onValueChange={(v) => setCadence(v as typeof cadence)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="3x-weekly">3x weekly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Target reply accounts (comma-separated)
        </Label>
        <Input
          value={accountsRaw}
          onChange={(e) => setAccountsRaw(e.target.value)}
          placeholder="@dhh, @rauchg, @levie"
        />
        {targetReplyAccounts.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {targetReplyAccounts.map((a) => (
              <span
                key={a}
                className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {a}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={autoPostX}
            disabled={!!demoMode}
            onCheckedChange={(v) => setAutoPostX(!!v)}
          />
          <div>
            <div className="text-sm text-foreground">Auto-post to X</div>
            <div className="text-xs text-muted-foreground">
              {demoMode
                ? 'Disabled in demo mode'
                : 'Requires X API credentials'}
            </div>
          </div>
        </div>
        {demoMode ? <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> : null}
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              channels,
              cadence,
              targetReplyAccounts,
              autoPostX: demoMode ? false : autoPostX
            })
          }
        >
          Generate content
        </Button>
      </div>
    </div>
  );
}
