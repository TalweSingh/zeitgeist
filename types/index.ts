export type Phase =
  | 'intake'
  | 'research'
  | 'jobs_review'
  | 'brand_identity'
  | 'strategy'
  | 'content';

export type Intake = {
  subjectType: 'brand' | 'individual';
  companyUrl: string;
  linkedinHeroes: string[];
  xHeroes: string[];
  favoritePosts: string[];
  audience: string;
  voicePrefs: string[];
};

export type ScrapedData = {
  companyPages: { url: string; text: string }[];
  inspirationProfiles: {
    handle: string;
    channel: 'x' | 'linkedin';
    posts: string[];
  }[];
  searchResults: { query: string; summary: string }[];
};

export type Job = {
  id: string;
  title: string;
  location: string;
  team?: string;
  applyUrl: string;
  selected: boolean;
};

export type BrandBrief = {
  positioning: string;
  audience: string;
  voice: {
    adjectives: string[];
    soundsLike: string[];
    doesntSoundLike: string[];
  };
  pillars: string[]; // 4–6 content pillars
  visualCues?: string[];
  inspirationPatterns: string[]; // STRUCTURAL patterns, not themes
  hiringAngles: { jobId: string; angle: string }[];
  noGoList: string[]; // ≥ 2 concrete items
};

export type Strategy = {
  channels: ('x' | 'linkedin')[];
  cadence: string;
  targetReplyAccounts: string[];
  autoPostX: boolean;
};

export type Draft = {
  id: string;
  channel: 'x' | 'linkedin';
  kind: 'general' | 'hiring';
  jobId?: string;
  body: string;
  rationale: string; // ONE sentence linking to a learning or pattern
  predictedEngagement: 'low' | 'med' | 'high';
  brandFitScore: number; // 0–1
  rejected?: { reason: string };
};

export type PerformanceRecord = {
  id: string;
  channel: 'x' | 'linkedin';
  weekOf: string;
  body: string;
  metrics: {
    impressions: number;
    likes: number;
    reposts: number;
    replies: number;
    bookmarks: number;
  };
  notes: string; // pattern-tagged diagnosis
};

export type Learning = {
  insight: string;
  evidence: string[] /* PerformanceRecord ids */;
};

export type LogEvent = {
  t: number;
  level: 'info' | 'ok' | 'warn';
  message: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system' | 'log';
  content: string;
  meta?: any;
};

export type InferredIntake = {
  audience: string;
  voicePrefs: string[];
  linkedinHeroes: { handle: string; rationale: string }[];
  xHeroes: { handle: string; rationale: string }[];
};

export type Session = {
  id: string;
  phase: Phase;
  chatMessages: ChatMessage[];
  intake: Partial<Intake>;
  scrapedData?: ScrapedData;
  jobs: Job[];
  brandBrief?: BrandBrief;
  strategy?: Strategy;
  drafts: Draft[];
  performanceHistory: PerformanceRecord[];
  logEvents: LogEvent[];
  inferredIntake?: InferredIntake;
  inferredApproved?: boolean;
};
