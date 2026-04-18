'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useSession } from '@/lib/store/session';

export function JobsReview() {
  const { session, setSession } = useSession();
  const jobs = session.jobs ?? [];

  const companyName = React.useMemo(() => {
    const url = session.intake?.companyUrl ?? '';
    try {
      if (!url) return 'this company';
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      const host = u.hostname.replace(/^www\./, '');
      const root = host.split('.')[0] ?? host;
      return root.charAt(0).toUpperCase() + root.slice(1);
    } catch {
      return 'this company';
    }
  }, [session.intake?.companyUrl]);

  function toggle(id: string) {
    setSession((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) => (j.id === id ? { ...j, selected: !j.selected } : j))
    }));
  }

  const selectedCount = jobs.filter((j) => j.selected).length;

  return (
    <div className="h-full overflow-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Open roles at {companyName}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {jobs.length === 0 ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {jobs.map((job) => (
                  <label
                    key={job.id}
                    htmlFor={`job-${job.id}`}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 transition-all duration-200 hover:bg-muted/60"
                  >
                    <Checkbox
                      id={`job-${job.id}`}
                      checked={job.selected}
                      onCheckedChange={() => toggle(job.id)}
                      className="mt-1"
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {job.title}
                        </span>
                        {job.team ? (
                          <Badge variant="outline" className="text-xs">
                            {job.team}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">{job.location}</div>
                    </div>
                    {job.applyUrl ? (
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 shrink-0 text-muted-foreground transition-all duration-200 hover:text-foreground"
                        aria-label="Open role"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {selectedCount} of {jobs.length} selected
                </span>
                <span className="text-xs text-muted-foreground">
                  Confirm your picks in the chat ↓
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
