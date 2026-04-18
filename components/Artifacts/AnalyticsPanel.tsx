'use client';

import * as React from 'react';
import { useSession } from '@/lib/store/session';
import { Badge } from '@/components/ui/badge';
import { Twitter, Linkedin, TrendingUp, Heart, Repeat2, MessageCircle, Bookmark, Eye } from 'lucide-react';
import type { PerformanceRecord } from '@/types';

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toString();
}

function totalEngagement(r: PerformanceRecord): number {
  return r.metrics.likes + r.metrics.reposts + r.metrics.replies + r.metrics.bookmarks;
}

function engagementRate(r: PerformanceRecord): number {
  if (r.metrics.impressions === 0) return 0;
  return totalEngagement(r) / r.metrics.impressions;
}

export function AnalyticsPanel() {
  const { session } = useSession();
  const records = session.performanceHistory ?? [];

  const totals = records.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.metrics.impressions,
      likes: acc.likes + r.metrics.likes,
      reposts: acc.reposts + r.metrics.reposts,
      replies: acc.replies + r.metrics.replies,
      bookmarks: acc.bookmarks + r.metrics.bookmarks
    }),
    { impressions: 0, likes: 0, reposts: 0, replies: 0, bookmarks: 0 }
  );

  const avgImpressions = records.length ? Math.round(totals.impressions / records.length) : 0;
  const avgEngagementRate = records.length
    ? records.reduce((a, r) => a + engagementRate(r), 0) / records.length
    : 0;

  const byWeek = React.useMemo(() => {
    const m = new Map<string, { impressions: number; engagement: number; count: number }>();
    for (const r of records) {
      const cur = m.get(r.weekOf) ?? { impressions: 0, engagement: 0, count: 0 };
      cur.impressions += r.metrics.impressions;
      cur.engagement += totalEngagement(r);
      cur.count += 1;
      m.set(r.weekOf, cur);
    }
    return Array.from(m.entries())
      .map(([weekOf, v]) => ({ weekOf, ...v }))
      .sort((a, b) => a.weekOf.localeCompare(b.weekOf));
  }, [records]);

  const maxWeekImp = Math.max(1, ...byWeek.map((w) => w.impressions));

  const sorted = [...records].sort((a, b) => b.metrics.impressions - a.metrics.impressions);
  const top = sorted.slice(0, 3);
  const bottom = sorted.slice(-3).reverse();

  if (records.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        No analytics yet. Once posts go live, performance will show up here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<Eye className="h-3.5 w-3.5" />} label="Impressions" value={fmt(totals.impressions)} />
        <StatTile icon={<Heart className="h-3.5 w-3.5" />} label="Likes" value={fmt(totals.likes)} />
        <StatTile icon={<Repeat2 className="h-3.5 w-3.5" />} label="Reposts" value={fmt(totals.reposts)} />
        <StatTile
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Avg eng. rate"
          value={`${(avgEngagementRate * 100).toFixed(1)}%`}
        />
      </div>

      <section className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-foreground">Weekly impressions</h3>
          <span className="text-[11px] text-muted-foreground">
            avg {fmt(avgImpressions)}/post across {records.length} posts
          </span>
        </div>
        <div className="flex items-end gap-2 pt-2">
          {byWeek.map((w) => (
            <div key={w.weekOf} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-accent/60 to-accent"
                style={{ height: `${Math.max(8, (w.impressions / maxWeekImp) * 120)}px` }}
                title={`${fmt(w.impressions)} impressions, ${w.count} posts`}
              />
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {w.weekOf.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PostList title="Top posts" tint="success" records={top} />
        <PostList title="Underperformers" tint="warn" records={bottom} />
      </section>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function PostList({
  title,
  tint,
  records
}: {
  title: string;
  tint: 'success' | 'warn';
  records: PerformanceRecord[];
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Badge
          variant={tint === 'success' ? 'success' : 'outline'}
          className="text-[10px]"
        >
          {records.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2">
        {records.map((r) => {
          const Icon = r.channel === 'x' ? Twitter : Linkedin;
          return (
            <div
              key={r.id}
              className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-2"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Icon className="h-3 w-3" />
                {r.channel}
                <span className="text-[10px] text-muted-foreground/80">· week of {r.weekOf}</span>
              </div>
              <p className="line-clamp-2 text-[12px] text-foreground">{r.body}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {fmt(r.metrics.impressions)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {fmt(r.metrics.likes)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Repeat2 className="h-3 w-3" />
                  {fmt(r.metrics.reposts)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {fmt(r.metrics.replies)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bookmark className="h-3 w-3" />
                  {fmt(r.metrics.bookmarks)}
                </span>
                <span className="ml-auto text-[11px] text-accent-foreground">
                  {(engagementRate(r) * 100).toFixed(1)}% eng.
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
