'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/store/session';
import type { BrandBrief } from '@/types';
import { Pencil, Check } from 'lucide-react';
import { ActivityLog } from '@/components/shared/ActivityLog';

const MAX_REVISIONS = 3;

function toLines(arr: string[] | undefined) {
  return (arr ?? []).join('\n');
}
function fromLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

type Draft = {
  positioning: string;
  audience: string;
  adjectives: string;
  soundsLike: string;
  doesntSoundLike: string;
  pillars: string;
  inspirationPatterns: string;
  hiringAngles: string;
  noGoList: string;
};

function briefToDraft(b: BrandBrief): Draft {
  return {
    positioning: b.positioning ?? '',
    audience: b.audience ?? '',
    adjectives: toLines(b.voice?.adjectives),
    soundsLike: toLines(b.voice?.soundsLike),
    doesntSoundLike: toLines(b.voice?.doesntSoundLike),
    pillars: toLines(b.pillars),
    inspirationPatterns: toLines(b.inspirationPatterns),
    hiringAngles: (b.hiringAngles ?? [])
      .map((h) => `${h.jobId}: ${h.angle}`)
      .join('\n'),
    noGoList: toLines(b.noGoList)
  };
}

function draftToBrief(d: Draft, prev: BrandBrief): BrandBrief {
  return {
    positioning: d.positioning.trim(),
    audience: d.audience.trim(),
    voice: {
      adjectives: fromLines(d.adjectives),
      soundsLike: fromLines(d.soundsLike),
      doesntSoundLike: fromLines(d.doesntSoundLike)
    },
    pillars: fromLines(d.pillars),
    visualCues: prev.visualCues,
    inspirationPatterns: fromLines(d.inspirationPatterns),
    hiringAngles: fromLines(d.hiringAngles).map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return { jobId: 'unknown', angle: line.trim() };
      return {
        jobId: line.slice(0, idx).trim(),
        angle: line.slice(idx + 1).trim()
      };
    }),
    noGoList: fromLines(d.noGoList)
  };
}

function BrandBriefSynthesizing() {
  const { session } = useSession();
  const mountedAtRef = React.useRef<number>(Date.now());
  const recentLogs = (session.logEvents ?? []).filter(
    (e) => e.t >= mountedAtRef.current - 1000
  );
  return (
    <div className="h-full overflow-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand brief</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityLog
            events={recentLogs}
            emptyLabel="synthesizing brand brief…"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function BrandBriefCard() {
  const { session, setSession } = useSession();
  const brief = session.brandBrief;
  const [editing, setEditing] = React.useState(false);
  const [revisions, setRevisions] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft | null>(null);

  if (!brief) {
    return <BrandBriefSynthesizing />;
  }

  const exhausted = revisions >= MAX_REVISIONS;

  function startEdit() {
    if (!brief) return;
    setDraft(briefToDraft(brief));
    setEditing(true);
  }

  function save() {
    if (!draft || !brief) return;
    const next = draftToBrief(draft, brief);
    setSession((prev) => ({ ...prev, brandBrief: next }));
    setRevisions((r) => r + 1);
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
    setDraft(null);
  }

  function approve() {
    setSession((prev) => {
      const jobCount = prev.jobs.length;
      return {
        ...prev,
        phase: 'jobs_review',
        chatMessages: [
          ...prev.chatMessages,
          {
            role: 'assistant',
            content:
              jobCount > 0
                ? `Brief approved. One more thing — while I was on your site I noticed ${jobCount} open roles. Want me to write hiring posts for those too?`
                : 'Brief approved. Moving to posting strategy.'
          }
        ]
      };
    });
  }

  return (
    <div className="h-full overflow-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <CardTitle>Brand brief</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={exhausted ? 'warning' : 'outline'} className="text-xs">
              Revisions {revisions}/{MAX_REVISIONS}
            </Badge>
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={startEdit}
                disabled={exhausted}
                title={exhausted ? 'Revisions exhausted — approve to continue' : 'Edit brief'}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={cancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={save}>
                  Save
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {exhausted && !editing ? (
            <div className="rounded-md border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
              Revisions exhausted — approve to continue.
            </div>
          ) : null}

          {editing && draft ? (
            <EditView draft={draft} setDraft={setDraft} />
          ) : (
            <ReadView brief={brief} />
          )}

          <div className="flex justify-end">
            <Button onClick={approve} disabled={editing}>
              <Check className="mr-1 h-4 w-4" />
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="text-sm text-foreground">{children}</div>
    </section>
  );
}

function ReadView({ brief }: { brief: BrandBrief }) {
  const adj = brief.voice?.adjectives ?? [];
  const sounds = brief.voice?.soundsLike ?? [];
  const doesnt = brief.voice?.doesntSoundLike ?? [];
  return (
    <div className="flex flex-col gap-6">
      <Section title="Positioning">
        <p className="whitespace-pre-wrap">{brief.positioning || '—'}</p>
      </Section>

      <Section title="Audience">
        <p className="whitespace-pre-wrap">{brief.audience || '—'}</p>
      </Section>

      <Section title="Voice">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {adj.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              adj.map((a, i) => (
                <Badge key={`adj-${i}`} variant="secondary">
                  {a}
                </Badge>
              ))
            )}
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sounds like
            </div>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {sounds.length === 0 ? (
                <li className="list-none text-muted-foreground">—</li>
              ) : (
                sounds.map((s, i) => <li key={`s-${i}`}>{s}</li>)
              )}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Doesn&rsquo;t sound like
            </div>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {doesnt.length === 0 ? (
                <li className="list-none text-muted-foreground">—</li>
              ) : (
                doesnt.map((s, i) => (
                  <li key={`d-${i}`} className="text-muted-foreground line-through">
                    {s}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Pillars">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {(brief.pillars ?? []).length === 0 ? (
            <li className="list-none text-muted-foreground">—</li>
          ) : (
            brief.pillars.map((p, i) => <li key={`p-${i}`}>{p}</li>)
          )}
        </ul>
      </Section>

      <Section title="Inspiration patterns">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {(brief.inspirationPatterns ?? []).length === 0 ? (
            <li className="list-none text-muted-foreground">—</li>
          ) : (
            brief.inspirationPatterns.map((p, i) => <li key={`ip-${i}`}>{p}</li>)
          )}
        </ul>
      </Section>

      <Section title="Hiring angles">
        <div className="flex flex-col gap-1">
          {(brief.hiringAngles ?? []).length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            brief.hiringAngles.map((h, i) => (
              <div key={`h-${i}`} className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0 text-xs">
                  {h.jobId}
                </Badge>
                <span>{h.angle}</span>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section title="No-go list">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {(brief.noGoList ?? []).length === 0 ? (
            <li className="list-none text-muted-foreground">—</li>
          ) : (
            brief.noGoList.map((n, i) => (
              <li key={`n-${i}`} className="text-destructive">
                {n}
              </li>
            ))
          )}
        </ul>
      </Section>
    </div>
  );
}

function EditView({
  draft,
  setDraft
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
}) {
  function bind<K extends keyof Draft>(key: K) {
    return {
      value: draft[key],
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        setDraft((d) => (d ? { ...d, [key]: e.target.value } : d))
    };
  }
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <FieldLabel>Positioning</FieldLabel>
        <Textarea rows={2} {...bind('positioning')} />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>Audience</FieldLabel>
        <Textarea rows={2} {...bind('audience')} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <FieldLabel>Voice adjectives</FieldLabel>
          <Textarea rows={4} {...bind('adjectives')} placeholder="one per line" />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel>Sounds like</FieldLabel>
          <Textarea rows={4} {...bind('soundsLike')} placeholder="one per line" />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel>Doesn&rsquo;t sound like</FieldLabel>
          <Textarea rows={4} {...bind('doesntSoundLike')} placeholder="one per line" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>Pillars</FieldLabel>
        <Textarea rows={4} {...bind('pillars')} placeholder="one per line" />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>Inspiration patterns</FieldLabel>
        <Textarea rows={4} {...bind('inspirationPatterns')} placeholder="one per line" />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>Hiring angles</FieldLabel>
        <Textarea
          rows={4}
          {...bind('hiringAngles')}
          placeholder="jobId: angle (one per line)"
        />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>No-go list</FieldLabel>
        <Textarea rows={3} {...bind('noGoList')} placeholder="one per line" />
      </div>
    </div>
  );
}
