'use client';

import * as React from 'react';
import type { Draft } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Twitter,
  Linkedin,
  Copy,
  Send,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/store/session';
import { useContentBoard } from './ContentBoardContext';

function engagementVariant(e: Draft['predictedEngagement']) {
  if (e === 'high') return { variant: 'success' as const, label: 'High' };
  if (e === 'med') return { variant: 'secondary' as const, label: 'Med' };
  return { variant: 'outline' as const, label: 'Low' };
}

function fitColor(score: number) {
  if (score >= 0.85) return 'bg-success';
  if (score >= 0.7) return 'bg-warning';
  return 'bg-destructive';
}

function fitTextColor(score: number) {
  if (score >= 0.85) return 'text-success';
  if (score >= 0.7) return 'text-warning';
  return 'text-destructive';
}

export function DraftCard({ draft }: { draft: Draft }) {
  const { setSession } = useSession();
  const {
    selectedLearningIdx,
    setSelectedLearningIdx,
    learningApplies,
    getAppliedLearningIdx,
    getSimulatedMetrics,
    getEvidenceRecords,
    learnings
  } = useContentBoard();
  const [publishing, setPublishing] = React.useState(false);
  const [published, setPublished] = React.useState<{ url?: string } | null>(null);
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const eng = engagementVariant(draft.predictedEngagement);
  const score = Math.max(0, Math.min(1, draft.brandFitScore ?? 0));
  const rejected = !!draft.rejected;
  const sim = getSimulatedMetrics(draft);

  // Highlight / dim based on selected learning in sidebar.
  const highlightState: 'matched' | 'dimmed' | 'none' =
    selectedLearningIdx !== null
      ? learningApplies(draft, selectedLearningIdx)
        ? 'matched'
        : 'dimmed'
      : 'none';

  const appliedIdx = getAppliedLearningIdx(draft);
  const appliedLearning = appliedIdx !== null ? learnings[appliedIdx] : null;
  const evidence = appliedIdx !== null ? getEvidenceRecords(appliedIdx) : [];

  async function publish() {
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch('/api/channels/x/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ draft })
      });
      const json = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (json.ok) setPublished({ url: json.url });
      else setPublishError(json.error ?? 'Publish failed');
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
    fetch('/api/channels/linkedin/copy', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: draft.id })
    }).catch(() => {});
  }

  function revise() {
    setSession((prev) => ({
      ...prev,
      drafts: prev.drafts.map((d) => (d.id === draft.id ? { ...d, rejected: undefined } : d))
    }));
  }

  const ChannelIcon = draft.channel === 'x' ? Twitter : Linkedin;

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition-all duration-300',
        rejected ? 'border-destructive' : 'border-border',
        highlightState === 'matched' && 'border-accent ring-2 ring-accent/60',
        highlightState === 'dimmed' && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ChannelIcon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide">
            {draft.channel === 'x' ? 'X' : 'LinkedIn'}
          </span>
          {draft.kind === 'hiring' ? (
            <Badge variant="outline" className="ml-1 text-[10px]">
              Hiring
            </Badge>
          ) : null}
        </div>
        <Badge variant={eng.variant} className="text-[10px]">
          {eng.label}
        </Badge>
      </div>

      <p
        className={cn(
          'whitespace-pre-wrap text-sm text-foreground',
          rejected && 'opacity-70'
        )}
      >
        {draft.body}
      </p>

      {draft.rationale ? (
        <div className="text-xs italic text-muted-foreground">Why: {draft.rationale}</div>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full transition-all duration-200', fitColor(score))}
            style={{ width: `${Math.round(score * 100)}%` }}
          />
        </div>
        <span className={cn('text-xs tabular-nums', fitTextColor(score))}>{score.toFixed(2)}</span>
      </div>

      {sim && !rejected ? (
        <div className="flex items-center justify-between rounded-md border border-accent/40 bg-accent/5 px-2 py-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-accent-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-medium">Next week forecast</span>
          </div>
          <div className="flex gap-2 tabular-nums text-muted-foreground">
            <span>{sim.impressions.toLocaleString()} imp</span>
            <span>{sim.likes.toLocaleString()} likes</span>
            <span>{sim.reposts} rp</span>
            <span className={cn(sim.delta >= 1 ? 'text-success' : 'text-warning')}>
              {sim.delta >= 1 ? '+' : ''}
              {sim.delta.toFixed(2)}×
            </span>
          </div>
        </div>
      ) : null}

      {rejected && draft.rejected ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Blocked: {draft.rejected.reason}</span>
        </div>
      ) : null}

      {appliedLearning ? (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              'flex items-center justify-between rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground transition-all duration-200 hover:border-accent/60 hover:text-accent-foreground',
              expanded && 'border-accent/60 bg-accent/5 text-accent-foreground'
            )}
          >
            <span>Why this draft?</span>
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {expanded ? (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-2">
              <div className="flex items-start gap-1.5 text-[11px] text-foreground">
                <span className="text-accent-foreground">Learning</span>
                <button
                  type="button"
                  onClick={() => setSelectedLearningIdx(appliedIdx)}
                  className="text-left underline decoration-dotted underline-offset-2 hover:text-accent-foreground"
                >
                  {appliedLearning.insight}
                </button>
              </div>
              {evidence.length > 0 ? (
                <div className="flex flex-col gap-1 border-t border-border pt-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Evidence
                  </div>
                  {evidence.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col gap-0.5 text-[11px] text-muted-foreground"
                    >
                      <div className="line-clamp-2 text-foreground/80">
                        {r.body.split('\n')[0]}
                      </div>
                      <div className="flex gap-2 tabular-nums">
                        <span>{r.metrics.impressions.toLocaleString()} imp</span>
                        <span>· {r.metrics.likes.toLocaleString()} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {rejected ? (
          <Button variant="outline" size="sm" onClick={revise}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Revise
          </Button>
        ) : draft.channel === 'x' ? (
          published ? (
            <Button variant="secondary" size="sm" disabled className="gap-1.5">
              <span className="text-success">Published ✓</span>
              {published.url ? (
                <a
                  href={published.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </Button>
          ) : (
            <Button size="sm" onClick={publish} disabled={publishing}>
              <Send className="mr-1 h-3.5 w-3.5" />
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          )
        ) : (
          <Button variant="outline" size="sm" onClick={copy}>
            <Copy className="mr-1 h-3.5 w-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </Button>
        )}
      </div>

      {publishError ? (
        <div className="text-xs text-destructive">{publishError}</div>
      ) : null}
    </div>
  );
}
