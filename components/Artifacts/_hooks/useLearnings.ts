'use client';

import * as React from 'react';
import type { Learning, PerformanceRecord } from '@/types';

function engagement(r: PerformanceRecord) {
  const { likes, reposts, replies, bookmarks, impressions } = r.metrics;
  const numerator = likes + reposts * 2 + replies * 1.5 + bookmarks;
  return impressions > 0 ? numerator / impressions : 0;
}

function startsWithNumber(body: string) {
  const firstTen = body.split(/\s+/).slice(0, 10).join(' ');
  return /\d/.test(firstTen);
}

function startsAbstract(body: string) {
  const head = body.toLowerCase().trim();
  return /^(in today'?s|in a world|as we|here'?s why|at the end of the day|every team should)/.test(head);
}

function round(n: number, d = 1) {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
}

function localLearnings(history: PerformanceRecord[]): Learning[] {
  if (!history || history.length === 0) return [];
  const withNum = history.filter((r) => startsWithNumber(r.body));
  const withoutNum = history.filter((r) => !startsWithNumber(r.body));
  const abstract = history.filter((r) => startsAbstract(r.body));
  const xOnly = history.filter((r) => r.channel === 'x');
  const liOnly = history.filter((r) => r.channel === 'linkedin');

  const avg = (arr: PerformanceRecord[]) =>
    arr.length ? arr.reduce((s, r) => s + engagement(r), 0) / arr.length : 0;

  const out: Learning[] = [];

  if (withNum.length >= 2 && withoutNum.length >= 1) {
    const ratio = avg(withoutNum) > 0 ? avg(withNum) / avg(withoutNum) : 0;
    out.push({
      insight: `Posts opening with a concrete number in the first 10 words averaged ${round(ratio, 1)}x the engagement of those without.`,
      evidence: withNum.slice(0, 3).map((r) => r.id)
    });
  }

  if (abstract.length >= 2) {
    out.push({
      insight: `Abstract openers ("In today's world", "Here's why...") underperformed every time — averaged ${round(avg(abstract) * 1000, 1)} engagement per 1k impressions.`,
      evidence: abstract.slice(0, 3).map((r) => r.id)
    });
  }

  if (xOnly.length >= 2 && liOnly.length >= 2) {
    const xa = avg(xOnly);
    const la = avg(liOnly);
    const [winner, loser, ratio] =
      xa >= la ? ['X', 'LinkedIn', xa / (la || 1)] : ['LinkedIn', 'X', la / (xa || 1)];
    out.push({
      insight: `${winner} posts out-engaged ${loser} by ${round(Number(ratio), 1)}x on equivalent hooks.`,
      evidence: (winner === 'X' ? xOnly : liOnly).slice(0, 3).map((r) => r.id)
    });
  }

  const short = history.filter((r) => r.body.length < 140);
  const long = history.filter((r) => r.body.length >= 140);
  if (short.length >= 2 && long.length >= 2) {
    const sr = avg(short);
    const lr = avg(long);
    if (Math.abs(sr - lr) / Math.max(sr, lr, 0.0001) > 0.2) {
      const [winner, loser, ratio] =
        sr > lr ? ['Short (<140 char)', 'longer', sr / (lr || 1)] : ['Longer', 'short', lr / (sr || 1)];
      out.push({
        insight: `${winner} posts averaged ${round(ratio, 1)}x the engagement of ${loser} ones.`,
        evidence: (sr > lr ? short : long).slice(0, 3).map((r) => r.id)
      });
    }
  }

  return out.slice(0, 5);
}

export function useLearnings(history: PerformanceRecord[]): {
  learnings: Learning[];
  loading: boolean;
  source: 'api' | 'local' | 'empty';
} {
  const [state, setState] = React.useState<{
    learnings: Learning[];
    loading: boolean;
    source: 'api' | 'local' | 'empty';
  }>(() => ({ learnings: [], loading: true, source: 'empty' }));

  const sig = React.useMemo(
    () => history.map((r) => r.id).join('|'),
    [history]
  );

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!history || history.length === 0) {
        if (!cancelled) setState({ learnings: [], loading: false, source: 'empty' });
        return;
      }
      setState((p) => ({ ...p, loading: true }));
      try {
        const res = await fetch('/api/learnings', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ performanceHistory: history })
        });
        if (res.ok) {
          const json = (await res.json()) as { learnings?: Learning[] };
          if (json.learnings && json.learnings.length > 0) {
            if (!cancelled)
              setState({ learnings: json.learnings, loading: false, source: 'api' });
            return;
          }
        }
      } catch {
        // fall through to local heuristic
      }
      const local = localLearnings(history);
      if (!cancelled)
        setState({
          learnings: local,
          loading: false,
          source: local.length > 0 ? 'local' : 'empty'
        });
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return state;
}
