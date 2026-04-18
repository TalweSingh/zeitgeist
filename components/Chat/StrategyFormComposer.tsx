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
import { Lock, ArrowLeft, ArrowRight, X as XIcon } from 'lucide-react';

function normalizeHandle(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (t.startsWith('http')) {
    try {
      const u = new URL(t);
      const seg = u.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
      return seg ? `@${seg}` : '';
    } catch {
      return '';
    }
  }
  return t.startsWith('@') ? t : `@${t}`;
}

export function StrategyFormComposer({
  demoMode,
  disabled,
  suggestedAccounts,
  hasHiringJobs,
  onSubmit
}: {
  demoMode?: boolean;
  disabled?: boolean;
  suggestedAccounts?: string[];
  hasHiringJobs?: boolean;
  onSubmit: (strategy: Strategy) => void;
}) {
  const [step, setStep] = React.useState<'cadence' | 'replies'>('cadence');
  const [x, setX] = React.useState(true);
  const [linkedin, setLinkedin] = React.useState(true);
  const [cadence, setCadence] = React.useState<'daily' | '3x-weekly' | 'weekly'>('3x-weekly');
  const [autoPostX, setAutoPostX] = React.useState(false);
  const [hiringRatio, setHiringRatio] = React.useState<number>(hasHiringJobs ? 4 : 0);

  const normalizedSeed = React.useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const a of suggestedAccounts ?? []) {
      const h = normalizeHandle(a);
      if (!h || seen.has(h)) continue;
      seen.add(h);
      out.push(h);
    }
    return out;
  }, [suggestedAccounts]);

  const [accounts, setAccounts] = React.useState<string[]>(normalizedSeed);
  const [seeded, setSeeded] = React.useState(false);
  React.useEffect(() => {
    if (seeded) return;
    if (normalizedSeed.length === 0) return;
    setAccounts(normalizedSeed);
    setSeeded(true);
  }, [normalizedSeed, seeded]);

  const [newAccount, setNewAccount] = React.useState('');

  const channels: Strategy['channels'] = [
    ...(x ? (['x'] as const) : []),
    ...(linkedin ? (['linkedin'] as const) : [])
  ];
  const canContinue = channels.length > 0 && !disabled;

  function addAccount() {
    const h = normalizeHandle(newAccount);
    if (!h) return;
    if (accounts.includes(h)) {
      setNewAccount('');
      return;
    }
    setAccounts((prev) => [...prev, h]);
    setNewAccount('');
  }

  function removeAccount(h: string) {
    setAccounts((prev) => prev.filter((a) => a !== h));
  }

  function submit() {
    onSubmit({
      channels,
      cadence,
      targetReplyAccounts: accounts,
      autoPostX: demoMode ? false : autoPostX,
      hiringRatio: hasHiringJobs ? hiringRatio : 0
    });
  }

  if (step === 'cadence') {
    return (
      <div className="space-y-3 rounded-md border border-border bg-background p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Step 1 of 2
            </div>
            <div className="mt-0.5 text-sm font-medium text-foreground">
              Channels &amp; cadence
            </div>
          </div>
        </div>

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
            Posting cadence
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

        {hasHiringJobs ? (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Hiring post frequency
            </Label>
            <Select
              value={String(hiringRatio)}
              onValueChange={(v) => setHiringRatio(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Off</SelectItem>
                <SelectItem value="2">Every 2nd post</SelectItem>
                <SelectItem value="3">Every 3rd post</SelectItem>
                <SelectItem value="4">Every 4th post</SelectItem>
                <SelectItem value="5">Every 5th post</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Rotates one hiring post into the feed at this rate.
            </p>
          </div>
        ) : null}

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
                {demoMode ? 'Disabled in demo mode' : 'Requires X API credentials'}
              </div>
            </div>
          </div>
          {demoMode ? <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> : null}
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!canContinue}
            onClick={() => setStep('replies')}
          >
            Next: reply strategy
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Step 2 of 2
        </div>
        <div className="mt-0.5 text-sm font-medium text-foreground">Reply strategy on X</div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        On X, the fastest way to show up is replying thoughtfully to well-known
        accounts your audience already reads. Based on your voice, here are
        the accounts we'd target — approve or add more.
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Suggested reply targets
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {accounts.length === 0 ? (
            <span className="text-xs text-muted-foreground">No accounts yet — add one below.</span>
          ) : (
            accounts.map((a) => (
              <span
                key={a}
                className="group inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
              >
                {a}
                <button
                  type="button"
                  onClick={() => removeAccount(a)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${a}`}
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Add another account
        </Label>
        <div className="flex gap-2">
          <Input
            value={newAccount}
            onChange={(e) => setNewAccount(e.target.value)}
            placeholder="@handle or https://x.com/handle"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAccount();
              }
            }}
          />
          <Button variant="outline" size="sm" onClick={addAccount} disabled={!newAccount.trim()}>
            Add
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" size="sm" onClick={() => setStep('cadence')}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Back
        </Button>
        <Button size="sm" disabled={disabled || channels.length === 0} onClick={submit}>
          Approve &amp; generate
        </Button>
      </div>
    </div>
  );
}
