// Friendly user-facing labels for tool calls emitted by the agent loop.
// Keeps the activity-log copy consistent across phases.

type Input = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function describeToolCall(name: string, input: Input = {}): string {
  switch (name) {
    case 'scrapeCompany': {
      const url = str(input.url);
      return url ? `scraping ${url}…` : 'scraping company site…';
    }
    case 'scrapeProfile': {
      const handle = str(input.handle);
      const ch = str(input.channel) ?? 'x';
      return handle ? `reading ${handle} on ${ch}…` : `reading inspiration profile on ${ch}…`;
    }
    case 'findJobs': {
      const url = str(input.companyUrl);
      return url ? `checking careers page at ${url}…` : 'checking careers page for open roles…';
    }
    case 'searchWeb': {
      const q = str(input.query);
      return q ? `searching web: ${q}` : 'searching the web…';
    }
    case 'getPerformanceHistory':
      return 'pulling post performance history…';
    case 'checkBrandFit': {
      const draft = (input.draft as { body?: string } | undefined)?.body;
      const preview = draft ? draft.slice(0, 60).replace(/\s+/g, ' ') : null;
      return preview
        ? `checking brand fit — “${preview}${draft && draft.length > 60 ? '…' : ''}”`
        : 'running brand-fit check on draft…';
    }
    default:
      return `calling ${name}…`;
  }
}

export function describePhaseKickoff(phase: string): string | null {
  switch (phase) {
    case 'brand_identity':
      return 'synthesizing brand brief from intake + research…';
    case 'content':
      return 'generating on-brand drafts for selected roles…';
    case 'jobs_review':
      return 'reviewing open roles…';
    case 'strategy':
      return 'drafting posting strategy…';
    default:
      return null;
  }
}
