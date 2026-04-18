'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/store/session';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SlotKey =
  | 'companyUrl'
  | 'oneLiner'
  | 'linkedinHeroes'
  | 'xHeroes'
  | 'favoritePosts'
  | 'audience'
  | 'voicePrefs';

type Slot = {
  key: SlotKey;
  label: string;
  kind: 'text' | 'chips' | 'posts' | 'badges';
};

const SLOTS: Slot[] = [
  { key: 'companyUrl', label: 'Company URL', kind: 'text' },
  { key: 'oneLiner', label: 'One-liner', kind: 'text' },
  { key: 'linkedinHeroes', label: 'LinkedIn heroes', kind: 'chips' },
  { key: 'xHeroes', label: 'X heroes', kind: 'chips' },
  { key: 'favoritePosts', label: 'Favorite posts', kind: 'posts' },
  { key: 'audience', label: 'Audience', kind: 'text' },
  { key: 'voicePrefs', label: 'Voice preferences', kind: 'badges' }
];

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground">
      {children}
    </span>
  );
}

function PostExcerpt({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false);
  const short = text.length > 100 ? text.slice(0, 100).trimEnd() + '…' : text;
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="block w-full rounded-md border border-border bg-muted/50 p-2 text-left text-sm text-foreground transition-all duration-200 hover:bg-muted"
    >
      {open ? text : short}
    </button>
  );
}

function SlotValue({ slot, value }: { slot: Slot; value: unknown }) {
  if (!isFilled(value)) {
    return <span className="text-muted-foreground">—</span>;
  }
  switch (slot.kind) {
    case 'text':
      return <span className="text-foreground">{String(value)}</span>;
    case 'chips':
      return (
        <div className="flex flex-wrap gap-1.5">
          {(value as string[]).map((v, i) => (
            <Chip key={`${slot.key}-${i}`}>{v}</Chip>
          ))}
        </div>
      );
    case 'posts':
      return (
        <div className="flex flex-col gap-1.5">
          {(value as string[]).map((v, i) => (
            <PostExcerpt key={`${slot.key}-${i}`} text={v} />
          ))}
        </div>
      );
    case 'badges':
      return (
        <div className="flex flex-wrap gap-1.5">
          {(value as string[]).map((v, i) => (
            <Badge key={`${slot.key}-${i}`} variant="secondary">
              {v}
            </Badge>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function IntakeBuilder() {
  const { session } = useSession();
  const intake = session.intake ?? {};

  return (
    <div className="h-full overflow-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Intake</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {SLOTS.map((slot) => {
            const raw = (intake as Record<string, unknown>)[slot.key];
            const filled = isFilled(raw);
            return (
              <div
                key={slot.key}
                className={cn(
                  'flex flex-col gap-2 rounded-lg p-3 transition-all duration-200',
                  filled
                    ? 'border border-border bg-card opacity-100'
                    : 'border border-dashed border-border bg-transparent opacity-95'
                )}
              >
                <div className="flex items-center gap-2">
                  {filled ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {slot.label}
                  </span>
                </div>
                <div className="pl-6 text-sm">
                  <SlotValue slot={slot} value={raw} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
