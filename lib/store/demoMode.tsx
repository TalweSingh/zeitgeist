'use client';

import * as React from 'react';

const STORAGE_KEY = 'zeitgeist.demo';

type Ctx = {
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
};

const DemoCtx = React.createContext<Ctx | null>(null);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoModeState] = React.useState(false);

  React.useEffect(() => {
    try {
      setDemoModeState(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // ignore
    }
  }, []);

  const setDemoMode = React.useCallback((v: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
    } catch {
      // ignore
    }
    setDemoModeState(v);
  }, []);

  const value = React.useMemo(() => ({ demoMode, setDemoMode }), [demoMode, setDemoMode]);
  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemoMode(): Ctx {
  const ctx = React.useContext(DemoCtx);
  if (!ctx) throw new Error('useDemoMode must be used inside <DemoModeProvider>');
  return ctx;
}
