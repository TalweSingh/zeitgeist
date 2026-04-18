'use client';

import * as React from 'react';
import { useSession } from '@/lib/store/session';
import { Heart, MessageCircle, Repeat2, Eye, ExternalLink } from 'lucide-react';

type ReplyRow = {
  id: string;
  target: string;
  targetPost: string;
  reply: string;
  postedDaysAgo: number;
  metrics: { impressions: number; likes: number; replies: number; reposts: number; profileClicks: number };
};

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
  const targets = session.strategy?.targetReplyAccounts ?? session.intake?.xHeroes ?? [];
  const targetSet = new Set(targets.map((t) => t.toLowerCase()));
  const rows = MOCK_REPLIES.filter(
    (r) => targetSet.size === 0 || targetSet.has(r.target.toLowerCase())
  );
  const effective = rows.length > 0 ? rows : MOCK_REPLIES;

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

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Replies sent" value={effective.length.toString()} />
        <Tile label="Impressions" value={fmt(totals.impressions)} />
        <Tile label="Avg likes" value={fmt(avgLikes)} />
        <Tile label="Profile clicks" value={fmt(totals.profileClicks)} />
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

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
