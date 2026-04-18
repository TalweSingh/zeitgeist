'use client';

import * as React from 'react';
import type { Job } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function JobsPickerComposer({
  jobs,
  disabled,
  onSubmit
}: {
  jobs: Job[];
  disabled?: boolean;
  onSubmit: (selectedIds: string[]) => void;
}) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const j of jobs) m[j.id] = j.selected;
    return m;
  });

  // Keep local state in sync when jobs list changes.
  React.useEffect(() => {
    setSelected((prev) => {
      const next: Record<string, boolean> = {};
      for (const j of jobs) next[j.id] = prev[j.id] ?? j.selected;
      return next;
    });
  }, [jobs]);

  const toggle = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const canSubmit = selectedIds.length > 0 && !disabled;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Pick roles to write hiring posts for
      </div>
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-background p-2">
        {jobs.length === 0 ? (
          <div className="p-2 text-xs text-muted-foreground">No jobs found.</div>
        ) : (
          jobs.map((j) => (
            <label
              key={j.id}
              className="flex cursor-pointer items-start gap-2 rounded-sm p-2 hover:bg-accent hover:text-accent-foreground"
            >
              <Checkbox
                checked={!!selected[j.id]}
                onCheckedChange={() => toggle(j.id)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{j.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {j.location}
                  {j.team ? ` · ${j.team}` : ''}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          {selectedIds.length} selected
        </Label>
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={() => onSubmit(selectedIds)}
        >
          Write posts for these
        </Button>
      </div>
    </div>
  );
}
