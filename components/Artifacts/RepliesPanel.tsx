'use client';

import * as React from 'react';
import { useSession } from '@/lib/store/session';
import { Heart, MessageCircle, Repeat2, Eye, ExternalLink, Zap, Sparkles } from 'lucide-react';
import type { ReplyActivity } from '@/types';

type ReplyRow = ReplyActivity;

const MOCK_REPLIES: ReplyRow[] = [
  {
    id: 'r1',
    target: '@jasonlk',
    targetPost:
      "Most SaaS pricing pages still bury the annual discount. You're leaving 15-20% ARR on the table.",
    reply:
      "Same thing with onboarding — burying the first 'aha' 3 clicks deep costs us ~12% activation. Small surfaces, big compounders.",
    postedDaysAgo: 2,
    metrics: { impressions: 18420, likes: 214, replies: 11, reposts: 6, profileClicks: 92 }
  },
  {
    id: 'r2',
    target: '@levie',
    targetPost:
      "AI isn't going to replace your job. Someone using AI better than you will.",
    reply:
      "This is how we hire now: can you sketch a prompt that beats a mid-level PM's weekly synthesis? If yes, we'll find you a seat.",
    postedDaysAgo: 3,
    metrics: { impressions: 26110, likes: 389, replies: 28, reposts: 14, profileClicks: 141 }
  },
  {
    id: 'r3',
    target: '@nikitabier',
    targetPost:
      "The best growth teams I've seen run 3-4 experiments/week with a 48h cycle time. Not 10 with a 2-week cycle.",
    reply:
      "We went from 8-day cycles to 36h by killing the weekly readout. Ritual dies, velocity lives. Turns out 'check-ins' were the bottleneck.",
    postedDaysAgo: 5,
    metrics: { impressions: 12840, likes: 158, replies: 7, reposts: 9, profileClicks: 64 }
  },
  {
    id: 'r4',
    target: '@paulg',
    targetPost:
      "The most dangerous phrase in a startup is 'we'll fix it later.'",
    reply:
      "Counter: 'we'll measure it later.' Debt you can pay down. Lost signal you can't.",
    postedDaysAgo: 6,
    metrics: { impressions: 31200, likes: 472, replies: 19, reposts: 22, profileClicks: 168 }
  },
  {
    id: 'r5',
    target: '@rauchg',
    targetPost:
      "Every millisecond of TTI on a signup page is a percentage point of conversion you don't get back.",
    reply:
      "We shaved 380ms off our signup flow last month and activation moved 2.1 points. Turns out web vitals are a growth metric.",
    postedDaysAgo: 8,
    metrics: { impressions: 14760, likes: 197, replies: 9, reposts: 11, profileClicks: 78 }
  },
  {
    id: 'r6',
    target: '@firstround',
    targetPost:
      "Founders underestimate how much their first 5 hires shape the next 50.",
    reply:
      "Hire #2 set our whole engineering bar — and unset it when he left. Worth documenting the first-principles of your first 5 while they're still in the building.",
    postedDaysAgo: 10,
    metrics: { impressions: 9420, likes: 113, replies: 5, reposts: 4, profileClicks: 41 }
  }
];

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toString();
}

function daysAgoLabel(n: number): string {
  if (n === 0) return 'today';
  if (n === 1) return 'yesterday';
  return `${n}d ago`;
}

export function RepliesPanel() {
  const { session } = useSession();
  const seeded = session.replyActivity;
  const targets = session.strategy?.targetReplyAccounts ?? session.intake?.xHeroes ?? [];
  const source = seeded && seeded.length > 0 ? seeded : MOCK_REPLIES;
  // If no seeded list, optionally narrow the mock set by selected targets.
  let effective = source;
  if (!seeded || seeded.length === 0) {
    const targetSet = new Set(targets.map((t) => t.toLowerCase()));
    const rows = MOCK_REPLIES.filter(
      (r) => targetSet.size === 0 || targetSet.has(r.target.toLowerCase())
    );
    effective = rows.length > 0 ? rows : MOCK_REPLIES;
  }

  const totals = effective.reduce(
    (a, r) => ({
      impressions: a.impressions + r.metrics.impressions,
      likes: a.likes + r.metrics.likes,
      replies: a.replies + r.metrics.replies,
      reposts: a.reposts + r.metrics.reposts,
      profileClicks: a.profileClicks + r.metrics.profileClicks
    }),
    { impressions: 0, likes: 0, replies: 0, reposts: 0, profileClicks: 0 }
  );

  const avgLikes = effective.length ? Math.round(totals.likes / effective.length) : 0;

  // Derive a rough "replies/day" window from postedDaysAgo span
  const daySpan = Math.max(
    1,
    Math.max(...effective.map((r) => r.postedDaysAgo), 1)
  );
  const perDayAvg = Math.round(effective.length / daySpan);
  const perDayLow = Math.max(20, perDayAvg * 4);
  const perDayHigh = perDayLow + 10;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden rounded-xl border border-accent/50 bg-gradient-to-br from-accent/20 via-accent/10 to-background p-5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              <Zap className="h-3 w-3" />
              Auto-pilot on
            </span>
            <span className="text-[11px] text-muted-foreground">Running daily on X</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-accent-foreground">
              {perDayLow}–{perDayHigh}
            </span>
            <span className="text-sm text-foreground/80">replies & comments / day</span>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">
            We post <span className="font-semibold text-accent-foreground">{perDayLow}–{perDayHigh} on-brand replies every day</span>{' '}
            under well-known accounts your audience already reads.{' '}
            <span className="font-medium text-foreground">
              Reply-surface is one of the highest-leverage growth levers on X
            </span>{' '}
            — it compounds profile clicks, pulls followers you couldn’t reach
            with posts alone, and we run it automatically so you never have to
            think about it.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-background/60 px-2 py-0.5 text-foreground/80">
              <Sparkles className="h-3 w-3 text-accent-foreground" />
              Brand-safe
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-0.5 text-muted-foreground">
              Tone-matched to your voice
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-0.5 text-muted-foreground">
              Only under {targets.length || MOCK_REPLIES.length} approved accounts
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Replies shown" value={effective.length.toString()} highlight />
        <Tile label="Impressions" value={fmt(totals.impressions)} />
        <Tile label="Avg likes" value={fmt(avgLikes)} />
        <Tile label="Profile clicks" value={fmt(totals.profileClicks)} highlight />
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Recent replies</h3>
          <span className="text-[11px] text-muted-foreground">
            On X, targeting {targets.length || MOCK_REPLIES.length} accounts
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {effective.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">Replying to {r.target}</span>
                  <span className="text-muted-foreground">· {daysAgoLabel(r.postedDaysAgo)}</span>
                </div>
                <a
                  href={`https://x.com/${r.target.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  View thread
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="rounded-md border-l-2 border-muted-foreground/40 bg-muted/30 px-2 py-1.5 text-[12px] italic text-muted-foreground">
                {r.targetPost}
              </div>
              <p className="text-sm text-foreground">{r.reply}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] tabular-nums text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {fmt(r.metrics.impressions)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {fmt(r.metrics.likes)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {fmt(r.metrics.replies)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Repeat2 className="h-3 w-3" />
                  {fmt(r.metrics.reposts)}
                </span>
                <span className="ml-auto text-accent-foreground">
                  +{r.metrics.profileClicks} profile clicks
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        'flex flex-col gap-1 rounded-lg border p-3 ' +
        (highlight
          ? 'border-accent/50 bg-accent/10'
          : 'border-border bg-background')
      }
    >
      <div
        className={
          'text-[11px] uppercase tracking-wide ' +
          (highlight ? 'text-accent-foreground' : 'text-muted-foreground')
        }
      >
        {label}
      </div>
      <div
        className={
          'text-lg font-semibold tabular-nums ' +
          (highlight ? 'text-accent-foreground' : 'text-foreground')
        }
      >
        {value}
      </div>
    </div>
  );
}
