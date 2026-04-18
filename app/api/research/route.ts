import { NextRequest } from 'next/server';
import {
  scrapeCompany,
  scrapeProfile,
  findJobs,
  searchWeb
} from '@/lib/tools';
import type { Intake, Job, LogEvent, ScrapedData } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ResearchPayload = { intake?: Partial<Intake> };

function sseEvent(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function makeLog(level: LogEvent['level'], message: string): LogEvent {
  return { t: Date.now(), level, message };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min));
}

async function writeLog(
  controller: ReadableStreamDefaultController<Uint8Array>,
  enc: TextEncoder,
  level: LogEvent['level'],
  message: string
) {
  controller.enqueue(enc.encode(sseEvent({ type: 'log', event: makeLog(level, message) })));
}

async function runDemoStream(
  controller: ReadableStreamDefaultController<Uint8Array>,
  enc: TextEncoder
) {
  const cached = (await import('@/data/cached-scrape-lumen.json')) as unknown as ScrapedData & {
    jobs: Job[];
  };
  const events: Array<[LogEvent['level'], string]> = [
    ['info', 'scraping lumen.dev\u2026'],
    ['ok', 'scraped 5 pages from lumen.dev'],
    ['info', 'scraping inspiration profiles: @dhh, @rauchg, @mipsytipsy'],
    ['ok', 'captured 9 inspiration posts'],
    ['info', 'calling perplexity for open roles\u2026'],
    ['ok', 'found 4 open roles'],
    ['info', 'searching web: competitors, pricing, funding']
  ];
  for (const [level, message] of events) {
    await sleep(jitter(200, 400));
    await writeLog(controller, enc, level, message);
  }
  controller.enqueue(
    enc.encode(
      sseEvent({
        type: 'data',
        scrapedData: {
          companyPages: cached.companyPages,
          inspirationProfiles: cached.inspirationProfiles,
          searchResults: cached.searchResults
        },
        jobs: cached.jobs
      })
    )
  );
  controller.enqueue(enc.encode(sseEvent({ type: 'done' })));
}

async function runLiveStream(
  controller: ReadableStreamDefaultController<Uint8Array>,
  enc: TextEncoder,
  intake: Partial<Intake>
) {
  const url = intake.companyUrl;
  if (!url) {
    await writeLog(controller, enc, 'warn', 'no company URL in intake \u2014 skipping live research');
    controller.enqueue(enc.encode(sseEvent({ type: 'done' })));
    return;
  }

  // Top 3 profiles (mix X + LinkedIn).
  const xHeroes = (intake.xHeroes ?? []).slice(0, 2);
  const linkedinHeroes = (intake.linkedinHeroes ?? []).slice(0, 1);
  const profiles: { handle: string; channel: 'x' | 'linkedin' }[] = [
    ...xHeroes.map((h) => ({ handle: h, channel: 'x' as const })),
    ...linkedinHeroes.map((h) => ({ handle: h, channel: 'linkedin' as const }))
  ].slice(0, 3);

  await writeLog(controller, enc, 'info', `scraping ${url}\u2026`);
  await writeLog(controller, enc, 'info', `profiling ${profiles.length} inspiration heroes`);
  await writeLog(controller, enc, 'info', 'calling perplexity for open roles\u2026');

  const companyP = scrapeCompany(url).then((r) => {
    void writeLog(
      controller,
      enc,
      r.ok ? 'ok' : 'warn',
      r.ok ? `scraped ${r.data.companyPages.length} page(s)` : `scrape failed: ${r.error}`
    );
    return r;
  });
  const profilesP = Promise.all(
    profiles.map((p) =>
      scrapeProfile(p.handle, p.channel).then((r) => {
        void writeLog(
          controller,
          enc,
          r.ok ? 'ok' : 'warn',
          r.ok
            ? `profile ${p.handle}: captured ${r.data.posts.length} posts`
            : `profile ${p.handle}: ${r.error}`
        );
        return r;
      })
    )
  );
  const jobsP = findJobs(url).then((r) => {
    void writeLog(
      controller,
      enc,
      r.ok ? 'ok' : 'warn',
      r.ok ? `found ${r.data.length} open roles` : `jobs failed: ${r.error}`
    );
    return r;
  });
  const searchP = Promise.all(
    [`${url} competitors`, `${url} pricing`].map((q) =>
      searchWeb(q).then((r) => {
        void writeLog(
          controller,
          enc,
          r.ok ? 'ok' : 'warn',
          r.ok ? `searched: ${q}` : `search failed: ${q}`
        );
        return r;
      })
    )
  );

  const [companyRes, profileRes, jobsRes, searchRes] = await Promise.all([
    companyP,
    profilesP,
    jobsP,
    searchP
  ]);

  const scrapedData: ScrapedData = {
    companyPages: companyRes.ok ? companyRes.data.companyPages : [],
    inspirationProfiles: profileRes.filter((r) => r.ok).map((r) => r.ok && r.data).filter(Boolean) as ScrapedData['inspirationProfiles'],
    searchResults: searchRes.filter((r) => r.ok).map((r) => r.ok && r.data).filter(Boolean) as ScrapedData['searchResults']
  };
  const jobs: Job[] = jobsRes.ok ? jobsRes.data : [];

  controller.enqueue(enc.encode(sseEvent({ type: 'data', scrapedData, jobs })));
  controller.enqueue(enc.encode(sseEvent({ type: 'done' })));
}

export async function GET(req: NextRequest) {
  return handle(req, {});
}

export async function POST(req: NextRequest) {
  let body: ResearchPayload = {};
  try {
    body = (await req.json()) as ResearchPayload;
  } catch {
    // ignore — empty body is fine
  }
  return handle(req, body);
}

async function handle(req: NextRequest, body: ResearchPayload) {
  const enc = new TextEncoder();
  const demo = req.nextUrl.searchParams.get('demo') === 'true';
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (demo) {
          await runDemoStream(controller, enc);
        } else {
          await runLiveStream(controller, enc, body.intake ?? {});
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        await writeLog(controller, enc, 'warn', `research crashed: ${msg}`);
        controller.enqueue(enc.encode(sseEvent({ type: 'done' })));
      } finally {
        controller.close();
      }
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}

