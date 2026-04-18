'use client';

import * as React from 'react';
import type { InferredIntake } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/store/session';
import { useDemoMode } from '@/lib/store/demoMode';
import {
  CheckCircle2,
  Loader2,
  Linkedin,
  Twitter,
  Sparkles,
  Pencil,
  X as XIcon,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TIMING = {
  audience: 500,
  voicePrefs: 1000,
  li1: 1500,
  li2: 1900,
  li3: 2300,
  x1: 2800,
  x2: 3200,
  x3: 3600,
  autoApprove: 5300
} as const;

export function InferredIntakeCard() {
  const { session, setSession } = useSession();
  const { demoMode } = useDemoMode();
  const inf = session.inferredIntake;
  const approved = session.inferredApproved ?? false;
  const [editing, setEditing] = React.useState(false);

  const updateInferred = React.useCallback(
    (patch: Partial<InferredIntake>) => {
      setSession((prev) => {
        if (!prev.inferredIntake) return prev;
        return { ...prev, inferredIntake: { ...prev.inferredIntake, ...patch } };
      });
    },
    [setSession]
  );

  const [audienceFilled, setAudienceFilled] = React.useState(false);
  const [voiceFilled, setVoiceFilled] = React.useState(false);
  const [liCount, setLiCount] = React.useState(0);
  const [xCount, setXCount] = React.useState(0);
  const startedRef = React.useRef(false);

  const scrapeReady = !!session.scrapedData;

  React.useEffect(() => {
    if (!inf || approved || startedRef.current) return;
    if (!scrapeReady) return;
    startedRef.current = true;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setAudienceFilled(true), TIMING.audience));
    timers.push(window.setTimeout(() => setVoiceFilled(true), TIMING.voicePrefs));
    timers.push(window.setTimeout(() => setLiCount(1), TIMING.li1));
    timers.push(window.setTimeout(() => setLiCount(2), TIMING.li2));
    timers.push(window.setTimeout(() => setLiCount(3), TIMING.li3));
    timers.push(window.setTimeout(() => setXCount(1), TIMING.x1));
    timers.push(window.setTimeout(() => setXCount(2), TIMING.x2));
    timers.push(window.setTimeout(() => setXCount(3), TIMING.x3));
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [inf, approved, scrapeReady]);

  const approve = React.useCallback(() => {
    if (!inf) return;
    setSession((prev) => {
      if (prev.inferredApproved) return prev;
      return {
        ...prev,
        intake: {
          ...prev.intake,
          audience: inf.audience,
          voicePrefs: inf.voicePrefs,
          linkedinHeroes: inf.linkedinHeroes.map((h) => h.handle),
          xHeroes: inf.xHeroes.map((h) => h.handle),
          favoritePosts: prev.intake?.favoritePosts ?? []
        },
        inferredApproved: true,
        phase: 'brand_identity',
        chatMessages: [
          ...prev.chatMessages,
          {
            role: 'system',
            content: '\u2192 inferred intake approved. synthesizing your brand identity now.'
          }
        ]
      };
    });
  }, [inf, setSession]);

  // Demo is click-driven — no auto-approve. User clicks Approve to advance.

  if (!inf) return null;

  const allFilled =
    audienceFilled && voiceFilled && liCount === 3 && xCount === 3;

  return (
    <Card className="border-accent/30 bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Inferred from your site
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            Does this sound like you?
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We read getclera.com and sketched a starting brief — approve it or tweak.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allFilled && !approved ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setEditing((v) => !v)}
            >
              <Pencil className="h-3.5 w-3.5" />
              {editing ? 'Done' : 'Edit'}
            </Button>
          ) : null}
          {allFilled ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          ) : (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Section title="Audience" filled={audienceFilled}>
          {audienceFilled ? (
            editing ? (
              <textarea
                className="min-h-[72px] w-full resize-y rounded-md border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                value={inf.audience}
                onChange={(e) => updateInferred({ audience: e.target.value })}
              />
            ) : (
              <p className="text-sm text-foreground">{inf.audience}</p>
            )
          ) : (
            <LineSkeleton />
          )}
        </Section>

        <Section title="Voice" filled={voiceFilled}>
          {voiceFilled ? (
            editing ? (
              <VoiceEditor
                values={inf.voicePrefs}
                onChange={(next) => updateInferred({ voicePrefs: next })}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {inf.voicePrefs.map((v, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {v}
                  </Badge>
                ))}
              </div>
            )
          ) : (
            <LineSkeleton width="w-40" />
          )}
        </Section>

        <Section
          title="LinkedIn heroes"
          filled={liCount === 3}
          icon={<Linkedin className="h-3.5 w-3.5" />}
        >
          <HeroList
            heroes={inf.linkedinHeroes}
            revealedCount={liCount}
            editing={editing}
            onChange={(next) => updateInferred({ linkedinHeroes: next })}
          />
        </Section>

        <Section
          title="X heroes"
          filled={xCount === 3}
          icon={<Twitter className="h-3.5 w-3.5" />}
        >
          <HeroList
            heroes={inf.xHeroes}
            revealedCount={xCount}
            editing={editing}
            onChange={(next) => updateInferred({ xHeroes: next })}
          />
        </Section>

        <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            {approved
              ? 'Approved — brand identity next.'
              : editing
                ? 'Editing — hit Done when ready.'
                : allFilled
                  ? 'Ready to approve.'
                  : 'Still inferring…'}
          </p>
          <Button size="sm" disabled={!allFilled || approved || editing} onClick={approve}>
            {approved ? 'Approved' : 'Approve'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  filled,
  icon,
  children
}: {
  title: string;
  filled: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-3 transition-all duration-300',
        filled
          ? 'border border-border bg-card'
          : 'border border-dashed border-border bg-transparent'
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function HeroRow({ handle, rationale }: { handle: string; rationale: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300 rounded-md border border-border bg-muted/40 p-2">
      <div className="text-sm font-medium text-foreground">{handle}</div>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{rationale}</p>
    </div>
  );
}

function HeroList({
  heroes,
  revealedCount,
  editing,
  onChange
}: {
  heroes: { handle: string; rationale: string }[];
  revealedCount: number;
  editing: boolean;
  onChange: (next: { handle: string; rationale: string }[]) => void;
}) {
  const [newHandle, setNewHandle] = React.useState('');
  const [newRationale, setNewRationale] = React.useState('');

  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5">
        {heroes.map((h, i) =>
          i < revealedCount ? (
            <HeroRow key={`${h.handle}-${i}`} handle={h.handle} rationale={h.rationale} />
          ) : (
            <HeroSkeleton key={`s-${i}`} />
          )
        )}
      </div>
    );
  }

  function patch(i: number, p: Partial<{ handle: string; rationale: string }>) {
    onChange(heroes.map((h, idx) => (idx === i ? { ...h, ...p } : h)));
  }

  function remove(i: number) {
    onChange(heroes.filter((_, idx) => idx !== i));
  }

  function add() {
    const h = newHandle.trim();
    if (!h) return;
    onChange([...heroes, { handle: h, rationale: newRationale.trim() }]);
    setNewHandle('');
    setNewRationale('');
  }

  return (
    <div className="flex flex-col gap-2">
      {heroes.map((h, i) => (
        <div
          key={i}
          className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/40 p-2"
        >
          <div className="flex items-center gap-2">
            <Input
              value={h.handle}
              onChange={(e) => patch(i, { handle: e.target.value })}
              className="h-7 flex-1 text-sm"
              placeholder="Handle or name"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(i)}
              aria-label={`Remove ${h.handle}`}
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
          <textarea
            className="min-h-[52px] w-full resize-y rounded-md border border-border bg-background p-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={h.rationale}
            onChange={(e) => patch(i, { rationale: e.target.value })}
            placeholder="Why they fit"
          />
        </div>
      ))}

      <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-border p-2">
        <div className="flex items-center gap-2">
          <Input
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            className="h-7 flex-1 text-sm"
            placeholder="Add a hero…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2"
            onClick={add}
            disabled={!newHandle.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        {newHandle.trim() ? (
          <textarea
            className="min-h-[48px] w-full resize-y rounded-md border border-border bg-background p-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={newRationale}
            onChange={(e) => setNewRationale(e.target.value)}
            placeholder="Why they fit (optional)"
          />
        ) : null}
      </div>
    </div>
  );
}

function VoiceEditor({
  values,
  onChange
}: {
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState('');
  function add() {
    const v = draft.trim();
    if (!v || values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  }
  function remove(v: string) {
    onChange(values.filter((x) => x !== v));
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${v}`}
            >
              <XIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-7 flex-1 text-sm"
          placeholder="Add a voice trait…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2"
          onClick={add}
          disabled={!draft.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 p-2">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-1.5 h-2 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

function LineSkeleton({ width = 'w-2/3' }: { width?: string }) {
  return <div className={cn('h-3 animate-pulse rounded bg-muted', width)} />;
}
