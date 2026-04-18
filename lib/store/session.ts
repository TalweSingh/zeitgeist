'use client';

import * as React from 'react';
import type { Session, PerformanceRecord } from '@/types';

const STORAGE_KEY = 'zeitgeist.session';
const WRITE_DEBOUNCE_MS = 200;

function makeInitialSession(): Session {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    phase: 'intake',
    chatMessages: [
      {
        role: 'assistant' as const,
        content:
          'Zeitgeist is your autonomous growth engine for LinkedIn and X — it interviews you, builds a brand brain from your world, and generates content that ships on autopilot.',
        meta: { preseeded: true }
      },
      {
        role: 'assistant' as const,
        content:
          'To get started — are you building this for a brand or company, or for yourself as an individual?',
        meta: { preseeded: true }
      }
    ],
    intake: {},
    jobs: [],
    drafts: [],
    performanceHistory: [],
    logEvents: []
  };
}

type SessionContextValue = {
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  updateSession: (patch: Partial<Session>) => void;
  resetSession: () => void;
};

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session>(() => makeInitialSession());
  const [hydrated, setHydrated] = React.useState(false);
  const writeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rehydrate from localStorage on mount, then merge seeded performance history.
  React.useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const raw =
          typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        let base: Session = raw ? (JSON.parse(raw) as Session) : makeInitialSession();
        // Merge in history seed if empty.
        if (!base.performanceHistory || base.performanceHistory.length === 0) {
          try {
            const res = await fetch('/data/history.json');
            if (res.ok) {
              const history = (await res.json()) as PerformanceRecord[];
              base = { ...base, performanceHistory: history };
            }
          } catch {
            // noop: seed is best-effort
          }
        }
        if (!cancelled) {
          setSession(base);
          setHydrated(true);
        }
      } catch {
        if (!cancelled) setHydrated(true);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced write to localStorage after hydration.
  React.useEffect(() => {
    if (!hydrated) return;
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch {
        // storage may be full or disabled; ignore
      }
    }, WRITE_DEBOUNCE_MS);
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [session, hydrated]);

  const updateSession = React.useCallback((patch: Partial<Session>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSession = React.useCallback(() => {
    const fresh = makeInitialSession();
    setSession(fresh);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = React.useMemo<SessionContextValue>(
    () => ({ session, setSession, updateSession, resetSession }),
    [session, updateSession, resetSession]
  );

  return React.createElement(SessionContext.Provider, { value }, children);
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
  return ctx;
}
