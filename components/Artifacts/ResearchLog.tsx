'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/store/session';
import { Info, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogEvent } from '@/types';

function LevelIcon({ level }: { level: LogEvent['level'] }) {
  if (level === 'ok') return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (level === 'warn') return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <Info className="h-4 w-4 text-muted-foreground" />;
}

function formatTs(t: number) {
  try {
    const d = new Date(t);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '';
  }
}

export function ResearchLog() {
  const { session } = useSession();
  const logEvents = session.logEvents ?? [];
  const scraped = session.scrapedData;
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [rawOpen, setRawOpen] = React.useState(false);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logEvents.length]);

  const pages = React.useMemo(
    () => scraped?.companyPages ?? [],
    [scraped?.companyPages]
  );
  const inspiration = scraped?.inspirationProfiles ?? [];
  const search = scraped?.searchResults ?? [];

  const companyName = React.useMemo(() => {
    const url = session.intake?.companyUrl ?? pages[0]?.url ?? '';
    try {
      if (!url) return 'Company';
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      const host = u.hostname.replace(/^www\./, '');
      const root = host.split('.')[0] ?? host;
      return root.charAt(0).toUpperCase() + root.slice(1);
    } catch {
      return 'Company';
    }
  }, [session.intake?.companyUrl, pages]);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Research</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={scrollRef}
              className="flex max-h-80 flex-col gap-1.5 overflow-auto rounded-md border border-border bg-muted/40 p-3"
            >
              {logEvents.length === 0 ? (
                <span className="font-mono text-sm text-muted-foreground">
                  Waiting for research to start…
                </span>
              ) : (
                logEvents.map((ev, i) => (
                  <div
                    key={`${ev.t}-${i}`}
                    className="flex items-start gap-2 font-mono text-sm"
                  >
                    <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">
                      {formatTs(ev.t)}
                    </span>
                    <span className="mt-0.5 shrink-0">
                      <LevelIcon level={ev.level} />
                    </span>
                    <span
                      className={cn(
                        'whitespace-pre-wrap break-words',
                        ev.level === 'warn'
                          ? 'text-warning'
                          : ev.level === 'ok'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      )}
                    >
                      {ev.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {scraped ? (
          <Card>
            <CardHeader>
              <CardTitle>{companyName}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <SummaryStat label="Pages scraped" value={pages.length} />
                <SummaryStat label="Inspiration profiles" value={inspiration.length} />
                <SummaryStat label="Search results" value={search.length} />
              </div>

              <button
                type="button"
                onClick={() => setRawOpen((v) => !v)}
                className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition-all duration-200 hover:text-foreground"
              >
                {rawOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                View raw data
              </button>

              {rawOpen ? (
                <Tabs defaultValue="pages">
                  <TabsList>
                    <TabsTrigger value="pages">Pages ({pages.length})</TabsTrigger>
                    <TabsTrigger value="inspiration">
                      Inspiration ({inspiration.length})
                    </TabsTrigger>
                    <TabsTrigger value="search">Search ({search.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pages" className="flex flex-col gap-2">
                    {pages.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No pages.</span>
                    ) : (
                      pages.map((p, i) => (
                        <div
                          key={`p-${i}`}
                          className="rounded-md border border-border bg-muted/40 p-3"
                        >
                          <div className="mb-1 text-xs text-muted-foreground">{p.url}</div>
                          <div className="line-clamp-4 text-sm text-foreground">{p.text}</div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="inspiration" className="flex flex-col gap-2">
                    {inspiration.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No profiles.</span>
                    ) : (
                      inspiration.map((p, i) => (
                        <div
                          key={`i-${i}`}
                          className="rounded-md border border-border bg-muted/40 p-3"
                        >
                          <div className="mb-1 text-xs text-muted-foreground">
                            {p.handle} · {p.channel}
                          </div>
                          <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-foreground">
                            {p.posts.slice(0, 3).map((post, j) => (
                              <li key={j} className="line-clamp-2">
                                {post}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="search" className="flex flex-col gap-2">
                    {search.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No results.</span>
                    ) : (
                      search.map((s, i) => (
                        <div
                          key={`s-${i}`}
                          className="rounded-md border border-border bg-muted/40 p-3"
                        >
                          <div className="mb-1 text-xs text-muted-foreground">{s.query}</div>
                          <div className="text-sm text-foreground">{s.summary}</div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              ) : null}
            </CardContent>
          </Card>
        ) : logEvents.length > 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-2 pt-6">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 p-3">
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
