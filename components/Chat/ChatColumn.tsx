'use client';

import * as React from 'react';
import type { ChatMessage, Intake, Strategy } from '@/types';
import { useSession } from '@/lib/store/session';
import { useDemoMode } from '@/lib/store/demoMode';
import { PhasePill } from './PhasePill';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { JobsPickerComposer } from './JobsPickerComposer';
import { StrategyFormComposer } from './StrategyFormComposer';
import { OnboardingCard } from './OnboardingCard';
import { WarmingUp } from './WarmingUp';
import { useAgentTurn } from './useAgentTurn';
import { useResearchStream } from './useResearchStream';

export function ChatColumn() {
  const { session, setSession } = useSession();
  const { demoMode, setDemoMode } = useDemoMode();
  const [demoLoading, setDemoLoading] = React.useState(false);
  const agentTurn = useAgentTurn();
  // When research finishes, auto-kick a silent turn so the agent can advance
  // phases with a summary.
  const research = useResearchStream({
    onDone: (result) => {
      agentTurn.send('Research complete. Summarize findings and advance.', {
        silent: true,
        sessionOverride: {
          scrapedData: result.scrapedData ?? undefined,
          jobs: result.jobs
        }
      });
    }
  });

  // One-shot guards for auto-behaviors so they don't fire every render.
  const hasMarkedInterruptedRef = React.useRef(false);
  const hasReconnectedResearchRef = React.useRef(false);
  const kickedBrandSynthesisRef = React.useRef(false);
  const kickedContentGenRef = React.useRef(false);
  const autoJobsPickRef = React.useRef(false);
  const autoApproveBriefRef = React.useRef(false);
  const autoStrategyRef = React.useRef(false);

  // On mount: mark any incomplete assistant stream as [interrupted].
  React.useEffect(() => {
    if (hasMarkedInterruptedRef.current) return;
    hasMarkedInterruptedRef.current = true;
    setSession((prev) => {
      const msgs = prev.chatMessages;
      if (msgs.length === 0) return prev;
      const last = msgs[msgs.length - 1];
      if (last.role === 'assistant' && last.meta?.streaming) {
        const next = msgs.slice();
        next[next.length - 1] = {
          ...last,
          meta: { ...(last.meta ?? {}), streaming: false, interrupted: true }
        };
        return { ...prev, chatMessages: next };
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On mount: if we were mid-research (phase=research & no scrapedData), reconnect.
  React.useEffect(() => {
    if (hasReconnectedResearchRef.current) return;
    if (session.phase === 'research' && !session.scrapedData && !research.running) {
      hasReconnectedResearchRef.current = true;
      research.start({ demo: demoMode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase]);

  // Auto-kickoff: when we land in brand_identity with no brief, fire a silent
  // turn so the agent synthesizes without the user having to type 'go'.
  React.useEffect(() => {
    if (kickedBrandSynthesisRef.current) return;
    if (
      session.phase === 'brand_identity' &&
      !session.brandBrief &&
      !agentTurn.sending
    ) {
      kickedBrandSynthesisRef.current = true;
      agentTurn.send('Synthesize the brand brief now.', { silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase, session.brandBrief]);

  // Auto-kickoff: when we land in content with no drafts, fire a silent turn.
  React.useEffect(() => {
    if (kickedContentGenRef.current) return;
    if (
      session.phase === 'content' &&
      (!session.drafts || session.drafts.length === 0) &&
      !agentTurn.sending
    ) {
      kickedContentGenRef.current = true;
      agentTurn.send('Generate the drafts now.', { silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase, session.drafts]);

  const handleUseDemo = React.useCallback(async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      const res = await fetch('/data/example-intake.json');
      const intake = (await res.json()) as Intake;
      setDemoMode(true);
      const sysMsg: ChatMessage = {
        role: 'system',
        content: '→ Loaded Lumen demo intake. Starting research with cached data.'
      };
      setSession((prev) => ({
        ...prev,
        intake: { ...prev.intake, ...intake },
        phase: 'research',
        chatMessages: [...prev.chatMessages, sysMsg]
      }));
      // Kick research
      await research.start({ demo: true });
    } catch (e) {
      setSession((prev) => ({
        ...prev,
        chatMessages: [
          ...prev.chatMessages,
          { role: 'system', content: 'Failed to load demo intake.' }
        ]
      }));
    } finally {
      setDemoLoading(false);
    }
  }, [demoLoading, research, setDemoMode, setSession]);

  const handleUserText = React.useCallback(
    (text: string) => {
      agentTurn.send(text);
    },
    [agentTurn]
  );

  const handleJobsSubmit = React.useCallback(
    (selectedIds: string[]) => {
      // Update selected flags first.
      setSession((prev) => ({
        ...prev,
        jobs: prev.jobs.map((j) => ({ ...j, selected: selectedIds.includes(j.id) }))
      }));
      const titles = session.jobs
        .filter((j) => selectedIds.includes(j.id))
        .map((j) => j.title);
      const text = `Write posts for: ${titles.join(', ')}`;
      agentTurn.send(text);
    },
    [agentTurn, session.jobs, setSession]
  );

  const handleStrategySubmit = React.useCallback(
    (strategy: Strategy) => {
      setSession((prev) => ({ ...prev, strategy }));
      const summary = [
        `Strategy set: channels=${strategy.channels.join('+') || 'none'}`,
        `cadence=${strategy.cadence}`,
        `reply accounts=${strategy.targetReplyAccounts.join(', ') || 'none'}`,
        `auto-post X=${strategy.autoPostX ? 'on' : 'off'}`
      ].join('; ');
      agentTurn.send(summary);
    },
    [agentTurn, setSession]
  );

  // ---------- Demo-mode auto-advance ----------
  // In demo mode we skip the manual pickers so the user reaches the content
  // dashboard fast. Each step drops a system message so the auto-action is
  // visible rather than invisible magic.

  // jobs_review: auto-select every open role so the hiring section on the
  // dashboard appears as a "bonus the agent found on its own".
  React.useEffect(() => {
    if (!demoMode) return;
    if (autoJobsPickRef.current) return;
    if (session.phase !== 'jobs_review') return;
    if (session.jobs.length === 0) return;
    if (agentTurn.sending) return;
    autoJobsPickRef.current = true;
    const ids = session.jobs.map((j) => j.id);
    const t = setTimeout(() => {
      setSession((prev) => ({
        ...prev,
        chatMessages: [
          ...prev.chatMessages,
          { role: 'system', content: `→ demo: agent picked up ${ids.length} open roles as bonus hiring posts` }
        ]
      }));
      handleJobsSubmit(ids);
    }, 800);
    return () => clearTimeout(t);
  }, [demoMode, session.phase, session.jobs, agentTurn.sending, handleJobsSubmit, setSession]);

  // brand_identity: once the brief has streamed in, auto-approve and advance.
  React.useEffect(() => {
    if (!demoMode) return;
    if (autoApproveBriefRef.current) return;
    if (session.phase !== 'brand_identity') return;
    if (!session.brandBrief) return;
    if (agentTurn.sending) return;
    autoApproveBriefRef.current = true;
    const t = setTimeout(() => {
      setSession((prev) => ({
        ...prev,
        phase: 'strategy',
        chatMessages: [
          ...prev.chatMessages,
          { role: 'system', content: '→ demo: brief auto-approved. strategy starting' }
        ]
      }));
    }, 1500);
    return () => clearTimeout(t);
  }, [demoMode, session.phase, session.brandBrief, agentTurn.sending, setSession]);

  // strategy: auto-submit demo defaults so content generation kicks off.
  React.useEffect(() => {
    if (!demoMode) return;
    if (autoStrategyRef.current) return;
    if (session.phase !== 'strategy') return;
    if (session.strategy) return;
    if (agentTurn.sending) return;
    autoStrategyRef.current = true;
    const t = setTimeout(() => {
      const xHeroes = (session.intake?.xHeroes ?? []).slice(0, 3);
      const fallback = ['@dhh', '@rauchg', '@mipsytipsy'];
      const strategy: Strategy = {
        channels: ['x', 'linkedin'],
        cadence: '3x-weekly',
        targetReplyAccounts: xHeroes.length ? xHeroes : fallback,
        autoPostX: false
      };
      setSession((prev) => ({
        ...prev,
        chatMessages: [
          ...prev.chatMessages,
          { role: 'system', content: '→ demo: strategy auto-set (X + LinkedIn, 3x-weekly, auto-post off)' }
        ]
      }));
      handleStrategySubmit(strategy);
    }, 800);
    return () => clearTimeout(t);
  }, [demoMode, session.phase, session.strategy, session.intake, agentTurn.sending, handleStrategySubmit, setSession]);

  const showOnboarding =
    session.phase === 'intake' && session.chatMessages.length === 0 && !agentTurn.sending;
  const showWarmingUp =
    session.phase === 'research' &&
    session.logEvents.length === 0 &&
    (research.running || !session.scrapedData);

  const renderComposer = () => {
    const sending = agentTurn.sending;
    if (session.phase === 'jobs_review') {
      return (
        <JobsPickerComposer
          jobs={session.jobs}
          disabled={sending}
          onSubmit={handleJobsSubmit}
        />
      );
    }
    if (session.phase === 'strategy') {
      return (
        <StrategyFormComposer
          demoMode={demoMode}
          disabled={sending}
          onSubmit={handleStrategySubmit}
        />
      );
    }
    // Default text composer (intake, research, brand_identity, content)
    const placeholder =
      session.phase === 'research'
        ? 'Research running—say “continue” once it finishes.'
        : undefined;
    return (
      <Composer
        onSubmit={handleUserText}
        disabled={sending || research.running}
        placeholder={placeholder}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <PhasePill phase={session.phase} />
        {demoMode ? (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            demo mode
          </span>
        ) : null}
      </div>

      <MessageList
        messages={session.chatMessages}
        emptyState={
          showOnboarding ? (
            <OnboardingCard onUseDemo={handleUseDemo} demoLoading={demoLoading} />
          ) : showWarmingUp ? (
            <WarmingUp label="Warming up research…" />
          ) : null
        }
      />

      {agentTurn.error ? (
        <div className="border-t border-destructive/40 bg-destructive/10 px-4 py-1 text-xs text-destructive">
          {agentTurn.error}
        </div>
      ) : null}
      {research.error ? (
        <div className="border-t border-warning/40 bg-warning/10 px-4 py-1 text-xs text-warning">
          research: {research.error}
        </div>
      ) : null}

      <div className="space-y-2 border-t border-border p-3">
        {session.phase === 'intake' && session.chatMessages.length === 0 ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUseDemo}
              disabled={demoLoading}
              className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {demoLoading ? 'Loading…' : 'Use Lumen demo'}
            </button>
          </div>
        ) : null}
        {renderComposer()}
      </div>
    </div>
  );
}
