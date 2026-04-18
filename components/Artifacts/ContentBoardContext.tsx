'use client';

import * as React from 'react';
import type { Draft, Learning, PerformanceRecord } from '@/types';
import { useLearnings } from './_hooks/useLearnings';
import { useSession } from '@/lib/store/session';

export type WeekMetrics = {
  impressions: number;
  likes: number;
  reposts: number;
  delta: number; // factor vs channel history avg
};

export type SimulatedMetrics = {
  week1: WeekMetrics;
  week2: WeekMetrics | null;
};

export type SimulationFindings = {
  appliedCount: number;
  unappliedCount: number;
  week1AppliedAvg: number;
  week1UnappliedAvg: number;
  week2AppliedAvg: number;
  week2UnappliedAvg: number;
  topInsight: string | null;
};

type Ctx = {
  learnings: Learning[];
  learningsLoading: boolean;
  selectedLearningIdx: number | null;
  setSelectedLearningIdx: (i: number | null) => void;
  simulatedWeek: 0 | 1 | 2;
  simulate: () => void;
  getSimulatedMetrics: (draft: Draft) => SimulatedMetrics | null;
  learningApplies: (draft: Draft, learningIdx: number) => boolean;
  getAppliedLearningIdx: (draft: Draft) => number | null;
  getEvidenceRecords: (learningIdx: number) => PerformanceRecord[];
  history: PerformanceRecord[];
  weeksSpan: number;
  forecastMultiplier: number;
  findings: SimulationFindings | null;
};

const ContentBoardCtx = React.createContext<Ctx | null>(null);

function djb2(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}
function seededRng(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function topicOf(insight: string): 'numberHook' | 'abstractOpener' | 'channel' | 'length' | 'other' {
  const s = insight.toLowerCase();
  if (/(concrete )?number|\$|dollar|stat|digit/.test(s)) return 'numberHook';
  if (/abstract|platitude|in today'?s|generic/.test(s)) return 'abstractOpener';
  if (/out[- ]engaged|linkedin|x post|channel/.test(s)) return 'channel';
  if (/short|long|\bchar\b|length|paragraph/.test(s)) return 'length';
  return 'other';
}

function rationaleMatchesTopic(rationale: string, topic: ReturnType<typeof topicOf>): boolean {
  const r = (rationale || '').toLowerCase();
  if (topic === 'numberHook')
    return /number|concrete|\d|\$|stat|figure|%|\bx\b engagement/.test(r);
  if (topic === 'abstractOpener') return /avoid|abstract|platitude|generic|concrete/.test(r);
  if (topic === 'channel') return /linkedin|x post|channel|handle/.test(r);
  if (topic === 'length') return /short|long|concise|paragraph|brevity|length/.test(r);
  return false;
}

export function ContentBoardProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const history = React.useMemo(
    () => session.performanceHistory ?? [],
    [session.performanceHistory]
  );
  const { learnings, loading } = useLearnings(history);
  const [selectedLearningIdx, setSelectedLearningIdx] = React.useState<number | null>(null);
  const [simulatedWeek, setSimulatedWeek] = React.useState<0 | 1 | 2>(0);

  const simulate = React.useCallback(() => {
    setSimulatedWeek((w) => (w >= 2 ? 2 : ((w + 1) as 0 | 1 | 2)));
  }, []);

  // Derived weekly span.
  const weeksSpan = React.useMemo(() => {
    const weeks = new Set(history.map((r) => r.weekOf));
    return weeks.size;
  }, [history]);

  // Channel history averages (once).
  const channelAvg = React.useMemo(() => {
    const acc: Record<'x' | 'linkedin', { imp: number; likes: number; rep: number; n: number }> = {
      x: { imp: 0, likes: 0, rep: 0, n: 0 },
      linkedin: { imp: 0, likes: 0, rep: 0, n: 0 }
    };
    for (const r of history) {
      const b = acc[r.channel];
      b.imp += r.metrics.impressions;
      b.likes += r.metrics.likes;
      b.rep += r.metrics.reposts;
      b.n += 1;
    }
    return acc;
  }, [history]);

  const learningApplies0 = React.useCallback(
    (draft: Draft, idx: number): boolean => {
      const l = learnings[idx];
      if (!l) return false;
      return rationaleMatchesTopic(draft.rationale ?? '', topicOf(l.insight));
    },
    [learnings]
  );

  const getAppliedLearningIdx0 = React.useCallback(
    (draft: Draft): number | null => {
      for (let i = 0; i < learnings.length; i++) {
        if (learningApplies0(draft, i)) return i;
      }
      return null;
    },
    [learnings, learningApplies0]
  );

  const getSimulatedMetrics = React.useCallback(
    (draft: Draft): SimulatedMetrics | null => {
      if (simulatedWeek === 0) return null;
      const c = channelAvg[draft.channel];
      if (!c || c.n === 0) return null;
      const mult =
        draft.predictedEngagement === 'high' ? 2.1 : draft.predictedEngagement === 'med' ? 1.15 : 0.55;
      const rng = seededRng(djb2(draft.id));
      const jitter = 0.9 + rng() * 0.25;
      const factor1 = mult * jitter;
      const w1: WeekMetrics = {
        impressions: Math.round((c.imp / c.n) * factor1),
        likes: Math.round((c.likes / c.n) * factor1),
        reposts: Math.round((c.rep / c.n) * factor1),
        delta: factor1
      };
      let w2: WeekMetrics | null = null;
      if (simulatedWeek === 2) {
        // Learning-applied drafts get a 1.35x boost in week 2 (the brain
        // re-weights them); unapplied drafts decay to 0.88x. Layered with
        // a second seeded jitter so numbers feel organic.
        const applied = getAppliedLearningIdx0(draft) !== null;
        const rng2 = seededRng(djb2(draft.id + '-w2'));
        const jitter2 = 0.92 + rng2() * 0.2;
        const boost = applied ? 1.35 : 0.88;
        const factor2 = factor1 * boost * jitter2;
        w2 = {
          impressions: Math.round((c.imp / c.n) * factor2),
          likes: Math.round((c.likes / c.n) * factor2),
          reposts: Math.round((c.rep / c.n) * factor2),
          delta: factor2
        };
      }
      return { week1: w1, week2: w2 };
    },
    [simulatedWeek, channelAvg, getAppliedLearningIdx0]
  );

  const learningApplies = learningApplies0;
  const getAppliedLearningIdx = getAppliedLearningIdx0;

  const getEvidenceRecords = React.useCallback(
    (idx: number): PerformanceRecord[] => {
      const l = learnings[idx];
      if (!l) return [];
      const byId: Record<string, PerformanceRecord> = {};
      for (const r of history) byId[r.id] = r;
      return (l.evidence ?? [])
        .map((id) => byId[id])
        .filter((r): r is PerformanceRecord => !!r)
        .slice(0, 2);
    },
    [learnings, history]
  );

  // Forecast multiplier: simple average of non-rejected drafts' predicted multipliers.
  const forecastMultiplier = React.useMemo(() => {
    const drafts = session.drafts ?? [];
    const usable = drafts.filter((d) => !d.rejected);
    if (usable.length === 0) return 1;
    let sum = 0;
    for (const d of usable) {
      sum += d.predictedEngagement === 'high' ? 2.1 : d.predictedEngagement === 'med' ? 1.15 : 0.55;
    }
    return sum / usable.length;
  }, [session.drafts]);

  // Findings: aggregate stats that power the narrative panel after simulation.
  const findings = React.useMemo<SimulationFindings | null>(() => {
    if (simulatedWeek === 0) return null;
    const drafts = (session.drafts ?? []).filter((d) => !d.rejected);
    if (drafts.length === 0) return null;
    const applied: Draft[] = [];
    const unapplied: Draft[] = [];
    for (const d of drafts) {
      if (getAppliedLearningIdx0(d) !== null) applied.push(d);
      else unapplied.push(d);
    }
    const avg = (arr: Draft[], week: 1 | 2): number => {
      if (arr.length === 0) return 0;
      let sum = 0;
      let n = 0;
      for (const d of arr) {
        const m = getSimulatedMetrics(d);
        const pick = week === 1 ? m?.week1 : m?.week2;
        if (pick) {
          sum += pick.delta;
          n++;
        }
      }
      return n === 0 ? 0 : sum / n;
    };
    // Top insight = most-applied learning across drafts.
    const counts = new Map<number, number>();
    for (const d of drafts) {
      const idx = getAppliedLearningIdx0(d);
      if (idx !== null) counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
    let topIdx: number | null = null;
    let topCount = 0;
    for (const [idx, c] of counts) {
      if (c > topCount) {
        topIdx = idx;
        topCount = c;
      }
    }
    return {
      appliedCount: applied.length,
      unappliedCount: unapplied.length,
      week1AppliedAvg: avg(applied, 1),
      week1UnappliedAvg: avg(unapplied, 1),
      week2AppliedAvg: simulatedWeek === 2 ? avg(applied, 2) : 0,
      week2UnappliedAvg: simulatedWeek === 2 ? avg(unapplied, 2) : 0,
      topInsight: topIdx !== null ? learnings[topIdx]?.insight ?? null : null
    };
  }, [simulatedWeek, session.drafts, getAppliedLearningIdx0, getSimulatedMetrics, learnings]);

  const value: Ctx = {
    learnings,
    learningsLoading: loading,
    selectedLearningIdx,
    setSelectedLearningIdx,
    simulatedWeek,
    simulate,
    getSimulatedMetrics,
    learningApplies,
    getAppliedLearningIdx,
    getEvidenceRecords,
    history,
    weeksSpan,
    forecastMultiplier,
    findings
  };

  return <ContentBoardCtx.Provider value={value}>{children}</ContentBoardCtx.Provider>;
}

export function useContentBoard(): Ctx {
  const v = React.useContext(ContentBoardCtx);
  if (!v) throw new Error('useContentBoard must be used inside <ContentBoardProvider>');
  return v;
}
