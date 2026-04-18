'use client';

import * as React from 'react';
import type { Draft, Learning, PerformanceRecord } from '@/types';
import { useLearnings } from './_hooks/useLearnings';
import { useSession } from '@/lib/store/session';

export type SimulatedMetrics = {
  impressions: number;
  likes: number;
  reposts: number;
  delta: number; // vs channel history avg engagement ratio
};

type Ctx = {
  learnings: Learning[];
  learningsLoading: boolean;
  selectedLearningIdx: number | null;
  setSelectedLearningIdx: (i: number | null) => void;
  simulated: boolean;
  simulate: () => void;
  getSimulatedMetrics: (draft: Draft) => SimulatedMetrics | null;
  learningApplies: (draft: Draft, learningIdx: number) => boolean;
  getAppliedLearningIdx: (draft: Draft) => number | null;
  getEvidenceRecords: (learningIdx: number) => PerformanceRecord[];
  history: PerformanceRecord[];
  weeksSpan: number;
  forecastMultiplier: number;
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
  const [simulated, setSimulated] = React.useState(false);

  const simulate = React.useCallback(() => setSimulated(true), []);

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

  const getSimulatedMetrics = React.useCallback(
    (draft: Draft): SimulatedMetrics | null => {
      if (!simulated) return null;
      const c = channelAvg[draft.channel];
      if (!c || c.n === 0) return null;
      const mult =
        draft.predictedEngagement === 'high' ? 2.1 : draft.predictedEngagement === 'med' ? 1.15 : 0.55;
      const rng = seededRng(djb2(draft.id));
      const jitter = 0.9 + rng() * 0.25;
      const factor = mult * jitter;
      return {
        impressions: Math.round((c.imp / c.n) * factor),
        likes: Math.round((c.likes / c.n) * factor),
        reposts: Math.round((c.rep / c.n) * factor),
        delta: factor
      };
    },
    [simulated, channelAvg]
  );

  const learningApplies = React.useCallback(
    (draft: Draft, idx: number): boolean => {
      const l = learnings[idx];
      if (!l) return false;
      return rationaleMatchesTopic(draft.rationale ?? '', topicOf(l.insight));
    },
    [learnings]
  );

  const getAppliedLearningIdx = React.useCallback(
    (draft: Draft): number | null => {
      for (let i = 0; i < learnings.length; i++) {
        if (learningApplies(draft, i)) return i;
      }
      return null;
    },
    [learnings, learningApplies]
  );

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

  const value: Ctx = {
    learnings,
    learningsLoading: loading,
    selectedLearningIdx,
    setSelectedLearningIdx,
    simulated,
    simulate,
    getSimulatedMetrics,
    learningApplies,
    getAppliedLearningIdx,
    getEvidenceRecords,
    history,
    weeksSpan,
    forecastMultiplier
  };

  return <ContentBoardCtx.Provider value={value}>{children}</ContentBoardCtx.Provider>;
}

export function useContentBoard(): Ctx {
  const v = React.useContext(ContentBoardCtx);
  if (!v) throw new Error('useContentBoard must be used inside <ContentBoardProvider>');
  return v;
}
