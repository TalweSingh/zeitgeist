import type { Phase, Session } from '@/types';
import {
  INTAKE_SYSTEM,
  RESEARCH_SYSTEM,
  JOBS_REVIEW_SYSTEM,
  BRAND_SYNTHESIS_SYSTEM,
  STRATEGY_SYSTEM,
  GENERATION_SYSTEM
} from './prompts';

// Phase -> {systemPrompt, allowedTools, advanceCriterion}.
// Single object map. Tuning a phase = one edit.
export type PhaseSpec = {
  systemPrompt: string;
  allowedTools: string[];
  advanceCriterion: (session: Session) => boolean;
};

const intakeFilled = (s: Session): boolean => {
  const i = s.intake;
  return !!(
    i.companyUrl &&
    i.linkedinHeroes?.length &&
    i.xHeroes?.length &&
    i.favoritePosts?.length &&
    i.audience &&
    i.voicePrefs?.length
  );
};

export const PHASES: Record<Phase, PhaseSpec> = {
  intake: {
    systemPrompt: INTAKE_SYSTEM,
    allowedTools: [],
    advanceCriterion: intakeFilled
  },
  research: {
    systemPrompt: RESEARCH_SYSTEM,
    // Research is performed by /api/research; the turn in this phase is a summary only.
    allowedTools: [],
    advanceCriterion: (s) => !!s.scrapedData && s.jobs.length > 0
  },
  jobs_review: {
    systemPrompt: JOBS_REVIEW_SYSTEM,
    allowedTools: [],
    advanceCriterion: (s) => s.jobs.some((j) => j.selected)
  },
  brand_identity: {
    systemPrompt: BRAND_SYNTHESIS_SYSTEM,
    // Brand synthesis composes JSON from the CONTEXT block — no tools needed.
    // Granting checkBrandFit here caused the model to invent drafts, score them
    // in a multi-iteration tool loop, and hit MAX_ITERATIONS before emitting
    // the final brief.
    allowedTools: [],
    // Never auto-advance. The user drives transition via BrandBriefCard's Approve button.
    advanceCriterion: () => false
  },
  strategy: {
    systemPrompt: STRATEGY_SYSTEM,
    allowedTools: [],
    advanceCriterion: (s) => !!s.strategy
  },
  content: {
    systemPrompt: GENERATION_SYSTEM,
    allowedTools: ['getPerformanceHistory', 'checkBrandFit'],
    advanceCriterion: () => false
  }
};

// Back-compat alias; some upstream readers may import `phases`.
export const phases = PHASES;

export const NEXT_PHASE: Record<Phase, Phase | null> = {
  intake: 'research',
  research: 'jobs_review',
  jobs_review: 'brand_identity',
  brand_identity: 'strategy',
  strategy: 'content',
  content: null
};

