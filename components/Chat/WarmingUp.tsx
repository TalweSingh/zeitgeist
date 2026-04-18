'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';

export function WarmingUp({ label = 'Warming up…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      {label}
    </div>
  );
}
